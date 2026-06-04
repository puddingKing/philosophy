# 服务器部署指南

## 架构（路径方案）

```text
https://yourdomain.com/admin/   → 管理后台（Docker :8081）
https://yourdomain.com/api/     → REST API（Docker :3001）
https://yourdomain.com/uploads/ → 头像文件
```

主机 **Nginx** 负责 HTTPS，反代到 Docker 容器。

---

## 一键部署（推荐）

在**本地**项目目录执行：

```bash
# 1. 准备环境变量（或让脚本自动生成）
cp .env.example .env
# 编辑 .env，设置 PUBLIC_API_URL=https://你的域名 等

# 2. 远程部署
chmod +x deploy/deploy.sh
DEPLOY_HOST=root@你的服务器IP \
DOMAIN=你的域名.com \
./deploy/deploy.sh
```

脚本会自动：

1. 同步代码到服务器 `/opt/philosophy`
2. 安装 Docker（若未安装）
3. `docker compose up -d --build` 启动 PostgreSQL + API + Admin
4. 安装 Nginx 配置（`deploy/nginx/philosophy.conf`）

---

## 服务器前置条件

- Linux 服务器（Ubuntu 20.04+ / Debian 11+ 等）
- 已开放端口：**80、443**（Nginx HTTPS）
- 域名 **A 记录** 已指向服务器 IP
- **SSL 证书**已配置（Let's Encrypt / 云厂商证书）
  - 部署脚本会写入 Nginx 配置，但证书路径需按 [`deploy/nginx/philosophy.conf`](nginx/philosophy.conf) 修改

---

## 手动部署（在服务器上）

```bash
# 上传代码到 /opt/philosophy 后
cd /opt/philosophy
cp .env.example .env   # 编辑配置
chmod +x deploy/deploy.sh
DOMAIN=你的域名.com ./deploy/deploy.sh --local
```

---

## Nginx 配置

### 标准 Nginx（无宝塔）

模板：[`deploy/nginx/philosophy.conf`](nginx/philosophy.conf)

| 路径 | 转发目标 |
|------|----------|
| `/api/` | `127.0.0.1:3001` |
| `/uploads/` | `127.0.0.1:3001` |
| `/admin/` | `127.0.0.1:8081` |

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 宝塔面板（OpenCloudOS / 已有 WordPress 站点）

**对外流量由宝塔 Nginx 处理**，不要改 `/etc/nginx/conf.d/`。

1. 编辑站点配置：`/www/server/panel/vhost/nginx/<域名>.conf`
2. 将 [`deploy/nginx/baota-philosophy-locations.conf`](nginx/baota-philosophy-locations.conf) 中的 `location` 块插入 `server { }` 内，放在 WordPress `root` / PHP 规则**之前**
3. 重载：

```bash
/www/server/nginx/sbin/nginx -t && /www/server/nginx/sbin/nginx -s reload
```

验证：

```bash
curl https://www.luca0527.art/api/health    # {"status":"ok"}
curl -I https://www.luca0527.art/admin/     # 200
```

---

## 小程序配置

部署完成后，修改 [`src/services/api.ts`](../src/services/api.ts)：

```typescript
export const API_BASE_URL = 'https://你的域名.com'
```

重新编译小程序 `yarn build:weapp`，并在微信公众平台配置 **request 合法域名** 为你的域名。

---

## 常用运维命令

```bash
# 查看日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api

# 重启服务
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart

# 重置管理员密码（在服务器项目目录）
docker compose exec api node -e "..."  # 或本地 yarn reset-admin 连远程 DB
```

---

## 环境变量说明

| 变量 | 说明 |
|------|------|
| `PUBLIC_API_URL` | 必须是 `https://域名`（头像 URL 依赖） |
| `CORS_ORIGIN` | 管理后台来源，路径方案填 `https://域名` |
| `JWT_SECRET` | 随机长字符串 |
| `ADMIN_PASSWORD` | 仅首次 seed 生效；之后用 `yarn reset-admin` |
