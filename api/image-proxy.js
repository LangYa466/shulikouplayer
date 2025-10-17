// Vercel Serverless Function - 图片代理
import fetch from 'node-fetch'

// 内存缓存（注意：Serverless 函数的内存是临时的）
const cache = new Map()
const CACHE_TTL = 1000 * 60 * 30 // 30分钟

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: '缺少 url 参数' })
  }

  try {
    // 检查缓存
    const cached = cache.get(url)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✓ 使用缓存:', url)
      res.setHeader('Content-Type', cached.contentType)
      res.setHeader('X-Cache', 'HIT')
      res.setHeader('Cache-Control', 'public, max-age=1800') // 30分钟
      return res.send(cached.buffer)
    }

    // 尝试直接获取（HTTPS）
    const httpsUrl = url.replace('http://', 'https://')
    console.log('→ 获取图片:', httpsUrl)

    let response
    try {
      response = await fetch(httpsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.bilibili.com/',
        },
        timeout: 15000
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (directError) {
      // 直接获取失败，使用公共代理
      console.log('✗ 直接获取失败，使用公共代理')
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`
      response = await fetch(proxyUrl, { timeout: 15000 })

      if (!response.ok) {
        throw new Error(`代理获取失败: ${response.status}`)
      }
    }

    const buffer = await response.buffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // 存入缓存（限制缓存大小）
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }
    cache.set(url, { buffer, contentType, timestamp: Date.now() })

    res.setHeader('Content-Type', contentType)
    res.setHeader('X-Cache', 'MISS')
    res.setHeader('Cache-Control', 'public, max-age=1800')
    res.send(buffer)

  } catch (error) {
    console.error('✗ 获取图片失败:', error.message)
    res.status(500).json({
      error: '获取图片失败',
      message: error.message
    })
  }
}

