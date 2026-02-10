// 役割: Number型パラメータの入力フィールドコンポーネント
import type { OpencvParamDefinition, OpencvParamValue } from '@/types/processFunction';
import { FormField } from '@/components/ui/FormField';
import formStyles from '@/lib/styles/forms.module.css';

type NumberParamFieldProps = {
    config: OpencvParamDefinition;
    currentValue: OpencvParamValue | undefined;
    onChange: (value: OpencvParamValue) => void;
    classNames?: {
        input?: string;
    };
};

export function NumberParamField({ config, currentValue, onChange, classNames }: NumberParamFieldProps) {
    return (
        <FormField
            type="number"
            value={Number(currentValue ?? 0)}
            onChange={(e) => onChange(Number(e.target.value))}
            inputClassName={classNames?.input ?? `${formStyles['input-small']} nodrag`}
            step={config.step}
            min={config.min}
        />
    );
}
