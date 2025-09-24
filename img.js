// DOM Elements
const promptInput = document.getElementById('prompt');
const negativePromptInput = document.getElementById('negativePrompt');
const styleSelect = document.getElementById('style');
const guidanceScale = document.getElementById('guidanceScale');
const guidanceValue = document.getElementById('guidanceValue');
const generateBtn = document.getElementById('generateBtn');
const imagePlaceholder = document.getElementById('imagePlaceholder');
const generatedImage = document.getElementById('generatedImage');
const loading = document.getElementById('loading');
const historyGrid = document.getElementById('historyGrid');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const toggleAdvanced = document.getElementById('toggleAdvanced');
const advancedOptions = document.getElementById('advancedOptions');
const welcomeScreen = document.getElementById('welcomeScreen');
const getStartedBtn = document.getElementById('getStartedBtn');
const galleryModal = document.getElementById('galleryModal');
const galleryImage = document.getElementById('galleryImage');
const galleryPrompt = document.getElementById('galleryPrompt');
const galleryClose = document.getElementById('galleryClose');
const skeletonLoader = document.getElementById('skeletonLoader');

// API Configuration - Using your actual API
const apiConfig = {
    url: 'https://ai-image-generator-free.p.rapidapi.com/generate/stream',
    key: 'd7dc4fd514msh8bee676242d03aap1fbc81jsn24e8c880075e',
    host: 'ai-image-generator-free.p.rapidapi.com'
};

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    createParticles();
    updateGuidanceValue();
    loadHistory();

    // Check if user has seen welcome screen before
    const hasSeenWelcome = localStorage.getItem('mahdiAIHasSeenWelcome');
    if (hasSeenWelcome) {
        welcomeScreen.style.display = 'none';
    } else {
        welcomeScreen.style.display = 'flex';
    }

    // Event Listeners
    guidanceScale.addEventListener('input', updateGuidanceValue);
    generateBtn.addEventListener('click', generateImage);
    toggleAdvanced.addEventListener('click', toggleAdvancedOptions);
    getStartedBtn.addEventListener('click', closeWelcomeScreen);
    galleryClose.addEventListener('click', closeGallery);

    // Close gallery when clicking outside the image
    galleryModal.addEventListener('click', function (e) {
        if (e.target === galleryModal) {
            closeGallery();
        }
    });

    // Accessibility: Make sure screen readers announce when image is generated
    generatedImage.addEventListener('load', function () {
        // This will be announced by screen readers due to aria-live="polite"
    });
});

// Close welcome screen
function closeWelcomeScreen() {
    welcomeScreen.style.opacity = '0';
    welcomeScreen.style.visibility = 'hidden';
    localStorage.setItem('mahdiAIHasSeenWelcome', 'true');
}

