// 役割: ProcessNodeのヘッダー部分（アイコン + タイトル）を表示する
// 依存: lucide-reactアイコン、ProcessNode.module.css
import type { FC } from 'react';
import { ChartNoAxesColumn, CheckCircle, Image as ImageIcon, Paintbrush, Palette, Play, ScanSearch, Settings } from 'lucide-react';
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
};

export function ProcessNodeHeader({ icon, label }: ProcessNodeHeaderProps) {
    const IconComponent = icon ? PROCESS_NODE_ICON_MAP[icon] : null;

    return (
        <div className={styles.header}>
            {IconComponent && (
                <IconComponent size={16} className={styles.icon} />
            )}
            <span className={styles.title}>{label || 'Process'}</span>
        </div>
    );
}
