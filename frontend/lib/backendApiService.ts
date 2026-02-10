/**
 * バックエンドAPIサービス
 * 役割: Flaskバックエンドへの画像処理リクエストを抽象化
 * 依存: backendApiAdaptersでエンドポイントごとのリクエスト形式を変換
 */
import {
    createBackendAdapters,
    type RequestAdapter,
} from "./backendApiAdapters";
import type { ProcessNodeFunctionName, ProcessNodeParams } from '@/types/processNode';
import { NetworkError, ProcessingError, createErrorFromStatus } from './errors';
import { createLogger, logEnvVar } from './logger';

const logger = createLogger('BackendApiService');

export class BackendApiService {
    private baseUrl: string;
    private adapters: Record<string, RequestAdapter>;

    constructor() {
        const baseUrl = process.env.API_BASE_URL;
        logEnvVar(logger, 'API_BASE_URL', baseUrl);
        if (!baseUrl) {
            logger.warn("API_BASE_URL is not defined, using default: http://localhost:8080");
        }
        this.baseUrl = baseUrl || "http://localhost:8080";
        this.adapters = createBackendAdapters();
        logger.info({ baseUrl: this.baseUrl }, 'BackendApiService initialized');
    }

    async processNode(functionName: ProcessNodeFunctionName, params: ProcessNodeParams, inputData?: string) {
        const adapter = this.adapters[functionName];
        if (!adapter) {
            throw new ProcessingError(
                `No adapter registered for function: ${functionName}`,
                `未対応の処理関数です (${functionName})`,
            );
        }
        const { url, init } = adapter({
            baseUrl: this.baseUrl,
            functionName,
            params,
            inputData,
            base64ToBlob: this.base64ToBlob.bind(this),
        });

        logger.info({ functionName, params, url }, 'API request starting');

        try {
            const response = await fetch(url, init);
            logger.debug({ status: response.status, statusText: response.statusText }, 'API response received');

            if (!response.ok) {
                const errorText = await response.text();
                logger.error({ status: response.status, statusText: response.statusText, errorText }, 'API request failed');
                throw createErrorFromStatus(
                    response.status,
                    response.statusText,
                    errorText
                );
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("image/")) {
                const imageBlob = await response.blob();
                const base64Result = await this.blobToBase64(imageBlob);
                logger.info({ functionName, contentType }, 'Image response processed successfully');
                return {
                    status: "success",
                    result: base64Result
                };
            }

            const data = await response.json();

            // Normalize response if it follows the "ok: true, data: { url: ... }" pattern
            if (data.ok && data.data?.url && typeof data.data.url === 'string') {
                logger.debug({ url: data.data.url }, 'Fetching image from URL');
                const imageResponse = await fetch(data.data.url);
                if (!imageResponse.ok) {
                    logger.error({ url: data.data.url, status: imageResponse.status }, 'Failed to fetch image from URL');
                    throw new NetworkError(
                        'Failed to fetch image from URL',
                        imageResponse.status,
                        `URL: ${data.data.url}`
                    );
                }
                const imageBlob = await imageResponse.blob();
                const base64Result = await this.blobToBase64(imageBlob);
                logger.info({ functionName }, 'Image fetched from URL successfully');
                return {
                    status: "success",
                    result: base64Result
                };
            }

            logger.info({ functionName }, 'JSON response processed successfully');
            return data;
        } catch (error) {
            // エラーの種類に応じて適切にラップ
            if (error instanceof NetworkError || error instanceof ProcessingError) {
                logger.error({ functionName, errorType: error.name, message: error.message }, 'Known error type');
                throw error;
            }

            // Fetch関連のエラー（ネットワーク切断など）
            if (error instanceof TypeError && error.message.includes('fetch')) {
                logger.error({ functionName, errorMessage: error.message }, 'Network connection error');
                throw new NetworkError(
                    `Failed to connect to backend: ${functionName}`,
                    undefined,
                    error.message
                );
            }

            // その他のエラー
            logger.error({ functionName, error: error instanceof Error ? error.message : String(error) }, 'Unexpected error');
            throw new ProcessingError(
                `Error processing ${functionName}`,
                `画像処理中にエラーが発生しました (${functionName})`,
                error instanceof Error ? error.message : String(error)
            );
        }
    }

    private base64ToBlob(base64: string): Blob {
        const [header, data] = base64.split(',');
        const match = /data:(.*?);base64/.exec(header);
        const contentType = match?.[1] ?? 'application/octet-stream';
        if (typeof window === 'undefined') {
            const buffer = Buffer.from(data ?? '', 'base64');
            return new Blob([buffer], { type: contentType });
        }
        const raw = data ? atob(data) : '';
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i += 1) {
            bytes[i] = raw.charCodeAt(i);
        }
        return new Blob([bytes], { type: contentType });
    }

    private async blobToBase64(blob: Blob): Promise<string> {
        if (typeof window === 'undefined') {
            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return `data:${blob.type};base64,${buffer.toString('base64')}`;
        }
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    }
}

export const backendApiService = new BackendApiService();
