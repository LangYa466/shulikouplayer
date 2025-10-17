import React from 'react'

export default function ThemeToggle({ theme, setTheme }) {
  const next = theme === 'light' ? 'dark' : 'light'
  return (
    <button
      className="theme-toggle"
      title={`切换到${next === 'dark' ? '暗色' : '亮色'}模式`}
      onClick={() => setTheme(next)}
    >
      {theme === 'light' ? '🌙 暗色' : '☀️ 亮色'}
    </button>
  )
}

