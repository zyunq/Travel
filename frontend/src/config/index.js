/**
 * 统一配置文件
 */

// API 基础地址配置
const API_CONFIG = {
  // 开发环境
  dev: 'http://localhost:3000/api',
  // 生产环境
  prod: '/api'
}

// 判断当前环境
const isDev = import.meta.env?.DEV ?? (location.hostname === 'localhost' || location.hostname === '127.0.0.1')

// 导出 API 基础地址
export const BASE_URL = isDev ? API_CONFIG.dev : API_CONFIG.prod

// 导出其他配置
export const config = {
  baseUrl: BASE_URL,
  isDev
}

export default config
