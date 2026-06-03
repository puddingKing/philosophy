import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://philosophy:philosophy@localhost:5432/philosophy',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  /** 对外 API 基础 URL，用于生成头像等绝对路径（生产环境必填） */
  publicApiUrl: process.env.PUBLIC_API_URL || `http://localhost:${Number(process.env.PORT) || 3000}`,
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : true,
}
