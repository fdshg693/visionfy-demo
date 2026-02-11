'use client';

import { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { RadioGroup } from '@/components/ui/RadioGroup';
import type { FlowHistoryEntry } from '@/types/workflowPersistence';
import type { ExportFormat } from '@/lib/exportWorkflow';
import { exportMultipleHistories } from '@/lib/exportWorkflow';
import styles from './ExportModal.module.css';

type ExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedEntries: FlowHistoryEntry[];
};

/**
 * エクスポートモーダルコンポーネント
 *
 * 選択した履歴をJSON形式でエクスポートする際の形式選択UIを提供
 * - 簡易形式: { processNodes: [...] } - 最小限の情報のみ
 * - 完全形式: { nodes, edges, viewport } - React Flowの完全な状態
 */
export function ExportModal({ isOpen, onClose, selectedEntries }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('simple');

  const handleExport = useCallback(() => {
    exportMultipleHistories(selectedEntries, format);
    onClose();
  }, [selectedEntries, format, onClose]);

  const count = selectedEntries.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="履歴をエクスポート"
      width="450px"
    >
      <div className={styles.content}>
        <p className={styles.description}>
          選択した履歴を JSON 形式でエクスポートします（{count}件）
        </p>

        <div className={styles.formatSection}>
          <h4 className={styles.sectionTitle}>エクスポート形式</h4>
          <RadioGroup
            name="exportFormat"
            value={format}
            onChange={(value) => setFormat(value as ExportFormat)}
            options={[
              {
                value: 'simple',
                label: '簡易形式（推奨）',
                description: 'パラメータのみ保存。JSONインポート機能で使用可能。',
              },
              {
                value: 'full',
                label: '完全形式',
                description: 'ノード位置、エッジ、ビューポートを含む完全な状態。',
              },
            ]}
          />
        </div>

        <div className={styles.example}>
          <h5 className={styles.exampleTitle}>形式例</h5>
          {format === 'simple' ? (
            <pre className={styles.exampleCode}>
{`{
  "processNodes": [
    {
      "functionName": "createclahe",
      "params": { "clipLimit": 40 }
    }
  ]
}`}
            </pre>
          ) : (
            <pre className={styles.exampleCode}>
{`{
  "nodes": [...],
  "edges": [...],
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}`}
            </pre>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onClose}>
          キャンセル
        </Button>
        <Button variant="blue" onClick={handleExport}>
          エクスポート（{count}件）
        </Button>
      </div>
    </Modal>
  );
}
