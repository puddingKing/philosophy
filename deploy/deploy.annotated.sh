#!/usr/bin/env bash
# deploy/deploy.annotated.sh
# 带注释的部署脚本副本，用于说明每个命令的作用。
# 请注意：这个文件仅用于阅读和参考，真正执行时仍然使用 deploy/deploy.sh。

set -euo pipefail

# SCRIPT_DIR：脚本本身所在目录 deploy/
# PROJECT_DIR：项目根目录 philosophy/
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 远程部署目标主机，例如 root@1.2.3.4
# 如果未设置，则默认为空
DEPLOY_HOST="${DEPLOY_HOST:-}"

# 远程部署目录，默认 /opt/philosophy
REMOTE_DIR="${REMOTE_DIR:-/opt/philosophy}"

# 部署域名，用于生成 PUBLIC_API_URL 和安装 Nginx 配置
DOMAIN="${DOMAIN:-}"

# 是否启用本地部署模式（不进行远程同步）
LOCAL_MODE=false

# 如果第一个参数是 --local，则进入本地部署模式
if [[ "${1:-}" == "--local" ]]; then
  LOCAL_MODE=true
fi

# 统一打印前缀
log() { echo "[deploy] $*"; }

# 如果项目根目录没有 .env，则自动生成一份
generate_env_if_needed() {
  if [[ -f "$PROJECT_DIR/.env" ]]; then
    return
  fi

  if [[ -z "$DOMAIN" ]]; then
    log "错误: 未找到 .env 且未设置 DOMAIN"
    exit 1
  fi

  # 生成随机 secret / 密码
  JWT_SECRET=$(openssl rand -base64 32)
  DB_PASS=$(openssl rand -base64 16 | tr -d '/+=' | head -c 24)
  ADMIN_PASS=$(openssl rand -base64 12 | tr -d '/+=' | head -c 16)

  # 写入 .env
  cat > "$PROJECT_DIR/.env" <<EOF
POSTGRES_USER=philosophy
POSTGRES_PASSWORD=${DB_PASS}
POSTGRES_DB=philosophy
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=${ADMIN_PASS}
PUBLIC_API_URL=https://${DOMAIN}
CORS_ORIGIN=https://${DOMAIN}
EOF

  log "已生成 .env（请保存管理员密码）"
  log "  ADMIN_USERNAME=admin"
  log "  ADMIN_PASSWORD=${ADMIN_PASS}"
}

# 检查 .env 是否存在并提示占位符风险
check_env() {
  generate_env_if_needed

  if grep -q "change-me-in-production\|请改为" "$PROJECT_DIR/.env" 2>/dev/null; then
    log "警告: .env 含占位符，请确认 JWT_SECRET / ADMIN_PASSWORD 已设置"
  fi
}

# 远程检查 Docker，如果未安装则自动安装
install_docker_remote() {
  log "检查 Docker..."
  ssh "$DEPLOY_HOST" "command -v docker >/dev/null 2>&1 || (
    curl -fsSL https://get.docker.com | sh &&
    systemctl enable docker &&
    systemctl start docker
  )"
}

# 同步项目文件到远程服务器
sync_files() {
  log "同步代码到 $DEPLOY_HOST:$REMOTE_DIR ..."
  ssh "$DEPLOY_HOST" "mkdir -p $REMOTE_DIR"

  # rsync 同步目录，排除不必要的开发产物与本地构建结果
  rsync -avz --delete \
    --exclude node_modules \
    --exclude dist \
    --exclude dist-h5 \
    --exclude .git \
    --exclude services/api/uploads \
    --exclude '*.local' \
    "$PROJECT_DIR/" "$DEPLOY_HOST:$REMOTE_DIR/"

  # 单独拷贝 .env
  scp "$PROJECT_DIR/.env" "$DEPLOY_HOST:$REMOTE_DIR/.env"
}

# 构建 H5 页面并同步到远程 h5 目录
build_and_sync_h5() {
  log "构建 H5..."
  (cd "$PROJECT_DIR" && yarn build:h5)

  log "同步 H5 静态文件到 $DEPLOY_HOST:$REMOTE_DIR/h5 ..."
  ssh "$DEPLOY_HOST" "mkdir -p $REMOTE_DIR/h5"
  rsync -avz --delete \
    "$PROJECT_DIR/dist-h5/" "$DEPLOY_HOST:$REMOTE_DIR/h5/"
}

# 安装 Nginx 配置到远程服务器
install_nginx_config() {
  if [[ -z "$DOMAIN" ]]; then
    log "跳过 Nginx 配置（未设置 DOMAIN）"
    return
  fi

  local conf="$PROJECT_DIR/deploy/nginx/philosophy.conf"
  local tmp="/tmp/philosophy-nginx-$$.conf"

  # 替换模板中的占位域名为实际域名
  sed "s/yourdomain.com/${DOMAIN}/g" "$conf" > "$tmp"

  log "安装 Nginx 配置..."
  scp "$tmp" "$DEPLOY_HOST:/tmp/philosophy.conf"
  ssh "$DEPLOY_HOST" "
    if command -v nginx >/dev/null 2>&1; then
      sudo cp /tmp/philosophy.conf /etc/nginx/sites-available/philosophy.conf
      sudo ln -sf /etc/nginx/sites-available/philosophy.conf /etc/nginx/sites-enabled/philosophy.conf
      sudo nginx -t && sudo systemctl reload nginx
      echo 'Nginx 配置已更新'
    else
      echo '未检测到 Nginx，请手动配置 deploy/nginx/philosophy.conf'
    fi
  "
  rm -f "$tmp"
}

# 在本地环境执行 Docker Compose 启动
deploy_compose() {
  local dir="$1"
  log "构建并启动 Docker Compose..."
  cd "$dir"

  # 同时加载开发和生产 Compose 文件，构建并后台启动
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
  sleep 5
  docker compose ps

  # 简单健康检查 API 是否可用
  curl -sf "http://127.0.0.1:3000/api/health" && log "API 健康检查通过" || log "警告: API 健康检查失败"
}

# 打印部署摘要信息
print_summary() {
  log "=========================================="
  log "部署完成"
  if [[ -n "$DOMAIN" ]]; then
    log "  H5 网页:  https://${DOMAIN}/app/"
    log "  管理后台: https://${DOMAIN}/admin/"
    log "  API:      https://${DOMAIN}/api/health"
    log "  小程序 API_BASE_URL: https://${DOMAIN}"
  else
    log "  H5 网页:  http://服务器IP/app/"
    log "  管理后台: http://服务器IP:8080/admin/"
    log "  API:      http://服务器IP:3000/api/health"
  fi
  log "  管理员密码见 .env 中 ADMIN_PASSWORD"
  log "=========================================="
}

# 主流程函数
main() {
  check_env

  if $LOCAL_MODE; then
    deploy_compose "$PROJECT_DIR"
    print_summary
    return
  fi

  if [[ -z "$DEPLOY_HOST" ]]; then
    log "用法:"
    log "  DEPLOY_HOST=root@1.2.3.4 DOMAIN=example.com $0"
    log "  服务器本地: DOMAIN=example.com $0 --local"
    exit 1
  fi

  install_docker_remote
  sync_files
  build_and_sync_h5

  # 远程服务器上执行本地部署逻辑
  ssh "$DEPLOY_HOST" "cd $REMOTE_DIR && chmod +x deploy/deploy.sh && DOMAIN=${DOMAIN} ./deploy/deploy.sh --local"
  install_nginx_config
  print_summary
}

main "$@"
