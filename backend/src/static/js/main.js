import { api } from './api.js';
import { UI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration Logic ---
    const apiUrlInput = document.getElementById('api-url');
    const btnSaveUrl = document.getElementById('btn-save-url');
    const STORAGE_KEY_API_URL = 'visionfy_api_url';

    // 1. Initial Load: Check localStorage
    const savedUrl = localStorage.getItem(STORAGE_KEY_API_URL);
    if (savedUrl) {
        // If we have a saved URL, use it
        api.setBaseURL(savedUrl);
        apiUrlInput.value = savedUrl;
        console.log(`Loaded API URL from storage: ${savedUrl}`);
    } else {
        // Otherwise use the default from api instance (config.js)
        apiUrlInput.value = api.baseURL;
    }

    // 2. Save Handler
    btnSaveUrl.addEventListener('click', () => {
        let newUrl = apiUrlInput.value.trim();
        // Basic validation: ensure protocol
        if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
            alert('URL should start with http:// or https://');
            return;
        }
        // Remove trailing slash for consistency
        if (newUrl.endsWith('/')) {
            newUrl = newUrl.slice(0, -1);
            apiUrlInput.value = newUrl;
        }

        api.setBaseURL(newUrl);
        localStorage.setItem(STORAGE_KEY_API_URL, newUrl);
        
        // Visual feedback
        const originalText = btnSaveUrl.textContent;
        btnSaveUrl.textContent = 'Saved!';
        setTimeout(() => {
            btnSaveUrl.textContent = originalText;
        }, 1500);
    });

    // Health Check
    document.getElementById('btn-health').addEventListener('click', async () => {
        UI.setLoading('btn-health', true);
        const res = await api.getHealth();
        UI.showResponse('res-health', res);
        UI.setLoading('btn-health', false);
    });

    // Create Clane
    document.getElementById('btn-createclane').addEventListener('click', async () => {
        const fileInput = document.getElementById('file-createclane');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select an image file.');
            return;
        }

        const clipLimit = UI.getInputValue('clip-limit');
        const gridSize = UI.getInputValue('grid-size');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('clipLimit', clipLimit);
        formData.append('tileGridSizeX', gridSize);
        formData.append('tileGridSizeY', gridSize);

        UI.setLoading('btn-createclane', true);
        const res = await api.createClane(formData);
        UI.showResponse('res-createclane', res);
        UI.setLoading('btn-createclane', false);
    });

    // Grayscale
    document.getElementById('btn-grayscale').addEventListener('click', async () => {
        const fileInput = document.getElementById('file-grayscale');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select an image file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        UI.setLoading('btn-grayscale', true);
        const res = await api.postGrayscale(formData);
        UI.showResponse('res-grayscale', res);
        UI.setLoading('btn-grayscale', false);
    });

    // Gaussian Blur
    document.getElementById('btn-gaussian').addEventListener('click', async () => {
        const fileInput = document.getElementById('file-gaussian');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select an image file.');
            return;
        }

        const ksize = UI.getInputValue('gaussian-ksize');
        const sigma = UI.getInputValue('gaussian-sigma');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('ksize', ksize);
        formData.append('sigma', sigma);

        UI.setLoading('btn-gaussian', true);
        const res = await api.postGaussianBlur(formData);
        UI.showResponse('res-gaussian', res);
        UI.setLoading('btn-gaussian', false);
    });
});
