import React from 'react'

function formatDuration(sec, fallback = '') {
  if (!sec || isNaN(sec)) return fallback
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  const m = Math.floor((sec / 60) % 60).toString().padStart(2, '0')
  const h = Math.floor(sec / 3600)
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
}

export default function Playlist({ items, currentIndex, onPlay, onRemove }) {
  if (!items.length) {
    return <div className="empty">列表为空，粘贴 B 站链接添加视频吧～</div>
  }
  return (
    <ul className="playlist">
      {items.map((it, idx) => (
        <li key={it.id} className={idx === currentIndex ? 'active' : ''}>
          <button className="thumb" onClick={() => onPlay(idx)}>
            {it.cover ? (
              <img src={it.cover} alt={it.title} loading="lazy" />
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

