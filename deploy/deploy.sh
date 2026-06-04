#!/usr/bin/env bash
# 哲学学习项目 - 服务器部署脚本
#
# 远程一键部署：
#   DEPLOY_HOST=root@your-server-ip \
#   DOMAIN=yourdomain.com \
#   ./deploy/deploy.sh
#
# 在服务器上本地部署：
#   DOMAIN=yourdomain.com ./deploy/deploy.sh --local

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DEPLOY_HOST="${DEPLOY_HOST:-}"
REMOTE_DIR="${REMOTE_DIR:-/opt/philosophy}"
DOMAIN="${DOMAIN:-}"
LOCAL_MODE=false

if [[ "${1:-}" == "--local" ]]; then
  LOCAL_MODE=true
fi

log() { echo "[deploy] $*"; }

generate_env_if_needed() {
  if [[ -f "$PROJECT_DIR/.env" ]]; then
    return
  fi

  if [[ -z "$DOMAIN" ]]; then
    log "错误: 未找到 .env 且未设置 DOMAIN"
    exit 1
  fi

  JWT_SECRET=$(openssl rand -base64 32)
  DB_PASS=$(openssl rand -base64 16 | tr -d '/+=' | head -c 24)
  ADMIN_PASS=$(openssl rand -base64 12 | tr -d '/+=' | head -c 16)

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

check_env() {
  generate_env_if_needed

  if grep -q "change-me-in-production\|请改为" "$PROJECT_DIR/.env" 2>/dev/null; then
    log "警告: .env 含占位符，请确认 JWT_SECRET / ADMIN_PASSWORD 已设置"
  fi
}

install_docker_remote() {
  log "检查 Docker..."
  ssh "$DEPLOY_HOST" "command -v docker >/dev/null 2>&1 || (
    curl -fsSL https://get.docker.com | sh &&
    systemctl enable docker &&
    systemctl start docker
  )"
}

sync_files() {
  log "同步代码到 $DEPLOY_HOST:$REMOTE_DIR ..."
  ssh "$DEPLOY_HOST" "mkdir -p $REMOTE_DIR"
  rsync -avz --delete \
    --exclude node_modules \
    --exclude dist \
    --exclude .git \
    --exclude services/api/uploads \
    --exclude '*.local' \
    "$PROJECT_DIR/" "$DEPLOY_HOST:$REMOTE_DIR/"
  scp "$PROJECT_DIR/.env" "$DEPLOY_HOST:$REMOTE_DIR/.env"
}

install_nginx_config() {
  if [[ -z "$DOMAIN" ]]; then
    log "跳过 Nginx 配置（未设置 DOMAIN）"
    return
  fi

  local conf="$PROJECT_DIR/deploy/nginx/philosophy.conf"
  local tmp="/tmp/philosophy-nginx-$$.conf"
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

deploy_compose() {
  local dir="$1"
  log "构建并启动 Docker Compose..."
  cd "$dir"
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
  sleep 5
  docker compose ps
  curl -sf "http://127.0.0.1:3000/api/health" && log "API 健康检查通过" || log "警告: API 健康检查失败"
}

print_summary() {
  log "=========================================="
  log "部署完成"
  if [[ -n "$DOMAIN" ]]; then
    log "  管理后台: https://${DOMAIN}/admin/"
    log "  API:      https://${DOMAIN}/api/health"
    log "  小程序 API_BASE_URL: https://${DOMAIN}"
  else
    log "  管理后台: http://服务器IP:8080/admin/"
    log "  API:      http://服务器IP:3000/api/health"
  fi
  log "  管理员密码见 .env 中 ADMIN_PASSWORD"
  log "=========================================="
}

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
  ssh "$DEPLOY_HOST" "cd $REMOTE_DIR && chmod +x deploy/deploy.sh && DOMAIN=${DOMAIN} ./deploy/deploy.sh --local"
  install_nginx_config
  print_summary
}

main "$@"
