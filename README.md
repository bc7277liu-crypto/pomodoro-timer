# 番茄时钟 (Pomodoro Timer)

一个简约扁平卡通风格的桌面番茄时钟应用。

## 功能特性

- 三种模式：专注 (25分钟)、短休息 (5分钟)、长休息 (15分钟)
- 可爱的番茄表情会根据状态变化（专注时认真、休息时开心、快结束时紧张）
- 圆形进度条 + 番茄浮动动画
- 眨眼动画让番茄更生动
- 系统通知提醒 + 悦耳提示音
- 系统托盘支持（最小化到托盘）
- 今日番茄数统计（本地持久化）
- 空格键快捷开始/暂停

## 技术栈

- Electron
- HTML / CSS / Vanilla JavaScript
- Electron Store (本地存储)
- Web Audio API (提示音)

## 运行方法

### 1. 安装 Node.js
确保已安装 Node.js 18+ 和 npm。

### 2. 安装依赖
```bash
npm install
```

### 3. 启动应用
```bash
npm start
```

## 打包分发

### Windows
```bash
npm run dist
```
打包后的安装包位于 `dist/` 目录。

## 应用图标

应用默认使用 `assets/icon.png` 作为窗口和托盘图标。你可以替换为自己的图标：

- **Windows**: 替换 `assets/icon.png`，建议尺寸 256x256（打包为 `.ico` 更佳）
- **macOS**: 替换 `assets/icon.png`，建议尺寸 512x512（打包为 `.icns` 更佳）

图标为可选，不放置图标应用也能正常运行。

## 目录结构

```
pomodoro-timer/
├── package.json       # 项目配置与依赖
├── main.js            # Electron 主进程
├── preload.js         # 预加载脚本（安全 IPC）
├── index.html         # 主窗口 UI
├── styles.css         # 样式与动画
├── renderer.js        # 计时逻辑与交互
├── assets/
│   └── icon.png       # 应用图标（可选）
└── README.md
```

## 快捷键

- `空格键` — 开始 / 暂停计时

## 配色

- 番茄红 `#FF6B6B`
- 清新绿 `#4ECDC4`
- 可爱黄 `#FFE66D`
- 淡粉背景 `#FFF5F5`
