import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fetch from 'node-fetch'

// 内存缓存
const imageCache = new Map()
const MAX_CACHE_SIZE = 100
const CACHE_TTL = 1000 * 60 * 30 // 30分钟

// 图片代理中间件
function imageProxyPlugin() {
  return {
    name: 'image-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // 只处理图片代理请求
        if (!req.url.startsWith('/api/image-proxy')) {
          return next()
        }

        const url = new URL(req.url, `http://${req.headers.host}`)
        const imageUrl = url.searchParams.get('url')

        if (!imageUrl) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: '缺少 url 参数' }))
          return
        }

        try {
          // 检查缓存
          if (imageCache.has(imageUrl)) {
            const cached = imageCache.get(imageUrl)
            const now = Date.now()

            if (now - cached.timestamp < CACHE_TTL) {
              console.log('✓ 使用缓存:', imageUrl)
              res.setHeader('Content-Type', cached.contentType)
              res.setHeader('X-Cache', 'HIT')
              res.setHeader('Cache-Control', 'public, max-age=1800')
              res.end(cached.buffer)
              return
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

          // 存入缓存（LRU）
          if (imageCache.size >= MAX_CACHE_SIZE) {
            const firstKey = imageCache.keys().next().value
            imageCache.delete(firstKey)
          }
          imageCache.set(imageUrl, {
            buffer,
            contentType,
            timestamp: Date.now()
          })

          console.log(`  缓存: ${imageCache.size}/${MAX_CACHE_SIZE}`)

          res.setHeader('Content-Type', contentType)
          res.setHeader('X-Cache', 'MISS')
          res.setHeader('Cache-Control', 'public, max-age=1800')
          res.end(buffer)

        } catch (error) {
          console.error('✗ 获取图片失败:', error.message)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: '获取图片失败',
            message: error.message,
            url: imageUrl
          }))
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), imageProxyPlugin()],
  base: './',
  server: {
    proxy: {
      // 代理 B 站 API
      '/mir6': {
        target: 'https://api.mir6.com',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/mir6/, ''),
      }
    }
  }
})
