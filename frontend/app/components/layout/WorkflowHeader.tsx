'use client';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button, MenuButton } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { CATEGORY_INFO, CATEGORY_ORDER, PROCESS_FUNCTIONS_BASE } from '@/types/processFunctionBase';
import type { ProcessNodeFunctionName } from '@/types/processNode';
import type { FlowHistoryEntry } from '@/types/workflowPersistence';
import {
    FileCode,
    History,
    Play,
    Plus,
    RotateCcw,
    Save,
    Upload
} from 'lucide-react';
import { SnapshotDropdown } from '../workflow/SnapshotDropdown';
import { UsageGuidePanel } from '../workflow/UsageGuidePanel';
import styles from './WorkflowHeader.module.css';

type WorkflowHeaderProps = {
    onAddNode: (functionName: ProcessNodeFunctionName) => void;
    onResetCanvas: () => void;
    onSaveSnapshot: () => void;
    onRunWorkflow: () => void;
    onImportClick: () => void;
    onGenerateCodeClick: () => void;
    onHistoryClick: () => void;
    showHistoryDropdown: boolean;
    setShowHistoryDropdown: (show: boolean) => void;
    historyEntries: FlowHistoryEntry[];
    onRestoreSnapshot: (entry: FlowHistoryEntry) => void;
    onRenameSnapshot: (entryId: string, name: string) => void;
    onDeleteSnapshot: (entryId: string) => void;
    canRun: boolean;
    hasNodes: boolean;
};

export function WorkflowHeader({
    onAddNode,
    onResetCanvas,
    onSaveSnapshot,
    onRunWorkflow,
    onImportClick,
    onGenerateCodeClick,
    onHistoryClick,
    showHistoryDropdown,
    setShowHistoryDropdown,
    historyEntries,
    onRestoreSnapshot,
    onRenameSnapshot,
    onDeleteSnapshot,
    canRun,
    hasNodes,
}: WorkflowHeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.leftSection}>
                <div className={styles.branding}>
                    <span className={styles.logoIcon}>⚡</span>
                    <span className={styles.logoText}>VisionFy</span>
                </div>

                <div className={styles.separator} />

                <Dropdown
                    trigger={(isOpen, toggle) => (
                        <Button
                            variant="primary"
                            size="sm"
                            iconVariant="default"
                            onClick={toggle}
                            className={styles.addNodeBtn}
                        >
                            <Plus size={16} />
                            ノード追加
                        </Button>
                    )}
                    overlay
                    className={styles.addNodeWrapper}
                    zIndex={100}
                    closeOnClickInside
                >
                    {CATEGORY_ORDER.map((category) => {
                        const catInfo = CATEGORY_INFO[category];
                        const functions = Object.entries(PROCESS_FUNCTIONS_BASE)
                            .filter(([, def]) => def.category === category);
                        if (functions.length === 0) return null;
                        return (
                            <div key={category}>
                                <div className={styles.categoryHeader}>
                                    <span>{catInfo.icon}</span>
                                    <span>{category}</span>
                                </div>
                                {functions.map(([name, def]) => (
                                    <AddNodeMenuItem
                                        key={name}
                                        name={name as ProcessNodeFunctionName}
                                        def={def}
                                        onAddNode={onAddNode}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </Dropdown>
            </div>

            <div className={styles.rightSection}>
                <div className={styles.actionGroup}>
                    <Button variant="icon" title="リセット" onClick={onResetCanvas}>
                        <RotateCcw size={18} />
                    </Button>

                    <Button variant="icon" title="インポート" onClick={onImportClick}>
                        <Upload size={18} />
                    </Button>

                    <Button variant="icon" title="コード生成" onClick={onGenerateCodeClick} disabled={!hasNodes}>
                        <FileCode size={18} />
                    </Button>

                    <div className={styles.historyWrapper}>
                        <Button variant="icon" title="履歴" onClick={onHistoryClick}>
                            <History size={18} />
                        </Button>
                        <SnapshotDropdown
                            isOpen={showHistoryDropdown}
                            onClose={() => setShowHistoryDropdown(false)}
                            historyEntries={historyEntries}
                            onRestoreSnapshot={onRestoreSnapshot}
                            onRenameSnapshot={onRenameSnapshot}
                            onDeleteSnapshot={onDeleteSnapshot}
                        />
                    </div>
                </div>

                <div className={styles.separator} />

                <div className={styles.primaryActions}>
                    <Button variant="secondary" size="md" onClick={onSaveSnapshot}>
                        <Save size={16} />
                        保存
                    </Button>

                    <Button variant="blue" size="md" onClick={onRunWorkflow} disabled={!canRun}>
                        <Play size={16} fill="currentColor" />
                        実行
                    </Button>
                </div>

                <div className={styles.separator} />

                <UsageGuidePanel />
            </div>
        </header>
    );
}

/** Add Nodeメニューアイテム — ホバーで吹き出し説明表示（Portal使用） */
function AddNodeMenuItem({
    name,
    def,
    onAddNode,
}: {
    name: ProcessNodeFunctionName;
    def: { displayName: string; description: string };
    onAddNode: (fn: ProcessNodeFunctionName) => void;
}) {
    const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null);
    const itemRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (!itemRef.current) return;
        const rect = itemRef.current.getBoundingClientRect();
        setTooltipPos({
            left: rect.right + 8,
            top: rect.top + rect.height / 2,
        });
    };

    const handleMouseLeave = () => {
        setTooltipPos(null);
    };

    return (
        <div
            ref={itemRef}
            className={styles.addNodeItem}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <MenuButton
                withIcon
                onClick={() => onAddNode(name)}
            >
                <span className={styles.addNodeOptionName}>{def.displayName}</span>
            </MenuButton>
            {tooltipPos && createPortal(
                <div
                    className={styles.addNodeTooltip}
                    style={{
                        left: tooltipPos.left,
                        top: tooltipPos.top,
                        transform: 'translateY(-50%)',
                    }}
                >
                    <div className={styles.addNodeTooltipArrow} />
                    <div className={styles.addNodeTooltipContent}>
                        {def.description}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
