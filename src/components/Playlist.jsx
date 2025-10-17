import React, { useState } from 'react'
import { getProxiedImageUrl } from '../lib/imageProxy.js'

function formatDuration(sec, fallback = '') {
  if (!sec || isNaN(sec)) return fallback
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  const m = Math.floor((sec / 60) % 60).toString().padStart(2, '0')
  const h = Math.floor(sec / 3600)
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
}

export default function Playlist({ items, currentIndex, onPlay, onRemove, onCoverError }) {
  // 记录哪些封面已经尝试重新加载过（避免无限重试）
  const [retryingCovers, setRetryingCovers] = useState(new Set())

  const handleImageError = (itemId) => {
    // 如果已经重试过，就不再重试
    if (retryingCovers.has(itemId)) {
      console.log('封面已重试过，不再尝试:', itemId)
      return
    }

    // 标记为正在重试
    setRetryingCovers(prev => new Set(prev).add(itemId))

    console.log('封面加载失败，尝试从 API 重新获取:', itemId)

    // 调用父组件的错误处理函数
    if (onCoverError) {
      onCoverError(itemId)
    }
  }

  if (!items.length) {
    return <div className="empty">列表为空，粘贴 B 站链接添加视频吧～</div>
  }
  return (
    <ul className="playlist">
      {items.map((it, idx) => (
        <li key={it.id} className={idx === currentIndex ? 'active' : ''}>
          <button className="thumb" onClick={() => onPlay(idx)}>
            {it.cover ? (
              <img
                src={getProxiedImageUrl(it.cover)}
                alt={it.title}
                loading="lazy"
                onError={() => handleImageError(it.id)}
              />
            ) : (
              <div className="placeholder" />
            )}
          </button>
          <div className="meta" onClick={() => onPlay(idx)}>
            <div className="title" title={it.title}>{it.title}</div>
            <div className="sub">
              <span className="author">{it.author || '未知作者'}</span>
              <span className="dot">·</span>
              <span>{it.durationFormat || formatDuration(it.duration)}</span>
            </div>
          </div>
          <div className="ops">
            <button className="danger" onClick={() => onRemove(it.id)}>删除</button>
          </div>
        </li>
      ))}
    </ul>
  )
}
