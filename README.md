# 就这个术力口爽

一个用 React + Vite 构建的简易播放器：
- 暗色/亮色主题（本地记忆）
- 粘贴 B 站链接解析至播放列表
- 循环播放列表，自动衔接下一条
- 当前播放时预加载下一条

接口来源：米人API https://api.mir6.com 

## 开发

1. 安装依赖

```cmd
npm install
```

2. 启动开发服务器

```cmd
npm run dev
```

3. 构建发布

```cmd
npm run build
npm run preview
```

## 说明
- 解析使用 GET https://api.mir6.com/api/bzjiexi?url=...&type=json
- 开发环境通过 Vite 代理避免 CORS：以 `/mir6` 前缀请求并代理到 api.mir6.com；生产环境直接请求线上域名。
- 浏览器自动播放策略限制，首次播放默认静音自动播放，可点击“取消静音”。
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

