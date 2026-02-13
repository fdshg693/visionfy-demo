// 役割: ProcessNodeのヘッダー部分（アイコン + タイトル）を表示する
// 依存: lucide-reactアイコン、ProcessNode.module.css
import { ChartNoAxesColumn, CheckCircle, Image as ImageIcon, Paintbrush, Palette, Play, ScanSearch, Settings } from 'lucide-react';
import type { FC } from 'react';
import styles from './ProcessNode.module.css';

type ProcessNodeIcon = FC<{ size?: number; className?: string; style?: React.CSSProperties }>;

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
    /** カテゴリ別ヘッダー背景色 */
    headerBg?: string;
    /** カテゴリ別ヘッダーボーダー色 */
    headerBorder?: string;
    /** カテゴリ別アイコン色 */
    iconColor?: string;
};

export function ProcessNodeHeader({ icon, label, status = 'idle', headerBg, headerBorder, iconColor }: ProcessNodeHeaderProps) {
    const IconComponent = icon ? PROCESS_NODE_ICON_MAP[icon] : null;

    const headerStyle: React.CSSProperties = {
        ...(headerBg ? { background: headerBg } : {}),
        ...(headerBorder ? { borderBottom: `1px solid ${headerBorder}` } : {}),
    };

    return (
        <div className={styles.header} style={headerStyle}>
            <div className={styles.headerTitle}>
                {IconComponent && (
                    <IconComponent size={14} className={styles.icon} style={iconColor ? { color: iconColor } : undefined} />
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

