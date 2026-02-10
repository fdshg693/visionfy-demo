// 役割: 処理ノードのパラメータ入力UIを関数定義に沿って表示する。
// 依存: VISIONFY_FUNCTIONS_CONFIGの定義に合わせて入力を生成する。
import type { OpencvParamDefinition, OpencvParamValue } from '@/types/opencv';
import { VISIONFY_FUNCTIONS_CONFIG } from '@/types/opencv';
import type { ProcessNodeFunctionName, ProcessNodeParams } from '@/types/node';
import { FormField } from '@/components/ui/FormField';
import { SelectParamField } from './paramFields/SelectParamField';
import { TupleParamField } from './paramFields/TupleParamField';
import { BooleanParamField } from './paramFields/BooleanParamField';
import { NumberParamField } from './paramFields/NumberParamField';
import { TextParamField } from './paramFields/TextParamField';
import styles from './ProcessNode.module.css';

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

type ParamFieldProps = {
    config: OpencvParamDefinition;
    value: OpencvParamValue | undefined;
    onChange: (value: OpencvParamValue) => void;
    classNames?: Props['classNames'];
};

/**
 * 各パラメータタイプに応じた入力フィールドコンポーネントのマッピング。
 */
function renderParamField(
    type: OpencvParamDefinition['type'],
    config: OpencvParamDefinition,
    currentValue: OpencvParamValue | undefined,
    onChange: (value: OpencvParamValue) => void,
    classNames?: Props['classNames']
): React.ReactNode {
    switch (type) {
        case 'select':
            return (
                <SelectParamField
                    config={config}
                    currentValue={currentValue}
                    onChange={onChange}
                    classNames={{ select: classNames?.select }}
                />
            );
        case 'tuple':
            return (
                <TupleParamField
                    config={config}
                    currentValue={currentValue}
                    onChange={onChange}
                    classNames={{
                        tupleInput: classNames?.tupleInput,
                        smallInput: classNames?.smallInput,
                    }}
                />
            );
        case 'boolean':
            return (
                <BooleanParamField
                    currentValue={currentValue}
                    onChange={onChange}
                    classNames={{ checkbox: classNames?.input }}
                />
            );
        case 'number':
            return (
                <NumberParamField
                    config={config}
                    currentValue={currentValue}
                    onChange={onChange}
                    classNames={{ input: classNames?.input }}
                />
            );
        case 'text':
            return (
                <TextParamField
                    currentValue={currentValue}
                    onChange={onChange}
                    classNames={{ input: classNames?.input }}
                />
            );
        default:
            return null;
    }
}

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
                <FormField
                    type="custom"
                    label={fieldLabel}
                    className={classNames.field}
                    labelClassName={classNames.label}
                >
                    {content}
                </FormField>
            );
        }
        // Default: use ParamRow styling for canvas nodes
        return (
            <div className={styles.paramRow}>
                <label>{fieldLabel}</label>
                {content}
            </div>
        );
    };

    const field = renderParamField(config.type, config, currentValue, onChange, classNames);

    return <>{renderField(field)}</>;
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
