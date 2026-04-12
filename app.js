/* ═══════════════════════════════════════════════════════
   VISIGEN — app.js
   Multi-provider AI Image Generator
   Supports: Hugging Face Inference API, OpenAI DALL-E
   mahdi.dev  |  github.com/mahdi-dev110
═══════════════════════════════════════════════════════ */

"use strict";

// ─────────────────────────────────────────────────────────
// CONFIG — Models per provider
// ─────────────────────────────────────────────────────────
const PROVIDERS = {
  huggingface: {
    name: "Hugging Face",
    keyLink: "https://huggingface.co/settings/tokens",
    keyPlaceholder: "hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    keyHint: "Free account required. Create a token at huggingface.co/settings/tokens",
    models: [
      { id: "black-forest-labs/FLUX.1-schnell", label: "FLUX.1 Schnell (Fast, Excellent)" },
      { id: "black-forest-labs/FLUX.1-dev",     label: "FLUX.1 Dev (High Quality)" },
      { id: "stabilityai/stable-diffusion-xl-base-1.0", label: "Stable Diffusion XL" },
      { id: "stabilityai/stable-diffusion-3-medium-diffusers", label: "Stable Diffusion 3" },
      { id: "runwayml/stable-diffusion-v1-5",   label: "Stable Diffusion v1.5 (Lite)" },
    ],
  },
  openai: {
    name: "OpenAI",
    keyLink: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    keyHint: "OpenAI account required. Get your key at platform.openai.com/api-keys",
    models: [
      { id: "dall-e-3", label: "DALL-E 3 (Best Quality)" },
      { id: "dall-e-2", label: "DALL-E 2 (Faster, Cheaper)" },
    ],
  },
};

// Canvas size presets
const SIZE_PRESETS = {
  "1024x1024": { w: 1024, h: 1024 },
  "896x1152":  { w: 896,  h: 1152 },
  "1152x896":  { w: 1152, h: 896  },
  "1344x768":  { w: 1344, h: 768  },
};

// ─────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────
const state = {
  provider:        "huggingface",
  apiKey:          "",
  model:           PROVIDERS.huggingface.models[0].id,
  prompt:          "",
  negativePrompt:  "",
  selectedStyle:   "",
  width:           1024,
  height:          1024,
  steps:           28,
  guidance:        7.0,
  dalleQuality:    "standard",
  dalleStyle:      "vivid",
  isGenerating:    false,
  currentImageUrl: null,
  currentPrompt:   "",
  history:         [],  // Array of { url, prompt, timestamp }
};

// ─────────────────────────────────────────────────────────
// DOM REFS
// ─────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const el = {
  providerSelect:      $("providerSelect"),
  apiKeyInput:         $("apiKeyInput"),
  eyeBtn:              $("eyeBtn"),
  eyeIcon:             $("eyeIcon"),
  getKeyLink:          $("getKeyLink"),
  keyHint:             $("keyHint"),
  modelSelect:         $("modelSelect"),
  promptInput:         $("promptInput"),
  negativePromptInput: $("negativePromptInput"),
  negativePromptGroup: $("negativePromptGroup"),
  styleChips:          $("styleChips"),
  sizeGrid:            $("sizeGrid"),
  stepsRange:          $("stepsRange"),
  stepsVal:            $("stepsVal"),
  guidanceRange:       $("guidanceRange"),
  guidanceVal:         $("guidanceVal"),
  hfControls:          $("hfControls"),
  openaiControls:      $("openaiControls"),
  dalleQuality:        $("dalleQuality"),
  dalleStyle:          $("dalleStyle"),
  generateBtn:         $("generateBtn"),
  generateBtnText:     $("generateBtnText"),
  // Canvas
  canvasCard:          $("canvasCard"),
  emptyState:          $("emptyState"),
  loadingState:        $("loadingState"),
  loadingLabel:        $("loadingLabel"),
  loadingBar:          $("loadingBar"),
  errorState:          $("errorState"),
  errorMsg:            $("errorMsg"),
  resultState:         $("resultState"),
  generatedImage:      $("generatedImage"),
  promptRecap:         $("promptRecap"),
  recapText:           $("recapText"),
  // Actions
  downloadBtn:         $("downloadBtn"),
  fullscreenBtn:       $("fullscreenBtn"),
  variationBtn:        $("variationBtn"),
  retryBtn:            $("retryBtn"),
  // History
  historySection:      $("historySection"),
  historyGrid:         $("historyGrid"),
  clearBtn:            $("clearBtn"),
  // Lightbox
  lightbox:            $("lightbox"),
  lightboxImg:         $("lightboxImg"),
  lightboxCaption:     $("lightboxCaption"),
  lightboxClose:       $("lightboxClose"),
  // Mobile
  menuBtn:             $("menuBtn"),
  sidebar:             $("sidebar"),
  sidebarOverlay:      $("sidebarOverlay"),
  // Toast
  toastStack:          $("toastStack"),
};

