// 役割: 処理ノードのパラメータ入力UIを関数定義に沿って表示する。
// 依存: VISIONFY_FUNCTIONS_CONFIGの定義に合わせて入力を生成する。
import type { OpencvParamDefinition, OpencvParamValue } from '@/types/opencv';
import { VISIONFY_FUNCTIONS_CONFIG } from '@/types/opencv';
import type { ProcessNodeFunctionName, ProcessNodeParams } from '@/types/node';
import type { ReactNode } from 'react';
import styles from './ProcessNode.module.css';
import formStyles from '@/lib/styles/forms.module.css';

type Props = {
    functionName?: ProcessNodeFunctionName;
    params?: ProcessNodeParams;
    onParamChange: (key: string, value: OpencvParamValue) => void;
    classNames?: {
        field: string;
        label: string;
        input: string;
        select: string;
        tupleInput: string;
        smallInput: string;
    };
};

type ParamRowProps = {
    label: string;
    children: ReactNode;
};

function ParamRow({ label, children }: ParamRowProps) {
    return (
        <div className={styles.paramRow}>
            <label>{label}</label>
            {children}
        </div>
    );
}

type ParamFieldProps = {
    config: OpencvParamDefinition;
    value: OpencvParamValue | undefined;
    onChange: (value: OpencvParamValue) => void;
    classNames?: Props['classNames'];
};

type ParamFieldRenderArgs = {
    config: OpencvParamDefinition;
    currentValue: OpencvParamValue | undefined;
    onChange: (value: OpencvParamValue) => void;
    classNames?: Props['classNames'];
};

type ParamFieldRenderer = (args: ParamFieldRenderArgs) => React.ReactNode;

/**
 * 各パラメータタイプに応じた入力フィールドレンダラーのマッピング。
 */
const PARAM_FIELD_RENDERERS: Record<OpencvParamDefinition['type'], ParamFieldRenderer> = {
    select: ({ config, currentValue, onChange, classNames }) => (
        <select
            value={String(currentValue ?? '')}
            onChange={(e) => {
                const selected = config.options?.find(
                    (option) => String(option.value) === e.target.value
                );
                onChange((selected?.value ?? e.target.value) as OpencvParamValue);
            }}
            className={classNames?.select ?? `${formStyles['input-select']} ${formStyles.small} nodrag`}
        >
            {config.options?.map((opt) => (
                <option key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                </option>
            ))}
        </select>
    ),
    tuple: ({ config, currentValue, onChange, classNames }) => {
        const tupleVal = Array.isArray(currentValue) ? currentValue : [0, 0];
        const handleTupleChange = (index: number, val: string) => {
            let parsed = Number.parseFloat(val);
            if (Number.isNaN(parsed)) parsed = 0;
            // Enforce step/min constraints (e.g. odd-only for ksize)
            if (config.min !== undefined && parsed < config.min) {
                parsed = config.min;
            }
            if (config.step && config.min !== undefined) {
                parsed = Math.round((parsed - config.min) / config.step) * config.step + config.min;
            }
            const newTuple: [number, number] = [
                index === 0 ? parsed : tupleVal[0],
                index === 1 ? parsed : tupleVal[1],
            ];
            onChange(newTuple);
        };

        return (
            <div className={classNames?.tupleInput ?? formStyles['tuple-input']}>
                <input
                    type="number"
                    value={tupleVal[0]}
                    onChange={(e) => handleTupleChange(0, e.target.value)}
                    className={classNames?.smallInput ?? `${formStyles['input-small']} nodrag`}
                    placeholder="x"
                    step={config.step}
                    min={config.min}
                />
                <input
                    type="number"
                    value={tupleVal[1]}
                    onChange={(e) => handleTupleChange(1, e.target.value)}
                    className={classNames?.smallInput ?? `${formStyles['input-small']} nodrag`}
                    placeholder="y"
                    step={config.step}
                    min={config.min}
                />
            </div>
        );
    },
    boolean: ({ currentValue, onChange, classNames }) => (
        <input
            type="checkbox"
            checked={Boolean(currentValue)}
            onChange={(e) => onChange(e.target.checked)}
            className={classNames ? undefined : `${formStyles['input-checkbox']} nodrag`}
        />
    ),
    number: ({ config, currentValue, onChange, classNames }) => (
        <input
            type="number"
            value={Number(currentValue ?? 0)}
            onChange={(e) => onChange(Number(e.target.value))}
            className={classNames?.input ?? `${formStyles['input-small']} nodrag`}
            step={config.step}
            min={config.min}
        />
    ),
    text: ({ currentValue, onChange, classNames }) => (
        <input
            type="text"
            value={String(currentValue ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className={classNames?.input ?? `${formStyles['input-small']} nodrag`}
        />
    ),
};

/**
 * config.typeに応じた動的なパラメータ入力フィールド生成コンポーネント。
 * 親要素のProcessNodeParamInputsから呼び出される。
 */
function ParamField({ config, value, onChange, classNames }: ParamFieldProps) {
    const currentValue = value ?? config.defaultValue;
    const fieldLabel = config.label || config.name;

    const renderField = (content: React.ReactNode) => {
        // classNamesを指定することで、動的にスタイルを適用可能にする
        if (classNames) {
            return (
                <div className={classNames.field}>
                    <label className={classNames.label}>{fieldLabel}</label>
                    {content}
                </div>
            );
        }
        return <ParamRow label={fieldLabel}>{content}</ParamRow>;
    };

    const render = PARAM_FIELD_RENDERERS[config.type];

    return <>{renderField(render({ config, currentValue, onChange, classNames }))}</>;
}

/**
 * 処理ノードのパラメータ入力群コンポーネント。
 * 指定されたfunctionNameに基づき、対応する一連のパラメータ入力フィールドを生成する。
 */
export function ProcessNodeParamInputs({ functionName, params, onParamChange, classNames }: Props) {
    if (!functionName) return null;
    const config = VISIONFY_FUNCTIONS_CONFIG[functionName];
    if (!config) return null;

    return (
        <>
            {config.params.map((param) => (
                <ParamField
                    key={param.name}
                    config={param}
                    value={(params as unknown as Record<string, OpencvParamValue>)[param.name]}
                    onChange={(value) => onParamChange(param.name, value)}
                    classNames={classNames}
                />
            ))}
        </>
    );
}
