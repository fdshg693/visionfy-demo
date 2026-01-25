
export const UI = {
    // Show response in the specific result area
    showResponse: (elementId, response) => {
        const resultArea = document.getElementById(elementId);
        resultArea.classList.remove('hidden');
        
        // 1. Request Section
        const reqCode = resultArea.querySelector('.req-content');
        if (reqCode && response.request) {
            reqCode.textContent = JSON.stringify(response.request, null, 2);
        }

        // 2. Response Section
        const resCode = resultArea.querySelector('.res-content');
        // Fallback for elements not updated to new structure (just in case)
        const codeTarget = resCode || resultArea.querySelector('code');
        
        // Remove old image if any
        const oldImg = resultArea.querySelector('.response-image');
        if (oldImg) oldImg.remove();
        
        // Prepare display object (exclude request to avoid duplication in view)
        const responseToDisplay = {
            ok: response.ok,
            status: response.status,
            data: response.data
        };
        if (response.error) responseToDisplay.error = response.error;

        // Format JSON beautifully
        codeTarget.textContent = JSON.stringify(responseToDisplay, null, 2);

        // Basic color coding for status
        if (response.ok) {
            resultArea.style.borderColor = 'var(--success-color)';
            
            // Show image if available
            if (response.data && response.data.url) {
                const img = document.createElement('img');
                img.src = response.data.url;
                img.className = 'response-image';
                img.style.maxWidth = '100%';
                img.style.marginTop = '10px';
                img.style.borderRadius = '8px';
                
                // Append to appropriate container
                if (resCode && resCode.parentElement) {
                    resCode.parentElement.appendChild(img);
                } else {
                    resultArea.appendChild(img);
                }
            }
        } else {
            resultArea.style.borderColor = '#ef4444'; // Red for error
        }
    },

    setLoading: (btnId, isLoading) => {
        const btn = document.getElementById(btnId);
        if (isLoading) {
            btn.dataset.originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;
        } else {
            btn.textContent = btn.dataset.originalText || 'Send Request';
            btn.disabled = false;
        }
    },
    
    getInputValue: (elementId) => {
        const el = document.getElementById(elementId);
        return el ? el.value : null;
    }
};
