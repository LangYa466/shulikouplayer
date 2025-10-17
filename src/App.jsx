import React, { useEffect, useMemo, useState } from 'react'
import ThemeToggle from './components/ThemeToggle.jsx'
import Playlist from './components/Playlist.jsx'
import Player from './components/Player.jsx'
import { parseBilibili } from './lib/api.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'

function isBiliUrl(url) {
  try {
    const u = new URL(url)
    return u.hostname.includes('bilibili.com') || u.hostname.includes('b23.tv')
  } catch {
    return false
  }
}

// Extract Bilibili URL from text (supports format like: 【Title】 https://...)
function extractBiliUrl(text) {
  // Match bilibili.com or b23.tv URLs
  const urlPattern = /(https?:\/\/(?:www\.)?(?:bilibili\.com\/video\/[^\s]+|b23\.tv\/[^\s]+))/i
  const match = text.match(urlPattern)
  if (match) {
    return match[1]
  }
  // If no URL found, return original text (might be a direct URL)
  return text.trim()
}

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export default function App() {
  const [theme, setTheme] = useLocalStorage('slks-theme', 'light')
  const [playlist, setPlaylist] = useLocalStorage('slks-playlist', [])
  const [currentIndex, setCurrentIndex] = useLocalStorage('slks-current-index', 0)
  const [loopList, setLoopList] = useLocalStorage('slks-loop', true)
  const [inputUrl, setInputUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const currentItem = playlist[currentIndex] || null
  const nextItem = useMemo(() => {
    if (!playlist.length) return null
    const nextIdx = (currentIndex + 1) % playlist.length
    return playlist[nextIdx]
  }, [playlist, currentIndex])

  async function handleAdd() {
    setError('')
    const rawInput = inputUrl.trim()
    if (!rawInput) return

    // Extract URL from text (supports formats like 【Title】 URL)
    const url = extractBiliUrl(rawInput)

    if (!isBiliUrl(url)) {
      setError('请输入有效的B站视频链接 (bilibili.com / b23.tv)')
      return
    }
    // avoid duplicate by original URL
    if (playlist.some(p => p.sourceUrl === url)) {
      setError('该视频已在列表中')
      return
    }
    setAdding(true)
    try {
      const result = await parseBilibili(url)
      if (result.code !== 200) {
        throw new Error(result.msg || '解析失败')
      }
      const dataArray = Array.isArray(result.data) ? result.data : []
      if (!dataArray.length) throw new Error('未获取到视频地址')
      const best = dataArray[0]

      const item = {
        id: genId(),
        sourceUrl: url,
        title: best.title || result.title || '未命名视频',
        author: result.user?.name || '',
        cover: result.imgurl || '',
        duration: best.duration || 0,
        durationFormat: best.durationFormat || '',
        videoUrl: best.video_url,
        addedAt: Date.now(),
      }
      if (!item.videoUrl) throw new Error('接口未返回可播放链接')
      setPlaylist(prev => [...prev, item])
      if (playlist.length === 0) setCurrentIndex(0)
      setInputUrl('')
    } catch (e) {
      setError(e.message || '解析失败，请稍后重试')
    } finally {
      setAdding(false)
    }
  }

  function handleRemove(id) {
    setPlaylist(prev => prev.filter(p => p.id !== id))
    // adjust index if needed
    setCurrentIndex(prev => {
      const idx = playlist.findIndex(p => p.id === id)
      if (idx < 0) return prev
      if (prev > idx) return prev - 1
      if (prev === idx) return 0
      return prev
    })
  }

  function playAt(index) {
    if (index < 0 || index >= playlist.length) return
    setCurrentIndex(index)
  }

  function playNext() {
    if (!playlist.length) return
    if (currentIndex === playlist.length - 1) {
      if (loopList) setCurrentIndex(0)
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }

  function playPrev() {
    if (!playlist.length) return
    if (currentIndex === 0) {
      if (loopList) setCurrentIndex(playlist.length - 1)
    } else {
      setCurrentIndex(currentIndex - 1)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo">术</span>
          <div className="titles">
            <h1>就这个术力口爽</h1>
            <p className="subtitle">其实就是B站视频解析播放器</p>
          </div>
        </div>
        <div className="actions">
          <label className="loop">
            <input type="checkbox" checked={loopList} onChange={e => setLoopList(e.target.checked)} />
            循环播放列表
          </label>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </header>

      <section className="add-box">
        <input
          className="url-input"
          placeholder="粘贴 B 站视频链接，例如：https://www.bilibili.com/video/BV... 或 https://b23.tv/..."
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleAdd()
          }}
        />
        <button className="primary" onClick={handleAdd} disabled={adding}>
          {adding ? '解析中…' : '添加到列表'}
        </button>
      </section>
      {error && <div className="error" role="alert">{error}</div>}

      <main className="main">
        <div className="player-panel">
          <Player
            item={currentItem}
            nextItem={nextItem}
            onEnded={playNext}
            onPrev={playPrev}
            onNext={playNext}
          />
        </div>
        <aside className="list-panel">
          <Playlist
            items={playlist}
            currentIndex={currentIndex}
            onPlay={playAt}
            onRemove={handleRemove}
          />
        </aside>
      </main>

    <footer className="w-full bg-gray-900 text-gray-400 text-center py-6 mt-10 border-t border-gray-800">
        <small className="text-sm leading-relaxed block">
            接口来源：
            <a
                href="https://api.mir6.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
            >
                米人API
            </a>
            {" | "}作者：
            <a
                href="https://furry.luxe"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
            >
                狼牙
            </a>
            <br />
            本项目仅供学习交流使用，请勿用于商业用途。如有侵权请联系删除。
        </small>
    </footer>
    </div>
  )
}
