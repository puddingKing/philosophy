# 哲学学习 Monorepo

微信小程序 + Web 管理后台 + REST API（PostgreSQL + JWT 鉴权）。

## 项目结构

```text
philosophy/
├── src/                      # Taro 微信小程序
├── apps/admin/               # Web 管理后台（登录 + CRUD）
├── services/api/             # REST API（Fastify + PostgreSQL）
├── packages/shared/          # 共享类型
├── docker-compose.yml        # 一键部署
└── deploy/README.md          # 部署详细文档
```

## 快速开始（本地开发）

```bash
# 1. 安装依赖
yarn install

# 2. 启动 PostgreSQL（Docker）
docker compose up -d postgres

# 3. 配置 API 环境变量
cp services/api/.env.example services/api/.env

# 4. 启动 API + 管理后台
yarn dev:api      # http://localhost:3000
yarn dev:admin    # http://localhost:5173

# 5. 小程序
yarn dev:weapp
```

**管理后台登录**：`admin` / `admin123`（可在 `services/api/.env` 修改 `ADMIN_USERNAME` / `ADMIN_PASSWORD`，仅首次 seed 生效）

## Docker 一键部署

```bash
cp .env.example .env   # 修改 JWT_SECRET、ADMIN_PASSWORD
yarn docker:up
```

- API：http://localhost:3000
- 管理后台：http://localhost:8080

详见 [deploy/README.md](deploy/README.md)。

## 鉴权

| 接口 | 鉴权 |
|------|------|
| `GET /api/philosophers` | 公开（小程序） |
| `POST /api/auth/login` | 公开 |
| 创建/编辑/删除/上传头像 | JWT Bearer Token |

## 小程序 API 配置

修改 [`src/services/api.ts`](src/services/api.ts) 中的 `API_BASE_URL` 指向你的 API 地址。
