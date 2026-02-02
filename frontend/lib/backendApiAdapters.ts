/**
 * バックエンドリクエストアダプター
 * 役割: 各画像処理関数ごとにバックエンドが期待するリクエスト形式に変換
 * 注意: バックエンドのルート名に依存（例: createclane はタイポだが維持）
 */
import type {
    CLAHEParams,
    GaussianBlurParams,
    GrayscaleParams,
    ProcessNodeFunctionName,
    ProcessNodeParams,
} from '@/types/node';

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

export const buildDefaultAdapter = (): RequestAdapter => {
    return ({ baseUrl, functionName, params, inputData }) => ({
        url: `${baseUrl}/api/${functionName}`,
        init: {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                params,
                inputData,
            }),
        },
    });
};

export const buildCreateClaheAdapter = (): RequestAdapter => {
    return ({ baseUrl, params, inputData, base64ToBlob }) => {
        const typedParams = params as CLAHEParams;
        // Backend has a typo in the route name: 'createclane'
        const url = `${baseUrl}/api/createclane`;
        const formData = new FormData();
        const blob = base64ToBlob(inputData ?? '');
        formData.append('file', blob, 'image.jpg');
        formData.append('clipLimit', String(typedParams.clipLimit));
        if (typedParams.tileGridSize) {
            formData.append('tileGridSizeX', String(typedParams.tileGridSize[0]));
            formData.append('tileGridSizeY', String(typedParams.tileGridSize[1]));
        }
        return {
            url,
            init: {
                method: "POST",
                body: formData,
            },
        };
    };
};

export const buildGrayscaleAdapter = (): RequestAdapter => {
    return ({ baseUrl, functionName, params, inputData, base64ToBlob }) => {
        const typedParams = params as GrayscaleParams;
        const url = `${baseUrl}/api/${functionName}`;
        const formData = new FormData();
        const blob = base64ToBlob(inputData ?? '');
        formData.append('file', blob, 'image.jpg');
        if (typedParams.enableThreshold) {
            formData.append('threshold', String(typedParams.threshold));
        }
        return {
            url,
            init: {
                method: "POST",
                body: formData,
            },
        };
    };
};

export const buildGaussianBlurAdapter = (): RequestAdapter => {
    return ({ baseUrl, params, inputData, base64ToBlob }) => {
        const typedParams = params as GaussianBlurParams;
        // Backend uses 'gaussian_blur' route name
        const url = `${baseUrl}/api/gaussian_blur`;
        const formData = new FormData();
        const blob = base64ToBlob(inputData ?? '');
        formData.append('file', blob, 'image.jpg');
        if (typedParams.ksize) {
            formData.append('ksize', String(typedParams.ksize[0]));
        }
        formData.append('sigma', String(typedParams.sigmaX));
        return {
            url,
            init: {
                method: "POST",
                body: formData,
            },
        };
    };
};

export const createBackendAdapters = (): Record<string, RequestAdapter> => ({
    createclahe: buildCreateClaheAdapter(),
    grayscale: buildGrayscaleAdapter(),
    gaussianblur: buildGaussianBlurAdapter(),
});
