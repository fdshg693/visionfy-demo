// 役割: Select型パラメータの入力フィールドコンポーネント
import type { OpencvParamDefinition, OpencvParamValue } from '@/types/opencv';
import { FormField } from '@/components/ui/FormField';
import formStyles from '@/lib/styles/forms.module.css';

type SelectParamFieldProps = {
    config: OpencvParamDefinition;
    currentValue: OpencvParamValue | undefined;
    onChange: (value: OpencvParamValue) => void;
    classNames?: {
        select?: string;
    };
};

export function SelectParamField({ config, currentValue, onChange, classNames }: SelectParamFieldProps) {
    const options = config.options?.map((opt) => (
        <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
        </option>
    ));

    return (
        <FormField
            type="select"
            value={String(currentValue ?? '')}
            onChange={(e) => {
                const selected = config.options?.find(
                    (option) => String(option.value) === e.target.value
                );
                onChange((selected?.value ?? e.target.value) as OpencvParamValue);
            }}
            inputClassName={classNames?.select ?? `${formStyles['input-select']} ${formStyles.small} nodrag`}
        >
            {options}
        </FormField>
    );
}
