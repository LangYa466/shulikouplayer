import express from 'express'
import fetch from 'node-fetch'

const app = express()
const PORT = 3001

// 内存缓存
const imageCache = new Map()
const MAX_CACHE_SIZE = 100
const CACHE_TTL = 1000 * 60 * 30 // 30分钟

// LRU 缓存清理
function cleanCache() {
  if (imageCache.size > MAX_CACHE_SIZE) {
    const firstKey = imageCache.keys().next().value
    imageCache.delete(firstKey)
  }
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  next()
})

// 图片代理路由 - 与 Vercel Function 保持一致
app.get('/api/image-proxy', async (req, res) => {
  const imageUrl = req.query.url

  if (!imageUrl) {
    return res.status(400).json({ error: '缺少 url 参数' })
  }

  try {
    // 检查缓存
    if (imageCache.has(imageUrl)) {
      const cached = imageCache.get(imageUrl)
      const now = Date.now()

      if (now - cached.timestamp < CACHE_TTL) {
        console.log('✓ 使用缓存:', imageUrl)
        res.set('Content-Type', cached.contentType)
        res.set('X-Cache', 'HIT')
        res.set('Cache-Control', 'public, max-age=1800')
        return res.send(cached.buffer)
      } else {
        imageCache.delete(imageUrl)
      }
    }

    // 尝试直接获取图片（HTTPS）
    const httpsUrl = imageUrl.replace('http://', 'https://')
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
      console.log('✓ 直接获取成功')
    } catch (directError) {
      // 直接获取失败，使用公共代理
      console.log('✗ 直接获取失败，使用公共代理')
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}`
      response = await fetch(proxyUrl, { timeout: 15000 })

      if (!response.ok) {
        throw new Error(`代理获取失败: ${response.status}`)
      }
      console.log('✓ 公共代理成功')
    }

    const buffer = await response.buffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // 存入缓存
    cleanCache()
    imageCache.set(imageUrl, {
      buffer,
      contentType,
      timestamp: Date.now()
    })

    console.log(`  缓存: ${imageCache.size}/${MAX_CACHE_SIZE}`)

    res.set('Content-Type', contentType)
    res.set('X-Cache', 'MISS')
    res.set('Cache-Control', 'public, max-age=1800')
    res.send(buffer)

  } catch (error) {
    console.error('✗ 获取图片失败:', error.message)
    res.status(500).json({
      error: '获取图片失败',
      message: error.message,
      url: imageUrl
    })
  }
})

app.listen(PORT, () => {
  console.log(`\n🖼️  图片代理服务器运行在 http://localhost:${PORT}`)
  console.log(`   用于本地开发，部署到 Vercel 后会自动使用 Serverless Function\n`)
})

export default app