// ─────────────────────────────────────────────────────────
// PROVIDER / MODEL SETUP
// ─────────────────────────────────────────────────────────
function populateModels(provider) {
  el.modelSelect.innerHTML = "";
  PROVIDERS[provider].models.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.label;
    el.modelSelect.appendChild(opt);
  });
  state.model = PROVIDERS[provider].models[0].id;
}

function updateProviderUI(provider) {
  const cfg = PROVIDERS[provider];
  el.apiKeyInput.placeholder = cfg.keyPlaceholder;
  el.getKeyLink.href = cfg.keyLink;
  el.keyHint.textContent = cfg.keyHint;
  populateModels(provider);

  // Show/hide provider-specific controls
  const isHF = provider === "huggingface";
  el.hfControls.style.display          = isHF ? "" : "none";
  el.openaiControls.style.display       = isHF ? "none" : "";
  el.negativePromptGroup.style.display  = isHF ? "" : "none";
}

// ─────────────────────────────────────────────────────────
// API — HUGGING FACE
// ─────────────────────────────────────────────────────────
async function generateHuggingFace() {
  const model    = state.model;
  const endpoint = `https://api-inference.huggingface.co/models/${model}`;
  const fullPrompt = state.prompt + state.selectedStyle;

  const payload = {
    inputs: fullPrompt,
    parameters: {
      negative_prompt:    state.negativePrompt || undefined,
      num_inference_steps: state.steps,
      guidance_scale:      state.guidance,
      width:               state.width,
      height:              state.height,
    },
  };

  // Clean up undefined keys
  Object.keys(payload.parameters).forEach(k => {
    if (payload.parameters[k] === undefined) delete payload.parameters[k];
  });

  setLoadingLabel("Connecting to Hugging Face...");
  animateLoadingBar(0, 15, 800);

  const res = await fetch(endpoint, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${state.apiKey}`,
      "Content-Type":  "application/json",
      "x-wait-for-model": "true",
    },
    body: JSON.stringify(payload),
  });

  animateLoadingBar(15, 45, 1200);

  if (!res.ok) {
    let msg = `API error (${res.status})`;
    try {
      const json = await res.json();
      if (json.error) msg = json.error;
      if (json.error && json.error.includes("loading")) {
        msg = "Model is loading — this can take 20–60 seconds on the first run. Please try again.";
      }
      if (res.status === 401) msg = "Invalid API key. Check your Hugging Face token and try again.";
      if (res.status === 403) msg = "Access denied. Make sure your token has 'Inference API' access.";
      if (res.status === 429) msg = "Rate limit reached. Wait a minute and try again.";
    } catch (_) {}
    throw new Error(msg);
  }

  setLoadingLabel("Synthesizing pixels...");
  animateLoadingBar(45, 85, 1500);

  const blob = await res.blob();
  if (!blob.type.startsWith("image/")) {
    throw new Error("Unexpected response — the model may still be loading. Try again in a moment.");
  }

  animateLoadingBar(85, 100, 400);
  return URL.createObjectURL(blob);
}

// ─────────────────────────────────────────────────────────
// API — OPENAI DALL-E
// ─────────────────────────────────────────────────────────
async function generateOpenAI() {
  const model      = state.model;
  const fullPrompt = state.prompt + state.selectedStyle;
  const endpoint   = "https://api.openai.com/v1/images/generations";

  // DALL-E 3 size restriction
  let size = `${state.width}x${state.height}`;
  if (model === "dall-e-3") {
    const allowed = ["1024x1024", "1792x1024", "1024x1792"];
    if (!allowed.includes(size)) size = "1024x1024";
  } else {
    // DALL-E 2
    const allowed2 = ["256x256", "512x512", "1024x1024"];
    if (!allowed2.includes(size)) size = "1024x1024";
  }

  const payload = {
    model,
    prompt:  fullPrompt,
    n:       1,
    size,
    response_format: "url",
    ...(model === "dall-e-3" ? {
      quality: state.dalleQuality,
      style:   state.dalleStyle,
    } : {}),
  };

  setLoadingLabel("Sending request to OpenAI...");
  animateLoadingBar(0, 30, 800);

  const res = await fetch(endpoint, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${state.apiKey}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify(payload),
  });

  animateLoadingBar(30, 70, 1800);

  if (!res.ok) {
    let msg = `API error (${res.status})`;
    try {
      const json = await res.json();
      if (json.error?.message) msg = json.error.message;
      if (res.status === 401) msg = "Invalid API key. Check your OpenAI key and try again.";
      if (res.status === 429) msg = "Rate limit or quota exceeded. Check your OpenAI billing.";
      if (res.status === 400) msg = json.error?.message || "Bad request — check your prompt for policy violations.";
    } catch (_) {}
    throw new Error(msg);
  }

  const data = await res.json();
  animateLoadingBar(70, 100, 500);

  const url = data.data?.[0]?.url;
  if (!url) throw new Error("No image returned from OpenAI. Please try again.");

  // Proxy via canvas to get a blob (CORS-safe for download)
  return url;
}

// ─────────────────────────────────────────────────────────
// GENERATE — Main
// ─────────────────────────────────────────────────────────
async function handleGenerate() {
  if (state.isGenerating) return;

  // Validate inputs
  if (!el.apiKeyInput.value.trim()) {
    toast("Paste your API key first.", "error");
    el.apiKeyInput.focus();
    return;
  }
  if (!el.promptInput.value.trim()) {
    toast("Write a prompt to generate an image.", "error");
    el.promptInput.focus();
    return;
  }

  // Sync state from inputs
  state.apiKey          = el.apiKeyInput.value.trim();
  state.prompt          = el.promptInput.value.trim();
  state.negativePrompt  = el.negativePromptInput.value.trim();
  state.currentPrompt   = state.prompt + (state.selectedStyle ? ` [${getActiveChipLabel()}]` : "");

  // Update button and state
  state.isGenerating = true;
  el.generateBtn.disabled = true;
  el.generateBtnText.textContent = "Generating...";

  showState("loading");
  el.loadingBar.style.width = "0%";

  try {
    let imageUrl;
    if (state.provider === "huggingface") {
      imageUrl = await generateHuggingFace();
    } else {
      imageUrl = await generateOpenAI();
    }

    // Revoke previous blob
    if (state.currentImageUrl && state.currentImageUrl.startsWith("blob:")) {
      // Keep it for history — don't revoke yet
    }

    state.currentImageUrl = imageUrl;
    displayResult(imageUrl, state.currentPrompt);
    addToHistory(imageUrl, state.currentPrompt);
    toast("Image generated successfully!", "success");

  } catch (err) {
    console.error("[Visigen] Generation error:", err);
    showError(err.message || "An unexpected error occurred.");
    toast(err.message || "Generation failed.", "error");
  } finally {
    state.isGenerating = false;
    el.generateBtn.disabled = false;
    el.generateBtnText.textContent = "Generate";
  }
}

// ─────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────
function showState(which) {
  el.emptyState.style.display   = which === "empty"   ? "" : "none";
  el.loadingState.style.display = which === "loading"  ? "" : "none";
  el.errorState.style.display   = which === "error"    ? "" : "none";
  el.resultState.style.display  = which === "result"   ? "" : "none";
}

function showError(msg) {
  el.errorMsg.textContent = msg;
  showState("error");
}

function setLoadingLabel(text) {
  el.loadingLabel.textContent = text;
}

let loadingBarTimer = null;
function animateLoadingBar(from, to, duration) {
  if (loadingBarTimer) clearInterval(loadingBarTimer);
  const start = performance.now();
  loadingBarTimer = setInterval(() => {
    const elapsed = performance.now() - start;
    const pct = Math.min(from + (to - from) * (elapsed / duration), to);
    el.loadingBar.style.width = pct + "%";
    if (pct >= to) clearInterval(loadingBarTimer);
  }, 16);
}

function displayResult(url, prompt) {
  el.generatedImage.src = url;
  el.generatedImage.onload = () => {
    showState("result");
    el.promptRecap.style.display = "";
    el.recapText.textContent     = prompt;
  };
  el.generatedImage.onerror = () => {
    showError("Image loaded but failed to display. Try downloading directly.");
  };
}

function getActiveChipLabel() {
  const active = el.styleChips.querySelector(".chip.active");
  return active ? active.textContent : "";
}

// ─────────────────────────────────────────────────────────
// HISTORY
// ─────────────────────────────────────────────────────────
function addToHistory(url, prompt) {
  state.history.unshift({ url, prompt, timestamp: Date.now() });
  if (state.history.length > 20) {
    const removed = state.history.pop();
    if (removed.url.startsWith("blob:")) URL.revokeObjectURL(removed.url);
  }
  renderHistory();
}

function renderHistory() {
  if (state.history.length === 0) {
    el.historySection.style.display = "none";
    return;
  }

  el.historySection.style.display = "";
  el.historyGrid.innerHTML = "";

  state.history.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.title = item.prompt;
    div.innerHTML = `
      <img src="${item.url}" alt="History image ${idx + 1}" loading="lazy" />
      <div class="history-item-overlay">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </div>
    `;
    div.addEventListener("click", () => openLightbox(item.url, item.prompt));
    el.historyGrid.appendChild(div);
  });
}

function clearHistory() {
  state.history.forEach(item => {
    if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
  });
  state.history = [];
  renderHistory();
  toast("History cleared.", "info");
}

// ─────────────────────────────────────────────────────────
// LIGHTBOX
// ─────────────────────────────────────────────────────────
function openLightbox(url, caption) {
  el.lightboxImg.src              = url;
  el.lightboxCaption.textContent  = caption;
  el.lightbox.style.display       = "flex";
  document.body.style.overflow    = "hidden";
}

function closeLightbox() {
  el.lightbox.style.display    = "none";
  document.body.style.overflow = "";
  el.lightboxImg.src           = "";
}

// ─────────────────────────────────────────────────────────
// DOWNLOAD
// ─────────────────────────────────────────────────────────
async function downloadImage(url, prompt) {
  if (!url) return;
  try {
    let blob;
    if (url.startsWith("blob:")) {
      const res = await fetch(url);
      blob = await res.blob();
    } else {
      // OpenAI returns direct URL — proxy through a canvas to get blob
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      blob = await new Promise(r => canvas.toBlob(r, "image/png"));
    }

    const a = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `visigen-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Image downloaded.", "success");
  } catch {
    // Fallback: open in new tab
    window.open(url, "_blank");
    toast("Opened image in new tab.", "info");
  }
}

