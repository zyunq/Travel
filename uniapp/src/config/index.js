/**
 * 小程序统一配置文件
 */

// API 基础地址配置
const API_CONFIG = {
  // 开发环境
  dev: 'http://localhost:3000/api',
  // 生产环境
  prod: 'http://101.34.71.12/api'
}

// 判断当前环境（小程序环境判断）
const isDev = typeof __wxConfig !== 'undefined' && __wxConfig.envVersion !== 'release'

// 导出 API 基础地址
export const BASE_URL = isDev ? API_CONFIG.dev : API_CONFIG.prod

// 导出其他配置
export const config = {
  baseUrl: BASE_URL,
  isDev
}

export default config
