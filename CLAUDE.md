# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An Electron-based desktop Pomodoro timer with a digital/cyberpunk UI style. The app runs as a fixed-size window (420x540) with a system tray icon, system notifications, and local stats persistence.

## Development Commands

Start the app for development:
```bash
npm start
```

Build a Windows installer (outputs to `dist/`):
```bash
npm run dist
```

The `dist/` folder contains both the unpacked app (`dist/win-unpacked/番茄时钟.exe`) and the NSIS installer (`dist/番茄时钟 Setup 1.0.0.exe`).

## Architecture

The app uses a classic Electron three-process architecture with **vanilla HTML/CSS/JS** (no frontend framework).

### Process Split

- **`main.js`** — Main process. Creates the BrowserWindow, sets up the system tray with a context menu, and handles system notifications via `ipcMain.handle('show-notification', ...)`.
- **`preload.js`** — Preload script. Uses `contextBridge` to safely expose `window.electronAPI.showNotification(title, body)` and `window.electronAPI.platform` to the renderer.
- **`renderer.js`** — Renderer process. Contains the `PomodoroTimer` class, which owns all UI state, timer logic, event binding, and `localStorage` persistence.

### Data Flow

Notifications are the only cross-process communication path. When a timer phase completes, `renderer.js` calls `window.electronAPI.showNotification()`; `preload.js` forwards this via `ipcRenderer.invoke()`; `main.js` receives it and spawns a native Electron `Notification`.

Stats are persisted in `localStorage` under the key `pomodoroStats` with a daily key (`YYYY-M-D`). The `electron-store` dependency is declared in `package.json` but is **not currently used** in the code.

### UI State Model

`PomodoroTimer` manages three timer modes (`work`, `shortBreak`, `longBreak`) and drives all visual states:

- `updateModeUI()` toggles CSS classes (`active` / `break`) on the time display, progress bar, mode label, main button, and mode tabs.
- `updateStatusVisual(state)` controls the LED ring and core indicator: `running` lights up the ring, `tense` triggers a red alarm pulse, `idle` shows only the core glow.
- `updateProgress()` uses a CSS `scaleX()` transform on a linear progress bar.

### Styling Approach

Styles are purely CSS-based with Google Fonts (`Orbitron` for headings, `Share Tech Mono` for digits). The UI uses a dark theme with neon accent colors: green `#00FF9D` for focus, cyan `#00D4FF` for breaks, red `#FF2E63` for alarms. A scanline overlay is rendered via a fixed `div` with a repeating linear gradient.

## Known Environment Quirks

- **Node.js PATH**: On this machine, Node.js is installed at `C:\Program Files\nodejs` but may not be on the shell `PATH`. If `npm` or `node` is not found, prefix commands with `export PATH="/c/Program Files/nodejs:$PATH" && ...`.
- **Electron binary download failures**: The `electron` package's postinstall script can silently fail to download the binary (e.g., due to network issues). If `npm start` complains that Electron "failed to install correctly," manually download the Windows zip from the npm mirror, extract it into `node_modules/electron/dist/`, and create a `path.txt` containing `electron.exe`.
- **No code signing**: `build.win.signAndEditExecutable` is set to `false` because `winCodeSign` extraction requires creating symlinks, which need elevated privileges on this machine.
- **Icons are optional**: `assets/icon.png` is referenced but gracefully falls back to an empty native image if missing.

## File Responsibilities

| File | Role |
|------|------|
| `main.js` | Window lifecycle, tray, native notifications |
| `preload.js` | Secure IPC bridge |
| `renderer.js` | Timer logic, DOM updates, localStorage stats, Web Audio sound |
| `index.html` | Single-page markup; no templating engine |
| `styles.css` | All theming, animations, and layout |
| `package.json` | Electron + electron-builder configuration |

## Shortcuts

- `Space` — Start / pause the timer (bound in `renderer.js` on `document`).

## Custom Skills

This project maintains a local skill system under the `skills/` directory. Skills are modular instruction files (Markdown with YAML frontmatter) that extend capabilities for common tasks.

### How It Works

When the user mentions a skill by name (e.g., "use the generate-image skill" or "run find-skills"), read the corresponding `skills/<name>/SKILL.md` file and follow the instructions inside.

To see all available skills:

```bash
node scripts/list-skills.js
```

Or ask: "List all available skills."

### Available Skills

The skill index is auto-generated at `skills/index.json`. Current skills include:

- **`find-skills`** — Discover and install skills from the Vercel Skills ecosystem (`skills/find-skills/SKILL.md`)
- **`generate-image`** — Generate images via OpenAI DALL-E 3 (`skills/generate-image/SKILL.md`)

### Adding a New Skill

1. Create a directory: `skills/<skill-name>/`
2. Add a `SKILL.md` with YAML frontmatter (`name`, `description`) and instruction body
3. Run `node scripts/update-skills-index.js` to regenerate the index
4. The skill is now available by name in conversation
