import { ExecutionStatus } from '@/app/types/node';
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import styles from './ExecutionResultItem.module.css';

interface ExecutionResultItemProps {
    functionName: string;
    status: ExecutionStatus;
    resultImage?: string;
    params?: Record<string, unknown>;
}

export function ExecutionResultItem({
    functionName,
    status,
    resultImage,
    params
}: ExecutionResultItemProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (status === 'idle') return null;

    return (
        <div className={styles.container}>
            <button
                className={styles.header}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={styles.left}>
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className={styles.functionName}>{functionName}</span>
                </div>
                <div className={styles.right}>
                    {status === 'success' && <CheckCircle size={16} className={styles.successIcon} />}
                    {status === 'error' && <AlertCircle size={16} className={styles.errorIcon} />}
                    {status === 'running' && <div className={styles.spinner} />}
                </div>
            </button>

            {isOpen && (
                <div className={styles.content}>
                    {status === 'success' && resultImage && (
                        <div className={styles.imageContainer}>
                            <img src={resultImage} alt="Result" className={styles.resultImage} />
                        </div>
                    )}

                    {params && (
                        <div className={styles.paramsContainer}>
                            <div className={styles.paramsTitle}>Used Parameters</div>
                            <pre className={styles.paramsCode}>
                                {JSON.stringify(params, null, 2)}
                            </pre>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className={styles.errorContent}>
                            Execution failed.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