// ─────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────
function toast(message, type = "info") {
  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.innerHTML = `<span class="toast-dot"></span>${message}`;
  el.toastStack.appendChild(div);

  setTimeout(() => {
    div.style.transition = "opacity 0.3s, transform 0.3s";
    div.style.opacity    = "0";
    div.style.transform  = "translateY(8px)";
    setTimeout(() => div.remove(), 300);
  }, 3200);
}

// ─────────────────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────────────────
function bindEvents() {

  // Provider change
  el.providerSelect.addEventListener("change", e => {
    state.provider = e.target.value;
    updateProviderUI(state.provider);
  });

  // Model change
  el.modelSelect.addEventListener("change", e => {
    state.model = e.target.value;
  });

  // API key eye toggle
  el.eyeBtn.addEventListener("click", () => {
    const isPassword = el.apiKeyInput.type === "password";
    el.apiKeyInput.type = isPassword ? "text" : "password";
    el.eyeIcon.innerHTML = isPassword
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  });

  // Style chips
  el.styleChips.addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    el.styleChips.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    state.selectedStyle = chip.dataset.style || "";
  });

  // Size buttons
  el.sizeGrid.addEventListener("click", e => {
    const btn = e.target.closest(".size-btn");
    if (!btn) return;
    el.sizeGrid.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.width  = parseInt(btn.dataset.w);
    state.height = parseInt(btn.dataset.h);
  });

  // Sliders
  el.stepsRange.addEventListener("input", e => {
    state.steps = parseInt(e.target.value);
    el.stepsVal.textContent = state.steps;
  });

  el.guidanceRange.addEventListener("input", e => {
    state.guidance = parseFloat(e.target.value);
    el.guidanceVal.textContent = state.guidance.toFixed(1);
  });

  // DALL-E selects
  el.dalleQuality.addEventListener("change", e => { state.dalleQuality = e.target.value; });
  el.dalleStyle.addEventListener("change",   e => { state.dalleStyle   = e.target.value; });

  // Generate
  el.generateBtn.addEventListener("click", handleGenerate);

  // Retry
  el.retryBtn.addEventListener("click", handleGenerate);

  // Variation (re-run same prompt)
  el.variationBtn.addEventListener("click", () => {
    if (state.currentPrompt) handleGenerate();
  });

  // Download
  el.downloadBtn.addEventListener("click", () => {
    downloadImage(state.currentImageUrl, state.currentPrompt);
  });

  // Fullscreen
  el.fullscreenBtn.addEventListener("click", () => {
    if (state.currentImageUrl) openLightbox(state.currentImageUrl, state.currentPrompt);
  });

  // Lightbox close
  el.lightboxClose.addEventListener("click", closeLightbox);
  el.lightbox.addEventListener("click", e => {
    if (e.target === el.lightbox) closeLightbox();
  });

  // Clear history
  el.clearBtn.addEventListener("click", clearHistory);

  // Mobile menu
  el.menuBtn.addEventListener("click", () => {
    el.sidebar.classList.toggle("open");
    el.sidebarOverlay.classList.toggle("visible");
  });
  el.sidebarOverlay.addEventListener("click", () => {
    el.sidebar.classList.remove("open");
    el.sidebarOverlay.classList.remove("visible");
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", e => {
    // Cmd/Ctrl + Enter → Generate
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
    // Escape → Close lightbox
    if (e.key === "Escape") {
      closeLightbox();
      el.sidebar.classList.remove("open");
      el.sidebarOverlay.classList.remove("visible");
    }
  });
}

// ─────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────
function init() {
  updateProviderUI("huggingface");
  bindEvents();
  showState("empty");
  console.log("%cVISIGEN — AI Image Generator", "color:#29ff03;font-family:monospace;font-size:14px;font-weight:bold;");
  console.log("%cmahdi.dev | github.com/mahdi-dev110", "color:#888;font-family:monospace;font-size:11px;");
}

document.addEventListener("DOMContentLoaded", init);
