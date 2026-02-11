'use client';

import { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { useWorkflowImport, WorkflowImportError } from '@/hooks/useWorkflowImport';
import type { FlowSnapshot } from '@/types/workflowPersistence';
import styles from './JsonImportModal.module.css';

type JsonImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (snapshot: FlowSnapshot) => void;
};

type ImportFormat = 'simple' | 'full';

/**
 * JSONインポートモーダル
 *
 * ユーザーがワークフローのJSONを貼り付けて復元できるようにするコンポーネント
 * - JSON構文の検証
 * - 2つの形式をサポート:
 *   1. 簡易形式: { processNodes: [{ functionName, params? }] }
 *   2. 完全形式: { nodes, edges, viewport }
 * - 簡易形式は自動的に完全形式に変換される
 * - 後方互換性のための正規化
 */
export function JsonImportModal({ isOpen, onClose, onImport }: JsonImportModalProps) {
  const [importFormat, setImportFormat] = useState<ImportFormat>('simple');
  const [jsonInput, setJsonInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { importWorkflow } = useWorkflowImport();

  const handleImport = useCallback(() => {
    try {
      const snapshot = importWorkflow(jsonInput);

      // Clear error and pass to parent
      setValidationError(null);
      onImport(snapshot);

      // Reset form and close modal
      setJsonInput('');
      onClose();
    } catch (error) {
      if (error instanceof WorkflowImportError) {
        setValidationError(error.message);
      } else {
        setValidationError('ワークフローのインポートに失敗しました。');
      }
    }
  }, [jsonInput, importWorkflow, onImport, onClose]);

  const handleClose = useCallback(() => {
    setJsonInput('');
    setValidationError(null);
    setImportFormat('simple');
    onClose();
  }, [onClose]);

  const isImportDisabled = jsonInput.trim() === '';

  // Format-specific placeholders and hints
  const formatConfig = {
    simple: {
      placeholder: '{"processNodes": [{"functionName": "createclahe", "params": {"clipLimit": 40}}]}',
      hint: '処理ノードの配列のみを含むシンプルな形式です。開始ノードと終了ノードは自動的に追加されます。',
      example: `例:
{
  "processNodes": [
    {
      "functionName": "createclahe",
      "params": { "clipLimit": 40 }
    },
    {
      "functionName": "gaussian_blur",
      "params": { "ksize": 5, "sigmaX": 1.5 }
    }
  ]
}`,
    },
    full: {
      placeholder: '{"nodes": [...], "edges": [...], "viewport": {...}}',
      hint: 'ノード、エッジ、ビューポートを含む完全なワークフロー保存形式です。スナップショットのエクスポートで使用されます。',
      example: `例:
{
  "nodes": [
    {
      "id": "start-1",
      "type": "startNode",
      "position": { "x": 100, "y": 200 },
      "data": { "label": "開始" }
    },
    {
      "id": "process-1",
      "type": "processNode",
      "position": { "x": 350, "y": 200 },
      "data": {
        "label": "CLAHE",
        "functionName": "createclahe",
        "params": { "clipLimit": 40 }
      }
    }
  ],
  "edges": [...],
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}`,
    },
  };

  const currentConfig = formatConfig[importFormat];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="JSONをインポート"
      width="600px"
      maxHeight="80vh"
    >
      <Tabs
        value={importFormat}
        onChange={(value) => {
          setImportFormat(value as ImportFormat);
          setValidationError(null);
        }}
        tabs={[
          {
            value: 'simple',
            label: '簡易形式',
            content: (
              <div>
                <div className={styles.hint}>{currentConfig.hint}</div>
                <FormField
                  type="textarea"
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder={currentConfig.placeholder}
                  rows={10}
                  inputClassName={styles.jsonTextarea}
                  error={validationError || undefined}
                  aria-label="ワークフローJSON"
                />
                <details className={styles.exampleDetails}>
                  <summary className={styles.exampleSummary}>形式の例を表示</summary>
                  <pre className={styles.exampleCode}>{currentConfig.example}</pre>
                </details>
              </div>
            ),
          },
          {
            value: 'full',
            label: '完全形式',
            content: (
              <div>
                <div className={styles.hint}>{currentConfig.hint}</div>
                <FormField
                  type="textarea"
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder={currentConfig.placeholder}
                  rows={10}
                  inputClassName={styles.jsonTextarea}
                  error={validationError || undefined}
                  aria-label="ワークフローJSON"
                />
                <details className={styles.exampleDetails}>
                  <summary className={styles.exampleSummary}>形式の例を表示</summary>
                  <pre className={styles.exampleCode}>{currentConfig.example}</pre>
                </details>
              </div>
            ),
          },
        ]}
      />
      <div className={styles.footer}>
        <Button variant="secondary" onClick={handleClose}>
          キャンセル
        </Button>
        <Button
          variant="blue"
          onClick={handleImport}
          disabled={isImportDisabled}
        >
          インポート
        </Button>
      </div>
    </Modal>
  );
}
