// 役割: Boolean型パラメータの入力フィールドコンポーネント
import type { OpencvParamValue } from '@/types/processFunction';
import { FormField } from '@/components/ui/FormField';
import formStyles from '@/lib/styles/forms.module.css';

type BooleanParamFieldProps = {
    currentValue: OpencvParamValue | undefined;
    onChange: (value: OpencvParamValue) => void;
    classNames?: {
        checkbox?: string;
    };
};

export function BooleanParamField({ currentValue, onChange, classNames }: BooleanParamFieldProps) {
    return (
        <FormField
            type="checkbox"
            checked={Boolean(currentValue)}
            onChange={(e) => onChange(e.target.checked)}
            inputClassName={classNames?.checkbox ?? `${formStyles['input-checkbox']} nodrag`}
        />
    );
}
