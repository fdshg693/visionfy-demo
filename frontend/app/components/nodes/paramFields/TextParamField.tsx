// 役割: Text型パラメータの入力フィールドコンポーネント
import type { OpencvParamValue } from '@/types/processFunction';
import { FormField } from '@/components/ui/FormField';
import formStyles from '@/lib/styles/forms.module.css';

type TextParamFieldProps = {
    currentValue: OpencvParamValue | undefined;
    onChange: (value: OpencvParamValue) => void;
    classNames?: {
        input?: string;
    };
};

export function TextParamField({ currentValue, onChange, classNames }: TextParamFieldProps) {
    return (
        <FormField
            value={String(currentValue ?? '')}
            onChange={(e) => onChange(e.target.value)}
            inputClassName={classNames?.input ?? `${formStyles['input-small']} nodrag`}
        />
    );
}
