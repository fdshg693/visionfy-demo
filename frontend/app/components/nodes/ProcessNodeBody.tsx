// 役割: ProcessNodeのボディ部分（パラメータ入力UI）を表示する
// 依存: ProcessNodeParamInputs、ProcessNode.module.css
import { ProcessNodeParamInputs } from './ProcessNodeParamInputs';
import type { ProcessNodeFunctionName, ProcessNodeParams } from '@/types/processNode';
import type { OpencvParamValue } from '@/types/processFunction';
import styles from './ProcessNode.module.css';

type ProcessNodeBodyProps = {
    functionName: ProcessNodeFunctionName;
    params: ProcessNodeParams;
    onParamChange: (key: string, value: OpencvParamValue) => void;
};

export function ProcessNodeBody({ functionName, params, onParamChange }: ProcessNodeBodyProps) {
    return (
        <div className={styles.body}>
            <ProcessNodeParamInputs
                functionName={functionName}
                params={params}
                onParamChange={onParamChange}
            />
        </div>
    );
}
