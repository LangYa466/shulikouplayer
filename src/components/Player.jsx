import React, { useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { getProxiedImageUrl } from '../lib/imageProxy.js'

export default function Player({ item, nextItem, onEnded, onPrev, onNext, onVideoError }) {
  const videoRef = useRef(null)
  const preloaderRef = useRef(null)
  const [muted, setMuted] = useLocalStorage('slks-muted', false)
  const [error, setError] = useState('')
  const [isRetrying, setIsRetrying] = useState(false)

  // Load current video
  useEffect(() => {
    setError('')
    setIsRetrying(false)
    const v = videoRef.current
    if (!v) return
    if (!item?.videoUrl) return
    v.src = item.videoUrl
    // 不自动静音
    v.muted = muted
    v.play().catch((err) => {
      // Autoplay might be blocked; show message
      console.log('Autoplay blocked:', err)
    })
    return () => {
      v.pause()
      v.removeAttribute('src')
      v.load()
    }
  }, [item?.videoUrl, muted])

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

  // 处理视频播放错误
  const handleVideoError = async () => {
    if (isRetrying || !item || !onVideoError) return

    setIsRetrying(true)
    setError('视频播放失败，正在重新获取...')

    try {
      // 通知父组件重新获取视频URL
      await onVideoError(item)
      setError('')
    } catch (err) {
      setError('重新获取失败，链接可能已失效')
    } finally {
      setIsRetrying(false)
    }
  }

  if (!item) {
    return <div className="player-empty">尚未选择视频</div>
  }

  return (
    <div className="player">
      <div className="player-header">
        <div className="title" title={item.title}>{item.title}</div>
        <div className="controls">
          <button onClick={onPrev} disabled={isRetrying}>&laquo; 上一条</button>
          <button onClick={() => setMuted(m => !m)}>{muted ? '🔇 取消静音' : '🔊 静音'}</button>
          <button onClick={onNext} disabled={isRetrying}>下一条 &raquo;</button>
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
        onError={handleVideoError}
        poster={getProxiedImageUrl(item.cover)}
        src={item.videoUrl || undefined}
      />
      {error && <div className="error" role="alert">{error}</div>}

      {/* Hidden preloader */}
      <video ref={preloaderRef} style={{ display: 'none' }} muted />
    </div>
  )
}
