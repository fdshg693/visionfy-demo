'use client';

import { Button, MenuButton } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { VISIONFY_FUNCTIONS_CONFIG } from '@/types/processFunction';
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
                    containerClassName={styles.addNodeWrapper}
                    zIndex={100}
                    closeOnClickInside
                >
                    {Object.entries(VISIONFY_FUNCTIONS_CONFIG).map(([name, config]) => (
                        <MenuButton
                            key={name}
                            withIcon
                            onClick={() => onAddNode(name as ProcessNodeFunctionName)}
                        >
                            <span className={styles.addNodeOptionName}>{name}</span>
                            <span className={styles.addNodeOptionDesc}>{config.description}</span>
                        </MenuButton>
                    ))}
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
