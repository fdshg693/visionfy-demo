'use client';
import { Wrench } from 'lucide-react';
import styles from '@/app/page.module.css';

/** ツール名の日本語対応マップ */
const TOOL_DISPLAY_NAMES: Record<string, string> = {
    get_workflow_context: 'ワークフロー状態を取得',
    get_available_nodes: '利用可能ノード一覧を取得',
};

interface ToolCallIndicatorProps {
    toolName: string;
}

export function ToolCallIndicator({ toolName }: ToolCallIndicatorProps) {
    const displayName = TOOL_DISPLAY_NAMES[toolName] || toolName;
    return (
        <span className={styles.toolCallIndicator}>
            <Wrench size={12} />
            <span>{displayName}</span>
        </span>
    );
}
