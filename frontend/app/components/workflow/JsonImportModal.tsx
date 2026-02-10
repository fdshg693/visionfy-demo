'use client';

import { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { useWorkflowImport, WorkflowImportError } from '@/hooks/useWorkflowImport';
import type { FlowSnapshot } from '@/types/workflowPersistence';
import styles from './JsonImportModal.module.css';

type JsonImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (snapshot: FlowSnapshot) => void;
};

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
    onClose();
  }, [onClose]);

  const isImportDisabled = jsonInput.trim() === '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="JSONをインポート"
      width="500px"
      maxHeight="70vh"
    >
      <div className={styles.hint}>
        ワークフローのJSONを貼り付けてください
        <br />
        <small>簡易形式（推奨）または完全形式（nodes, edges, viewport）</small>
      </div>
      <FormField
        type="textarea"
        value={jsonInput}
        onChange={(e) => {
          setJsonInput(e.target.value);
          setValidationError(null); // Clear error on input change
        }}
        placeholder='{"processNodes": [{"functionName": "createclahe", "params": {"clipLimit": 40}}]}'
        rows={10}
        inputClassName={styles.jsonTextarea}
        error={validationError || undefined}
        aria-label="ワークフローJSON"
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
