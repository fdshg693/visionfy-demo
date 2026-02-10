/**
 * バックエンドリクエストアダプター
 * 役割: 各画像処理関数ごとにバックエンドが期待するリクエスト形式に変換
 * 全エンドポイントは画像ファイル + パラメータを multipart/form-data で送信
 */
import type {
    CLAHEParams,
    GaussianBlurParams,
    GrayscaleParams,
    RestoreBrightnessParams,
    RestoreContrastParams,
    ModelInferenceParams,
    ProcessNodeFunctionName,
    ProcessNodeParams,
} from '@/types/processNode';

export type RequestAdapterResult = {
    url: string;
    init: RequestInit;
};

export type RequestAdapterArgs<TParams = ProcessNodeParams> = {
    baseUrl: string;
    functionName: ProcessNodeFunctionName;
    params: TParams;
    inputData?: string;
    base64ToBlob: (base64: string) => Blob;
};

export type RequestAdapter = (args: RequestAdapterArgs) => RequestAdapterResult;

export const buildCreateClaheAdapter = (): RequestAdapter => {
    return ({ baseUrl, params, inputData, base64ToBlob }) => {
        const typedParams = params as CLAHEParams;
        const formData = new FormData();
        formData.append('file', base64ToBlob(inputData ?? ''), 'image.jpg');
        formData.append('clipLimit', String(typedParams.clipLimit));
        formData.append('tileGridSizeX', String(typedParams.tileGridSize[0]));
        formData.append('tileGridSizeY', String(typedParams.tileGridSize[1]));
        return {
            url: `${baseUrl}/api/createclahe`,
            init: { method: "POST", body: formData },
        };
    };
};

export const buildGrayscaleAdapter = (): RequestAdapter => {
    return ({ baseUrl, params, inputData, base64ToBlob }) => {
        const typedParams = params as GrayscaleParams;
        const formData = new FormData();
        formData.append('file', base64ToBlob(inputData ?? ''), 'image.jpg');
        if (typedParams.enableThreshold) {
            formData.append('threshold', String(typedParams.threshold));
        }
        return {
            url: `${baseUrl}/api/grayscale`,
            init: { method: "POST", body: formData },
        };
    };
};

export const buildGaussianBlurAdapter = (): RequestAdapter => {
    return ({ baseUrl, params, inputData, base64ToBlob }) => {
        const typedParams = params as GaussianBlurParams;
        const formData = new FormData();
        formData.append('file', base64ToBlob(inputData ?? ''), 'image.jpg');
        formData.append('ksizeX', String(typedParams.ksize[0]));
        formData.append('ksizeY', String(typedParams.ksize[1]));
        formData.append('sigmaX', String(typedParams.sigmaX));
        formData.append('sigmaY', String(typedParams.sigmaY));
        return {
            url: `${baseUrl}/api/gaussian_blur`,
            init: { method: "POST", body: formData },
        };
    };
};

export const buildRemoveNoiseAdapter = (): RequestAdapter => {
    return ({ baseUrl, inputData, base64ToBlob }) => {
        const formData = new FormData();
        formData.append('file', base64ToBlob(inputData ?? ''), 'image.jpg');
        return {
            url: `${baseUrl}/api/remove_noise`,
            init: { method: "POST", body: formData },
        };
    };
};

export const buildRestoreBrightnessAdapter = (): RequestAdapter => {
    return ({ baseUrl, params, inputData, base64ToBlob }) => {
        const typedParams = params as RestoreBrightnessParams;
        const formData = new FormData();
        formData.append('file', base64ToBlob(inputData ?? ''), 'image.jpg');
        formData.append('value', String(typedParams.value));
        return {
            url: `${baseUrl}/api/restore_brightness`,
            init: { method: "POST", body: formData },
        };
    };
};

export const buildRestoreContrastAdapter = (): RequestAdapter => {
    return ({ baseUrl, params, inputData, base64ToBlob }) => {
        const typedParams = params as RestoreContrastParams;
        const formData = new FormData();
        formData.append('file', base64ToBlob(inputData ?? ''), 'image.jpg');
        formData.append('gamma', String(typedParams.gamma));
        return {
            url: `${baseUrl}/api/restore_contrast`,
            init: { method: "POST", body: formData },
        };
    };
};

export const buildModelInferenceAdapter = (): RequestAdapter => {
    return ({ baseUrl, params, inputData, base64ToBlob }) => {
        const typedParams = params as ModelInferenceParams;
        const formData = new FormData();
        formData.append('file', base64ToBlob(inputData ?? ''), 'image.jpg');
        formData.append('overlayAlpha', String(typedParams.overlayAlpha));
        formData.append('heatmapAlpha', String(typedParams.heatmapAlpha));
        return {
            url: `${baseUrl}/api/model_inference`,
            init: { method: "POST", body: formData },
        };
    };
};

export const createBackendAdapters = (): Record<string, RequestAdapter> => ({
    createclahe: buildCreateClaheAdapter(),
    grayscale: buildGrayscaleAdapter(),
    gaussianblur: buildGaussianBlurAdapter(),
    remove_noise: buildRemoveNoiseAdapter(),
    restore_brightness: buildRestoreBrightnessAdapter(),
    restore_contrast: buildRestoreContrastAdapter(),
    model_inference: buildModelInferenceAdapter(),
});
