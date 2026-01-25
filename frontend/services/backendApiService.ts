
export class BackendApiService {
    private baseUrl: string;

    constructor() {
        const baseUrl = process.env.API_BASE_URL;
        if (!baseUrl) {
            console.warn("API_BASE_URL is not defined in environment variables");
        }
        this.baseUrl = baseUrl || "http://localhost:8080";
    }

    async processNode(functionName: string, params: any, inputData?: any) {
        // Construct the URL: {API_BASE_URL}/api/{functionName}
        const url = `${this.baseUrl}/api/${functionName}`;

        console.log(`[BackendApiService] Calling ${url} with params:`, params);

        try {
            let response;

            if (functionName === 'createclahe') {
                // Backend has a typo in the route name: 'createclane'
                const typoFixedUrl = `${this.baseUrl}/api/createclane`;

                const formData = new FormData();

                // Convert base64 inputData to Blob
                const blob = this.base64ToBlob(inputData);
                formData.append('file', blob, 'image.jpg');

                // Append specific params
                formData.append('clipLimit', String(params.clipLimit));
                if (params.tileGridSize) {
                    formData.append('tileGridSizeX', String(params.tileGridSize[0]));
                    formData.append('tileGridSizeY', String(params.tileGridSize[1]));
                }

                response = await fetch(typoFixedUrl, {
                    method: "POST",
                    body: formData,
                });
            } else if (functionName === 'grayscale') {
                const formData = new FormData();

                // Convert base64 inputData to Blob
                const blob = this.base64ToBlob(inputData);
                formData.append('file', blob, 'image.jpg');

                // Append threshold param only if enabled
                if (params.enableThreshold) {
                    formData.append('threshold', String(params.threshold));
                }

                response = await fetch(url, {
                    method: "POST",
                    body: formData,
                });
            } else if (functionName === 'gaussianblur') {
                // Backend uses 'gaussian_blur' route name
                const apiUrl = `${this.baseUrl}/api/gaussian_blur`;

                const formData = new FormData();

                // Convert base64 inputData to Blob
                const blob = this.base64ToBlob(inputData);
                formData.append('file', blob, 'image.jpg');

                // Append ksize and sigma params
                if (params.ksize) {
                    formData.append('ksize', String(params.ksize[0]));
                }
                formData.append('sigma', String(params.sigmaX));

                response = await fetch(apiUrl, {
                    method: "POST",
                    body: formData,
                });
            } else {
                response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        params,
                        inputData,
                    }),
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API call failed with status ${response.status}: ${errorText}`);
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("image/")) {
                const imageBlob = await response.blob();
                const base64Result = await this.blobToBase64(imageBlob);
                return {
                    status: "success",
                    result: base64Result
                };
            }

            const data = await response.json();

            // Normalize response if it follows the "ok: true, data: { url: ... }" pattern
            if (data.ok && data.data?.url && typeof data.data.url === 'string') {
                const imageResponse = await fetch(data.data.url);
                const imageBlob = await imageResponse.blob();
                const base64Result = await this.blobToBase64(imageBlob);

                return {
                    status: "success",
                    result: base64Result
                };
            }

            return data;
        } catch (error) {
            console.error(`[BackendApiService] Error calling ${functionName}:`, error);
            throw error;
        }
    }

    private base64ToBlob(base64: string): Blob {
        const parts = base64.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = parts[1];
        const buffer = Buffer.from(raw, 'base64');
        return new Blob([buffer], { type: contentType });
    }

    private async blobToBase64(blob: Blob): Promise<string> {
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return `data:${blob.type};base64,${buffer.toString('base64')}`;
    }
}

export const backendApiService = new BackendApiService();
