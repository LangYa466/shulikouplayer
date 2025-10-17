// 图片代理工具 - 使用 Vercel Serverless Function 代理图片

/**
 * 获取代理后的图片 URL
 * @param {string} url - 原始图片 URL
 * @returns {string} - 代理后的 URL
 */
export function getProxiedImageUrl(url) {
  if (!url) return ''

  // 使用相对路径，自动适配当前域名（本地开发 localhost:5173，生产环境 vercel 域名）
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}

/**
 * 清理图片代理缓存
 */
export async function clearImageProxyCache() {
  try {
    const response = await fetch(`/api/clear-cache`, {
      method: 'POST'
    })
    return await response.json()
  } catch (error) {
    console.error('清理缓存失败:', error)
    return { error: error.message }
  }
}

/**
 * 获取代理服务器状态
 */
export async function getProxyStatus() {
  try {
    const response = await fetch(`/api/health`)
    return await response.json()
  } catch (error) {
    console.error('获取代理状态失败:', error)
    return { error: error.message }
  }
}
