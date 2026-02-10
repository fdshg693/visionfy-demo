// 役割: Tuple型パラメータの入力フィールドコンポーネント
import type { OpencvParamDefinition, OpencvParamValue } from '@/types/processFunction';
import formStyles from '@/lib/styles/forms.module.css';

type TupleParamFieldProps = {
    config: OpencvParamDefinition;
    currentValue: OpencvParamValue | undefined;
    onChange: (value: OpencvParamValue) => void;
    classNames?: {
        tupleInput?: string;
        smallInput?: string;
    };
};

export function TupleParamField({ config, currentValue, onChange, classNames }: TupleParamFieldProps) {
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
}