// Open gallery with image and prompt
function openGallery(imageUrl, prompt) {
    galleryImage.src = imageUrl;
    galleryPrompt.textContent = prompt;
    galleryModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

// Close gallery
function closeGallery() {
    galleryModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

// Update guidance scale value display
function updateGuidanceValue() {
    guidanceValue.textContent = guidanceScale.value;
    guidanceScale.setAttribute('aria-valuetext', `Guidance scale set to ${guidanceScale.value}`);
}

// Toggle advanced options
function toggleAdvancedOptions() {
    const isExpanded = advancedOptions.style.display === 'block';
    advancedOptions.style.display = isExpanded ? 'none' : 'block';
    toggleAdvanced.classList.toggle('active');
    toggleAdvanced.setAttribute('aria-expanded', !isExpanded);
}

// Create floating particles for background
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Random properties
        const size = Math.random() * 5 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 15;
        const duration = Math.random() * 10 + 10;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;

        // Random color
        const colors = ['#00f3ff', '#9d4edd', '#ff6b6b', '#f9c74f'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.background = color;

        particlesContainer.appendChild(particle);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    notificationText.textContent = message;
    notification.className = 'notification'; // Reset classes
    notification.classList.add(type);
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Generate image using your actual API
async function generateImage() {
    const prompt = promptInput.value.trim();

    if (!prompt) {
        showNotification('Please enter a prompt for the image', 'error');
        promptInput.focus();
        return;
    }

    // Show loading state with skeleton loader
    generateBtn.disabled = true;
    imagePlaceholder.style.display = 'none';
    generatedImage.style.display = 'none';
    loading.style.display = 'flex';
    skeletonLoader.style.display = 'block';

    try {
        // Prepare request body according to API requirements
        const requestBody = {
            prompt: prompt,
            negativePrompt: negativePromptInput.value || undefined,
            guidanceScale: parseFloat(guidanceScale.value),
            style: styleSelect.value !== '(No style)' ? styleSelect.value : undefined,
            width: parseInt(document.getElementById('width').value) || 512,
            height: parseInt(document.getElementById('height').value) || 512,
            steps: parseInt(document.getElementById('steps').value) || 20
        };

        // Remove undefined values
        Object.keys(requestBody).forEach(key => {
            if (requestBody[key] === undefined) {
                delete requestBody[key];
            }
        });

        const response = await fetch(apiConfig.url, {
            method: 'POST',
            headers: {
                'x-rapidapi-key': apiConfig.key,
                'x-rapidapi-host': apiConfig.host,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} - ${response.statusText}`);
        }

        // Try to parse the response as JSON first
        let result;
        const responseText = await response.text();

        try {
            result = JSON.parse(responseText);
        } catch (e) {
            // If it's not JSON, try to extract URL from text
            const imageUrlMatch = responseText.match(/https?:\/\/[^\s"']+/);
            if (imageUrlMatch) {
                result = { imageUrl: imageUrlMatch[0] };
            } else {
                throw new Error('Could not parse API response');
            }
        }

        // Check if we have an image URL in the response
        const imageUrl = result.imageUrl || result.url || result.data?.url;

        if (!imageUrl) {
            throw new Error('No image URL found in API response');
        }

        // Verify the image URL is valid
        await verifyImageUrl(imageUrl);

        // Hide skeleton and show the generated image
        skeletonLoader.style.display = 'none';
        generatedImage.src = imageUrl;
        generatedImage.style.display = 'block';
        loading.style.display = 'none';

        // Save to history
        saveToHistory(prompt, imageUrl);

        showNotification('Image generated successfully!', 'success');

    } catch (error) {
        console.error('Error generating image:', error);
        loading.style.display = 'none';
        skeletonLoader.style.display = 'none';
        imagePlaceholder.style.display = 'flex';

        // Provide more specific error messages
        let errorMessage = 'Error generating image';
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error: Please check your connection';
        } else if (error.message.includes('API error')) {
            errorMessage = 'API service error: Please try again later';
        } else {
            errorMessage = error.message;
        }

        showNotification(errorMessage, 'error');
    } finally {
        generateBtn.disabled = false;
    }
}

// Verify that the image URL is accessible
async function verifyImageUrl(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error('Generated image failed to load'));
        img.src = url;
    });
}

// Save generated image to history
function saveToHistory(prompt, imageUrl) {
    const history = JSON.parse(localStorage.getItem('mahdiAIHistory') || '[]');

    // Add new item to beginning of array
    history.unshift({
        prompt: prompt,
        imageUrl: imageUrl,
        timestamp: new Date().toISOString()
    });

    // Keep only last 10 items
    if (history.length > 10) {
        history.splice(10);
    }

    // Save to localStorage
    localStorage.setItem('mahdiAIHistory', JSON.stringify(history));

    // Update history display
    loadHistory();
}

// Delete history item
function deleteHistoryItem(index) {
    const history = JSON.parse(localStorage.getItem('mahdiAIHistory') || '[]');

    if (index >= 0 && index < history.length) {
        history.splice(index, 1);
        localStorage.setItem('mahdiAIHistory', JSON.stringify(history));
        loadHistory();
        showNotification('Image deleted from history', 'success');
    }
}

// Load history from localStorage
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('mahdiAIHistory') || '[]');
    historyGrid.innerHTML = '';

    if (history.length === 0) {
        historyGrid.innerHTML = '<div class="empty-history">No generation history yet. Your generated images will appear here.</div>';
        return;
    }

    history.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        historyItem.setAttribute('role', 'button');
        historyItem.setAttribute('tabindex', '0');
        historyItem.setAttribute('aria-label', `View image generated from prompt: ${item.prompt}`);

        historyItem.innerHTML = `
                    <img src="${item.imageUrl}" alt="Generated image based on prompt: ${item.prompt}" 
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<i>🖼️</i><div class=\\'prompt-preview\\'>Image failed to load</div>';">
                    <div class="prompt-preview">${item.prompt.substring(0, 30)}${item.prompt.length > 30 ? '...' : ''}</div>
                    <div class="history-item-actions">
                        <button class="delete-btn" aria-label="Delete this image">×</button>
                    </div>
                `;

        // Click and keyboard support for accessibility
        historyItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                openGallery(item.imageUrl, item.prompt);
            }
        });

        historyItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openGallery(item.imageUrl, item.prompt);
            }
        });

        // Delete button event
        const deleteBtn = historyItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the gallery open
            deleteHistoryItem(index);
        });

        historyGrid.appendChild(historyItem);
    });
}