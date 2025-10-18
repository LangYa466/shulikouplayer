import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { getProxiedImageUrl } from '../lib/imageProxy.js'

const Player = forwardRef(({ item, nextItem, onEnded, onPrev, onNext, onVideoError, autoPlay, defaultVolume, loopSingle }, ref) => {
  const videoRef = useRef(null)
  const preloaderRef = useRef(null)
  const [volume, setVolume] = useLocalStorage('slks-volume', defaultVolume || 70)
  const [error, setError] = useState('')
  const [isRetrying, setIsRetrying] = useState(false)
  const retryCountRef = useRef(0)
  const currentItemIdRef = useRef(null)

  // 暴露 pause 方法给父组件
  useImperativeHandle(ref, () => ({
    pause: () => {
      if (videoRef.current) {
        videoRef.current.pause()
      }
    }
  }))

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
    // 应用音量设置
    v.volume = volume / 100

    // 只有在 autoPlay 为 true 时才自动播放
    if (autoPlay) {
      v.play().catch((err) => {
        console.log('自动播放被阻止:', err)
      })
    }

    return () => {
      v.pause()
      v.removeAttribute('src')
      v.load()
    }
  }, [item?.videoUrl, item?.id, autoPlay])

  // 同步音量
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100
    }
  }, [volume])

  // 同步默认音量设置
  useEffect(() => {
    if (defaultVolume !== undefined && defaultVolume !== volume) {
      setVolume(defaultVolume)
    }
  }, [defaultVolume])

  // Preload next video via hidden video element
  useEffect(() => {
    const hidden = preloaderRef.current
    if (!hidden) return
    if (nextItem?.videoUrl) {
      hidden.preload = 'auto'
      hidden.src = nextItem.videoUrl
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
      await onVideoError(item)
      setError('')
      retryCountRef.current = 0
    } catch (err) {
      if (retryCountRef.current < MAX_RETRIES) {
        setError(`重新获取失败，准备第 ${retryCountRef.current + 1} 次重试...`)
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

  const handleVolumeChange = (e) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
  };

  if (!item) {
    return <div className="player-empty">尚未选择视频</div>
  }

  return (
    <div className="player">
      <div className="player-header">
        <div className="title" title={item.title}>{item.title}</div>
        <div className="controls">
          <button onClick={onPrev} disabled={isRetrying}>&laquo; 上一曲</button>
          <button onClick={onNext} disabled={isRetrying}>下一曲 &raquo;</button>
        </div>
      </div>

      <video
        ref={videoRef}
        className="video"
        controls
        autoPlay={autoPlay}
        playsInline
        preload="auto"
        loop={loopSingle}
        onEnded={loopSingle ? undefined : onEnded}
        onError={handleVideoError}
        poster={getProxiedImageUrl(item.cover)}
        src={item.videoUrl || undefined}
      />

      <div className="player-controls">
        <div className="volume-control">
          <span className="volume-icon">🔊</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
            title={`音量: ${volume}%`}
          />
          <span className="volume-value">{volume}%</span>
        </div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      {/* Hidden preloader */}
      <video ref={preloaderRef} style={{ display: 'none' }} muted />
    </div>
  )
})

Player.displayName = 'Player'

export default Player
