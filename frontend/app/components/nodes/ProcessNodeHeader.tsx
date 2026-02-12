// 役割: ProcessNodeのヘッダー部分（アイコン + タイトル）を表示する
// 依存: lucide-reactアイコン、ProcessNode.module.css
import { ChartNoAxesColumn, CheckCircle, Image as ImageIcon, Paintbrush, Palette, Play, ScanSearch, Settings } from 'lucide-react';
import type { FC } from 'react';
import styles from './ProcessNode.module.css';

type ProcessNodeIcon = FC<{ size?: number; className?: string }>;

const PROCESS_NODE_ICON_MAP: Record<string, ProcessNodeIcon> = {
    'histogram': ChartNoAxesColumn,
    'settings': Settings,
    'image': ImageIcon,
    'check': CheckCircle,
    'play': Play,
    'brush': Paintbrush,
    'palette': Palette,
    'scan': ScanSearch,
};

type ProcessNodeHeaderProps = {
    icon?: string;
    label: string;
    status?: string;
};

export function ProcessNodeHeader({ icon, label, status = 'idle' }: ProcessNodeHeaderProps) {
    const IconComponent = icon ? PROCESS_NODE_ICON_MAP[icon] : null;

    return (
        <div className={styles.header}>
            <div className={styles.headerTitle}>
                {IconComponent && (
                    <IconComponent size={14} className={styles.icon} />
                )}
                <span className={styles.title}>{label || 'Process'}</span>
            </div>
            {status !== 'idle' && (
                <div className={`${styles.statusIndicator} ${styles[`status-${status}`]}`}>
                    {status === 'running' && <span className={styles.spinner} />}
                    {status === 'completed' && <CheckCircle size={12} />}
                    {status === 'failed' && <div className={styles.errorDot} />}
                </div>
            )}
        </div>
    );
}
