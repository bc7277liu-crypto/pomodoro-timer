---
name: generate-image
description: Generate images using AI (DALL-E 3) via OpenAI API. Use when the user wants to create an image, draw something, or generate visual assets.
---

# Generate Image

Generate images using OpenAI's DALL-E 3 API.

## When to Use This Skill

Use this skill when the user:

- Says "generate an image of...", "create a picture of...", "draw..."
- Asks for visual assets, icons, or illustrations
- Wants to generate a poster, cover, or artwork
- Mentions creating images with AI

## Prerequisites

You need an OpenAI API key. Set it as an environment variable:

```bash
# Windows PowerShell
$env:OPENAI_API_KEY="sk-xxxxx"

# Windows CMD
set OPENAI_API_KEY=sk-xxxxx

# Bash
export OPENAI_API_KEY=sk-xxxxx
```

Optional environment variables:
- `OPENAI_API_BASE` — API base hostname (default: `api.openai.com`). Useful for API proxies.
- `OPENAI_MODEL` — Model name (default: `dall-e-3`).

## Usage

Run the script with a prompt:

```bash
node scripts/generate-image.js "a cyberpunk tomato timer with neon lights"
```

Optional: specify output path:

```bash
node scripts/generate-image.js "a futuristic clock" ./assets/clock.png
```

## What the Script Does

1. Calls OpenAI DALL-E 3 API with your prompt
2. Downloads the generated image to the local filesystem
3. Saves it with the specified filename (or auto-generates one)

## Examples

```bash
# Generate a share card for the Pomodoro app
node scripts/generate-image.js "a digital cyberpunk tomato timer app screenshot, dark UI with neon green accents"

# Generate an icon
node scripts/generate-image.js "minimalist tomato icon, flat design, transparent background, 1024x1024"
```

## Troubleshooting

- **"OPENAI_API_KEY environment variable is required"** — Set your API key first.
- **Network errors** — If you're in China, you may need to set `OPENAI_API_BASE` to a proxy endpoint.
- **API rate limits** — DALL-E 3 has rate limits; wait a moment and retry.
