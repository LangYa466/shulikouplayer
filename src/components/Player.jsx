import React, { useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

export default function Player({ item, nextItem, onEnded, onPrev, onNext }) {
  const videoRef = useRef(null)
  const preloaderRef = useRef(null)
  const [muted, setMuted] = useLocalStorage('slks-muted', false)
  const [error, setError] = useState('')

  // Load current video
  useEffect(() => {
    setError('')
    const v = videoRef.current
    if (!v) return
    if (!item?.videoUrl) return
    v.src = item.videoUrl
    // Autoplay: muted to satisfy autoplay policies
    v.muted = muted
    v.play().catch(() => {
      // Autoplay might be blocked; show message
    })
    return () => {
      v.pause()
      v.removeAttribute('src')
      v.load()
    }
  }, [item?.videoUrl])

  // Keep mute state in sync
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  // Preload next video via hidden video element
  useEffect(() => {
    const hidden = preloaderRef.current
    if (!hidden) return
    if (nextItem?.videoUrl) {
      hidden.preload = 'auto'
      hidden.src = nextItem.videoUrl
      // Attempt to prime the buffer
      hidden.load()
    } else {
      hidden.removeAttribute('src')
      hidden.load()
    }
  }, [nextItem?.videoUrl])

  if (!item) {
    return <div className="player-empty">尚未选择视频</div>
  }

  return (
    <div className="player">
      <div className="player-header">
        <div className="title" title={item.title}>{item.title}</div>
        <div className="controls">
          <button onClick={onPrev}>&laquo; 上一条</button>
          <button onClick={() => setMuted(m => !m)}>{muted ? '🔇 取消静音' : '🔊 静音'}</button>
          <button onClick={onNext}>下一条 &raquo;</button>
        </div>
      </div>

      <video
        ref={videoRef}
        className="video"
        controls
        autoPlay
        playsInline
        preload="auto"
        onEnded={onEnded}
        onError={() => setError('播放失败，可能链接失效或受限')}
        poster={item.cover || undefined}
        src={item.videoUrl || undefined}
      />
      {error && <div className="error" role="alert">{error}</div>}

      {/* Hidden preloader */}
      <video ref={preloaderRef} style={{ display: 'none' }} muted />
    </div>
  )
}
