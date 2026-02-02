/**
 * バックエンドAPIサービス
 * 役割: Flaskバックエンドへの画像処理リクエストを抽象化
 * 依存: backendApiAdaptersでエンドポイントごとのリクエスト形式を変換
 */
import {
    buildDefaultAdapter,
    createBackendAdapters,
    type RequestAdapter,
} from "./backendApiAdapters";
import type { ProcessNodeFunctionName, ProcessNodeParams } from '@/types/node';
import { NetworkError, ProcessingError, createErrorFromStatus } from './errors';

export class BackendApiService {
    private baseUrl: string;
    private adapters: Record<string, RequestAdapter>;

    constructor() {
        const baseUrl = process.env.API_BASE_URL;
        if (!baseUrl) {
            console.warn("API_BASE_URL is not defined in environment variables");
        }
        this.baseUrl = baseUrl || "http://localhost:8080";
        this.adapters = createBackendAdapters();
    }

    async processNode(functionName: ProcessNodeFunctionName, params: ProcessNodeParams, inputData?: string) {
        const adapter = this.adapters[functionName];
        const { url, init } = adapter
            ? adapter({
                baseUrl: this.baseUrl,
                functionName,
                params,
                inputData,
                base64ToBlob: this.base64ToBlob.bind(this),
            })
            : buildDefaultAdapter()({
                baseUrl: this.baseUrl,
                functionName,
                params,
                inputData,
                base64ToBlob: this.base64ToBlob.bind(this),
            });

        console.log(`[BackendApiService] Calling ${url} with params:`, params);

        try {
            const response = await fetch(url, init);

            if (!response.ok) {
                const errorText = await response.text();
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
                return {
                    status: "success",
                    result: base64Result
                };
            }

            const data = await response.json();

            // Normalize response if it follows the "ok: true, data: { url: ... }" pattern
            if (data.ok && data.data?.url && typeof data.data.url === 'string') {
                const imageResponse = await fetch(data.data.url);
                if (!imageResponse.ok) {
                    throw new NetworkError(
                        'Failed to fetch image from URL',
                        imageResponse.status,
                        `URL: ${data.data.url}`
                    );
                }
                const imageBlob = await imageResponse.blob();
                const base64Result = await this.blobToBase64(imageBlob);

                return {
                    status: "success",
                    result: base64Result
                };
            }

            return data;
        } catch (error) {
            // エラーの種類に応じて適切にラップ
            if (error instanceof NetworkError || error instanceof ProcessingError) {
                throw error;
            }

            // Fetch関連のエラー（ネットワーク切断など）
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new NetworkError(
                    `Failed to connect to backend: ${functionName}`,
                    undefined,
                    error.message
                );
            }

            // その他のエラー
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
