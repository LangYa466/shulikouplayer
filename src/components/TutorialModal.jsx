import React from 'react'

export default function TutorialModal({ onClose, onDontShowAgain }) {
  const tutorialUrl = 'https://www.bilibili.com/video/BV1PMWCzgEHD/?share_source=copy_web&vd_source=ad5c653a9ada7582a26378dc7293e43a'

  const handleViewTutorial = () => {
    window.open(tutorialUrl, '_blank')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👋 欢迎使用狼牙的术力口爽播放器</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <p className="tutorial-question">是否查看使用教程视频？</p>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onDontShowAgain}>
            不再提醒
          </button>
          <button className="btn-primary" onClick={handleViewTutorial}>
            查看教程
          </button>
        </div>
      </div>
    </div>
  )
}

