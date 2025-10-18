import React, { useState, useEffect } from 'react'
import { Settings, X, Sun, Moon, Repeat, Clock, Volume2, Play } from 'lucide-react'

export default function SettingsPanel({ 
  theme, 
  setTheme, 
  loopList, 
  setLoopList,
  loopSingle,
  setLoopSingle,
  autoPlay,
  setAutoPlay,
  defaultVolume,
  setDefaultVolume,
  onPauseForSleep
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState(30)
  const [timerActive, setTimerActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  // 定时暂停功能
  useEffect(() => {
    if (!timerActive || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setTimerActive(false)
          onPauseForSleep()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerActive, timeRemaining, onPauseForSleep])

  const startTimer = () => {
    if (timerMinutes > 0) {
      setTimeRemaining(timerMinutes * 60)
      setTimerActive(true)
    }
  }

  const cancelTimer = () => {
    setTimerActive(false)
    setTimeRemaining(0)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      <button 
        className="settings-toggle-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="设置"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="settings-panel" onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <h2>设置</h2>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="settings-content">
              {/* 主题设置 */}
              <div className="setting-item">
                <div className="setting-label">
                  {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                  <span>主题</span>
                </div>
                <div className="setting-control">
                  <button 
                    className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    <Sun size={16} /> 亮色
                  </button>
                  <button 
                    className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    <Moon size={16} /> 暗色
                  </button>
                </div>
              </div>

              {/* 循环播放列表 */}
              <div className="setting-item">
                <div className="setting-label">
                  <Repeat size={18} />
                  <span>循环播放列表</span>
                </div>
                <div className="setting-control">
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={loopList} 
                      onChange={e => setLoopList(e.target.checked)} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* 单曲循环 */}
              <div className="setting-item">
                <div className="setting-label">
                  <Repeat size={18} />
                  <span>单曲循环</span>
                </div>
                <div className="setting-control">
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={loopSingle} 
                      onChange={e => setLoopSingle(e.target.checked)} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* 自动播放 */}
              <div className="setting-item">
                <div className="setting-label">
                  <Play size={18} />
                  <span>访问时自动播放</span>
                </div>
                <div className="setting-control">
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={autoPlay} 
                      onChange={e => setAutoPlay(e.target.checked)} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* 默认音量 */}
              <div className="setting-item">
                <div className="setting-label">
                  <Volume2 size={18} />
                  <span>默认音量</span>
                </div>
                <div className="setting-control volume-control">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={defaultVolume} 
                    onChange={e => setDefaultVolume(Number(e.target.value))}
                    className="volume-slider"
                  />
                  <span className="volume-value">{defaultVolume}%</span>
                </div>
              </div>

              {/* 定时暂停 */}
              <div className="setting-item">
                <div className="setting-label">
                  <Clock size={18} />
                  <span>定时暂停</span>
                </div>
                <div className="setting-control timer-control">
                  {!timerActive ? (
                    <>
                      <input 
                        type="number" 
                        min="1" 
                        max="180" 
                        value={timerMinutes} 
                        onChange={e => setTimerMinutes(Number(e.target.value))}
                        className="timer-input"
                      />
                      <span>分钟</span>
                      <button className="timer-btn" onClick={startTimer}>
                        启动
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="timer-display">{formatTime(timeRemaining)}</span>
                      <button className="timer-btn cancel" onClick={cancelTimer}>
                        取消
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="setting-note">
                <small>💡 提示：单曲循环优先级高于列表循环</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
