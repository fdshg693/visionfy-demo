import { PROCESS_FUNCTIONS_BASE, type OpencvParamValue } from './processFunctionBase';

export const CV2_COLOR_RGB2GRAY = 7;

export type { OpencvParamValue };

export interface OpencvParamDefinition {
    name: string;
    /** 入力パラメータのタイプ */
    type: 'number' | 'text' | 'select' | 'tuple' | 'boolean';
    options?: { label: string; value: number | string | boolean }[];
    defaultValue?: OpencvParamValue;
    label?: string; // Display label (uses name if omitted)
    /** Input step increment (e.g. 2 for odd-only when min is 1) */
    step?: number;
    /** Minimum allowed value */
    min?: number;
}

export interface OpencvFunctionConfig {
    description: string;
    params: OpencvParamDefinition[];
}

/**
 * OpenCV関数ごとの設定定義。
 * processFunctionBase.ts の PROCESS_FUNCTIONS_BASE から自動生成
 *
 * - key: 関数名
 * - value: 関数の説明とパラメータ定義
 * - value.description: 関数の説明文
 * - value.params: 各パラメータの名前、タイプ、デフォルト値など
 */
export const VISIONFY_FUNCTIONS_CONFIG: Record<string, OpencvFunctionConfig> = Object.fromEntries(
    Object.entries(PROCESS_FUNCTIONS_BASE).map(([functionName, definition]) => [
        functionName,
        {
            description: definition.description,
            params: Object.entries(definition.params).map(([paramName, paramDef]) => ({
                name: paramName,
                type: paramDef.type,
                defaultValue: paramDef.defaultValue,
                label: paramDef.label,
                step: paramDef.step,
                min: paramDef.min,
                options: paramDef.options,
            })),
        },
    ])
);
