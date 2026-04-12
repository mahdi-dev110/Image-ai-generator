# VISIGEN — AI Image Generator

<div align="center">

![Visigen Banner](https://img.shields.io/badge/VISIGEN-AI%20Image%20Studio-29ff03?style=for-the-badge&labelColor=0a0a0f&color=29ff03)

**Generate stunning AI images from text prompts.**  
Plug in your own API key — no server required, no data collected.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-29ff03?style=flat-square&logo=vercel&labelColor=0a0a0f)](https://mahdi-imageaigenerator.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-mahdi--dev110-29ff03?style=flat-square&logo=github&labelColor=0a0a0f)](https://github.com/mahdi-dev110)
[![License](https://img.shields.io/badge/License-MIT-29ff03?style=flat-square&labelColor=0a0a0f)](./LICENSE)

</div>

---

## ✦ Overview

**Visigen** is a zero-backend AI image generator built with vanilla HTML, CSS, and JavaScript. Users paste their own API key from Hugging Face or OpenAI, write a prompt, and generate images — all from the browser. No server, no accounts, no data stored anywhere.

---

## ✦ Features

- **Multi-Provider Support** — Hugging Face Inference API and OpenAI DALL-E (3 and 2)
- **Multiple Models**
  - 🤗 HF: FLUX.1 Schnell, FLUX.1 Dev, Stable Diffusion XL, SD 3, SD v1.5
  - 🔵 OpenAI: DALL-E 3 (standard + HD), DALL-E 2
- **Style Presets** — One-click style modifiers: Photorealistic, Anime, Cyberpunk, Oil Painting, Watercolor, Cinematic, Pixel Art, Fantasy
- **Canvas Size Presets** — 1:1 (Square), 3:4 (Portrait), 4:3 (Landscape), 16:9 (Widescreen)
- **Fine-Tuning Controls** — Inference steps, guidance scale, quality, style (provider-dependent)
- **Negative Prompt** — Tell the model what to avoid (Hugging Face)
- **Image History** — Last 20 generations viewable in a grid
- **Download** — One-click PNG download of your generated image
- **Fullscreen Lightbox** — View any image full-size with prompt overlay
- **Variation Mode** — Re-run the same prompt with one click
- **Keyboard Shortcuts** — `Ctrl/Cmd + Enter` to generate, `Esc` to close dialogs
- **Zero Backend** — All API calls go directly from your browser to the provider
- **Privacy First** — API key stored in memory only, never sent anywhere except the provider's endpoint

---

## ✦ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/mahdi-dev110/Image-ai-generator.git
cd Image-ai-generator
```

### 2. Open in Browser

No build step needed. Just open `index.html` in your browser:

```bash
# macOS
open index.html

# Windows
start index.html

# Or serve locally (recommended)
npx serve .
# or
python3 -m http.server 3000
```

---

## ✦ API Key Setup

Visigen supports two providers. You only need one.

### Option A — Hugging Face (Free Tier Available)

1. Sign up at [huggingface.co](https://huggingface.co)
2. Go to **Settings → Access Tokens** → [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
3. Click **New Token** → choose **Read** role
4. Copy the token (starts with `hf_...`)
5. Paste it into Visigen under **Hugging Face** provider

> **Note:** Some models (like FLUX.1 Dev) require you to accept their license terms on Hugging Face before using them via API. FLUX.1 Schnell works out of the box.

---

### Option B — OpenAI (Paid, $0.04–$0.08 per image)

1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. Click **Create new secret key**
4. Copy the key (starts with `sk-...`)
5. Paste it into Visigen under **OpenAI** provider
6. Make sure your account has billing set up

**DALL-E 3 pricing:** ~$0.04/image (standard) · ~$0.08/image (HD)  
**DALL-E 2 pricing:** ~$0.018/image (1024×1024)

---

## ✦ How to Use

1. **Choose your provider** — Hugging Face (free) or OpenAI
2. **Paste your API key** — stays in memory, never saved
3. **Select a model** — FLUX.1 Schnell is fast and excellent
4. **Write your prompt** — be specific for better results
5. **Pick a style preset** (optional) — adds quality boosters
6. **Choose canvas size** — square, portrait, landscape, or widescreen
7. **Adjust fine-tuning** (optional) — steps, guidance scale
8. **Hit Generate** — or press `Ctrl/Cmd + Enter`
9. **Download or expand** your image using the overlay buttons

---

## ✦ Tips for Better Prompts

| Instead of... | Try... |
|---|---|
| `a cat` | `a majestic Maine Coon cat sitting on a window ledge, golden hour light, shallow depth of field, photorealistic` |
| `a city` | `aerial view of a rain-soaked cyberpunk megacity at night, neon reflections, towering skyscrapers, cinematic, 8K` |
| `abstract art` | `swirling cosmos of deep blue and violet hues, galaxies forming, cosmic dust, ultra-detailed, oil painting style` |

**General tips:**
- Add quality boosters: `8K, highly detailed, sharp focus, professional`
- Specify lighting: `golden hour, studio lighting, dramatic shadows, soft diffused light`
- Name the medium: `oil painting, watercolor, digital art, photorealistic, charcoal sketch`
- Add camera terms: `35mm lens, wide-angle, bokeh, DSLR, anamorphic`

---

## ✦ File Structure

```
Image-ai-generator/
├── index.html   # App structure and layout
├── style.css    # All styles — dark neon aesthetic
├── app.js       # Full application logic
├── README.md    # This file
└── LICENSE      # MIT License
```

---

## ✦ Tech Stack

- **HTML5** — semantic markup, ARIA accessibility
- **CSS3** — custom properties, grid, flexbox, animations
- **Vanilla JavaScript (ES6+)** — no framework, no dependencies
- **Hugging Face Inference API** — open-source model inference
- **OpenAI Images API** — DALL-E 3 and DALL-E 2

---

## ✦ Privacy & Security

- Your API key is stored **only in memory** (JavaScript variable) during your session
- The key is **never sent anywhere** except directly to the provider's API endpoint
- No analytics, no tracking, no cookies, no database
- Closing or refreshing the tab clears everything

---

## ✦ Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts — that's it!
```

Or just drag and drop the folder at [vercel.com/new](https://vercel.com/new) — no config needed for a static site.

---

## ✦ Roadmap

- [ ] Image-to-image (img2img) generation
- [ ] Inpainting / outpainting
- [ ] Together AI provider (FLUX on Together)
- [ ] Prompt history with localStorage opt-in
- [ ] Prompt enhancement via AI
- [ ] Batch generation (multiple seeds)

---

## ✦ License

[MIT](./LICENSE) — Free to use, modify, and distribute.

---

<div align="center">

Built by **[Mahdi](https://github.com/mahdi-dev110)** · [mahdi.dev](https://mahdi-porfolio.muntazirmahdi-dev.workers.dev) · [Instagram](https://instagram.com/mahdi.dev110) · [LinkedIn](https://linkedin.com/in/mahdi-dev110)

</div>
