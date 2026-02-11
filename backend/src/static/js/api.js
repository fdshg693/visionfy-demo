import config from './config.js';

class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    setBaseURL(url) {
        this.baseURL = url;
    }

    /**
     * Generic request method
     * @param {string} endpoint - The API endpoint (e.g., '/health')
     * @param {string} method - HTTP method (GET, POST, etc.)
     * @param {object} [data] - Request body (optional)
     */
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}${endpoint}`;
        
        const options = {
            method: method,
            headers: {},
            mode: 'cors'
        };

        if (data) {
            if (data instanceof FormData) {
                options.body = data;
                // Content-Type is set automatically by the browser for FormData
            } else {
                options.headers['Content-Type'] = 'application/json';
                if (method !== 'GET') {
                    options.body = JSON.stringify(data);
                }
            }
        }

        try {
            const response = await fetch(url, options);
            let responseData;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else if (contentType && contentType.includes('image')) {
                const blob = await response.blob();
                // Create object URL for preview if needed, but for now just return info
                // Note: The UI just JSON.stringifies this, so we return a descriptive string or object
                responseData = {
                    message: 'Image received successfully',
                    type: contentType,
                    size: blob.size,
                    url: URL.createObjectURL(blob)
                };
                
                // Extract anomaly score if present (model inference endpoint)
                const anomalyScore = response.headers.get('X-Anomaly-Score');
                if (anomalyScore) {
                    responseData.anomalyScore = parseFloat(anomalyScore);
                }
            } else {
                responseData = await response.text();
            }

            // Prepare request info for display
            let requestBody = data;
            if (data instanceof FormData) {
                const formObj = {};
                for (const [key, value] of data.entries()) {
                   if (value instanceof File) {
                       formObj[key] = `File: ${value.name} (${value.type}, ${value.size} bytes)`;
                   } else {
                       formObj[key] = value;
                   }
                }
                requestBody = formObj;
            }
            
            return {
                ok: response.ok,
                status: response.status,
                data: responseData,
                request: {
                    url,
                    method,
                    headers: options.headers,
                    body: requestBody
                }
            };
        } catch (error) {
            console.error('API Request Error:', error);
            return {
                ok: false,
                error: error.message,
                request: {
                    url,
                    method,
                    headers: options.headers,
                    body: data
                }
            };
        }
    }

    // Specific API methods
    async getHealth() {
        return this.request('/health');
    }

    async createClane(data) {
        return this.request('/api/createclahe', 'POST', data);
    }

    async postGrayscale(data) {
        return this.request('/api/grayscale', 'POST', data);
    }

    async postGaussianBlur(data) {
        return this.request('/api/gaussian_blur', 'POST', data);
    }

    async postRemoveNoise(data) {
        return this.request('/api/remove_noise', 'POST', data);
    }

    async postRestoreContrast(data) {
        return this.request('/api/restore_contrast', 'POST', data);
    }

    async postRestoreBrightness(data) {
        return this.request('/api/restore_brightness', 'POST', data);
    }

    async postModelInference(data) {
        return this.request('/api/model_inference', 'POST', data);
    }

    async postGenerateCode(data) {
        return this.request('/api/generate_code', 'POST', data);
    }
}

export const api = new ApiClient(config.baseURL);
