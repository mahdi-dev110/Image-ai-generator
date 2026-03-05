const UI = {
    form: document.getElementById('generator-form'),
    prompt: document.getElementById('prompt'),
    style: document.getElementById('style'),
    width: document.getElementById('width'),
    height: document.getElementById('height'),
    generateBtn: document.getElementById('generateBtn'),

    states: {
        placeholder: document.getElementById('placeholderState'),
        loading: document.getElementById('loadingState'),
        result: document.getElementById('resultState')
    },

    generatedImage: document.getElementById('generatedImage'),

    toggleAdvanced: document.getElementById('toggleAdvanced'),
    advancedOptions: document.getElementById('advancedOptions'),

    downloadBtn: document.getElementById('downloadBtn'),
    expandBtn: document.getElementById('expandBtn'),

    historyTrack: document.getElementById('historyTrack'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),


    lightbox: document.getElementById('lightboxModal'),
    lightboxImg: document.getElementById('lightboxImage'),
    lightboxCaption: document.getElementById('lightboxCaption'),
    closeModal: document.getElementById('closeModal'),
    toastContainer: document.getElementById('toastContainer'),


    particles: document.getElementById('particles')
};




const APP_STATE = {
    isGenerating: false,
    currentImageOriginalUrl: null,
    history: JSON.parse(localStorage.getItem('mahdimg_history')) || []
};




document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    renderHistory();


    UI.advancedOptions.classList.add('hidden');


    UI.form.addEventListener('submit', handleGenerate);
    UI.toggleAdvanced.addEventListener('click', toggleAdvancedPanel);


    UI.downloadBtn.addEventListener('click', handleDownload);
    UI.expandBtn.addEventListener('click', () => openLightbox(UI.generatedImage.src, UI.prompt.value));


    UI.clearHistoryBtn.addEventListener('click', clearHistory);


    UI.closeModal.addEventListener('click', closeLightbox);
    UI.lightbox.addEventListener('click', (e) => {
        if (e.target === UI.lightbox) closeLightbox();
    });


    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && UI.lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });

    showToast('Welcome to Mahdimg AI! ✨', 'info');
});





/**
 * Handles the generation process
 */
async function handleGenerate(e) {
    if (e) e.preventDefault();
    if (APP_STATE.isGenerating) return;

    const basePrompt = UI.prompt.value.trim();
    if (!basePrompt) {
        showToast('Please describe the image you want to create.', 'error');
        UI.prompt.focus();
        return;
    }


    const styleModifier = UI.style.value;
    const finalPrompt = basePrompt + styleModifier;


    const w = UI.width.value || 1024;
    setViewState('loading');
    APP_STATE.isGenerating = true;
    UI.generateBtn.disabled = true;

    try {
        // Generate image using Puter AI
        const generatedImgElement = await puter.ai.txt2img(finalPrompt);
        const imageUrl = generatedImgElement.src;

        // Image successfully loaded
        UI.generatedImage.src = imageUrl;
        APP_STATE.currentImageOriginalUrl = imageUrl;

        setViewState('result');
        showToast('Masterpiece generated successfully! 🎨', 'success');


        addToHistory({
            url: imageUrl,
            prompt: basePrompt,
            timestamp: Date.now()
        });

    } catch (error) {
        setViewState('placeholder');
        showToast('Failed to generate image. Please try again.', 'error');
        console.error('Generation Error:', error);
    } finally {
        APP_STATE.isGenerating = false;
        UI.generateBtn.disabled = false;
    }
}

/**
 * Preloads an image to ensure it's fully downloaded before showing in UI
 */
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error('Image failed to load'));
        img.src = url;
    });
}





/**
 * Switches the central stage view
 */
function setViewState(state) {
    UI.states.placeholder.style.display = 'none';
    UI.states.loading.style.display = 'none';
    UI.states.result.style.display = 'none';

    if (state === 'placeholder') UI.states.placeholder.style.display = 'flex';
    if (state === 'loading') UI.states.loading.style.display = 'flex';
    if (state === 'result') UI.states.result.style.display = 'block';
}

function toggleAdvancedPanel() {
    const isHidden = UI.advancedOptions.classList.contains('hidden');
    if (isHidden) {
        UI.advancedOptions.classList.remove('hidden');
        UI.toggleAdvanced.setAttribute('aria-expanded', 'true');
    } else {
        UI.advancedOptions.classList.add('hidden');
        UI.toggleAdvanced.setAttribute('aria-expanded', 'false');
    }
}




function addToHistory(item) {

    APP_STATE.history.unshift(item);


    if (APP_STATE.history.length > 15) {
        APP_STATE.history.pop();
    }


    localStorage.setItem('mahdimg_history', JSON.stringify(APP_STATE.history));


    renderHistory();
}

function renderHistory() {
    UI.historyTrack.innerHTML = '';

    if (APP_STATE.history.length === 0) {
        UI.historyTrack.innerHTML = '<p style="color: rgba(255,255,255,0.4); margin: auto;">No history yet</p>';
        return;
    }

    APP_STATE.history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <img src="${item.url}" alt="${item.prompt}" loading="lazy"/>
            <div class="history-overlay">${item.prompt}</div>
        `;

        div.addEventListener('click', () => {
            openLightbox(item.url, item.prompt);
        });

        UI.historyTrack.appendChild(div);
    });
}

function clearHistory() {
    if (confirm('Are you sure you want to clear your local history?')) {
        APP_STATE.history = [];
        localStorage.removeItem('mahdimg_history');
        renderHistory();
        showToast('History cleared', 'info');
    }
}





async function handleDownload() {
    if (!APP_STATE.currentImageOriginalUrl) return;

    try {
        const response = await fetch(APP_STATE.currentImageOriginalUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;

        const safeName = UI.prompt.value.trim().substring(0, 20).replace(/[^a-z0-9]/gi, '_');
        a.download = `MahdimgAI_${safeName}.png`;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('Image downloaded!', 'success');
    } catch (e) {
        console.error("Download failed:", e);

        window.open(APP_STATE.currentImageOriginalUrl, '_blank');
    }
}

function openLightbox(url, caption) {
    UI.lightboxImg.src = url;
    UI.lightboxCaption.textContent = caption;
    UI.lightbox.classList.add('active');
    UI.lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
    UI.lightbox.classList.remove('active');
    UI.lightbox.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
        if (!UI.lightbox.classList.contains('active')) UI.lightboxImg.src = '';
    }, 400);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;


    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="toast-icon" stroke="var(--success)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="toast-icon" stroke="var(--danger)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else {
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="toast-icon" stroke="var(--clr-primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    UI.toastContainer.appendChild(toast);


    setTimeout(() => {
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

function initParticles() {
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';


        const size = Math.random() * 4 + 1;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;

        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}%;
            top: ${y}%;
            opacity: ${Math.random() * 0.3 + 0.1};
            animation: float ${duration}s ease-in-out ${delay}s infinite alternate;
        `;


        const tint = Math.random();
        if (tint > 0.8) particle.style.background = 'var(--clr-primary)';
        else if (tint > 0.6) particle.style.background = 'var(--clr-secondary)';

        UI.particles.appendChild(particle);
    }


    if (!document.getElementById('particle-keyframes')) {
        const style = document.createElement('style');
        style.id = 'particle-keyframes';
        style.textContent = `
            @keyframes float {
                0% { transform: translate(0, 0); }
                100% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px); }
            }
        `;
        document.head.appendChild(style);
    }
}