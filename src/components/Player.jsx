import React, { useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { getProxiedImageUrl } from '../lib/imageProxy.js'

export default function Player({ item, nextItem, onEnded, onPrev, onNext, onVideoError }) {
  const videoRef = useRef(null)
  const preloaderRef = useRef(null)
  const [muted, setMuted] = useLocalStorage('slks-muted', false)
  const [error, setError] = useState('')
  const [isRetrying, setIsRetrying] = useState(false)
  const retryCountRef = useRef(0)
  const currentItemIdRef = useRef(null)

  // Load current video
  useEffect(() => {
    setError('')
    setIsRetrying(false)
    // 切换到新视频时，重置重试计数器
    if (currentItemIdRef.current !== item?.id) {
      retryCountRef.current = 0
      currentItemIdRef.current = item?.id
    }
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
  }, [item?.videoUrl, item?.id, muted])

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

  // 处理视频播放错误 - 最多重试3次
  const handleVideoError = async () => {
    if (isRetrying || !item || !onVideoError) return

    const MAX_RETRIES = 3
    retryCountRef.current += 1

    console.log(`视频播放失败，第 ${retryCountRef.current}/${MAX_RETRIES} 次重试...`)

    if (retryCountRef.current > MAX_RETRIES) {
      setError('重新获取失败，链接可能已失效（已重试3次）')
      setIsRetrying(false)
      return
    }

    setIsRetrying(true)
    setError(`视频播放失败，正在重新获取... (${retryCountRef.current}/${MAX_RETRIES})`)

    try {
      // 通知父组件重新获取视频URL
      await onVideoError(item)
      setError('')
      // 成功后重置计数器
      retryCountRef.current = 0
    } catch (err) {
      // 如果还能重试，继续
      if (retryCountRef.current < MAX_RETRIES) {
        setError(`重新获取失败，准备第 ${retryCountRef.current + 1} 次重试...`)
        // 延迟后自动重试
        setTimeout(() => {
          handleVideoError()
        }, 1000)
      } else {
        setError('重新获取失败，链接可能已失效（已重试3次）')
      }
    } finally {
      if (retryCountRef.current >= MAX_RETRIES) {
        setIsRetrying(false)
      }
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
