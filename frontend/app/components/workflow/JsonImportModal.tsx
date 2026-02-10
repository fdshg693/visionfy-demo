'use client';

import { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { isValidSnapshot, normalizeSnapshot } from '@/workflow/flowPersistence';
import type { FlowSnapshot } from '@/workflow/flowSerializer';
import { isSimpleWorkflow } from '@/types/simpleWorkflow';
import { convertSimpleWorkflowToSnapshot } from '@/workflow/simpleWorkflowConverter';
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

  const handleImport = useCallback(() => {
    try {
      // Step 1: Parse JSON
      const parsed = JSON.parse(jsonInput);

      let snapshot: FlowSnapshot;

      // Step 2: Check if it's a simple workflow format
      if (isSimpleWorkflow(parsed)) {
        // Convert simple format to full FlowSnapshot
        snapshot = convertSimpleWorkflowToSnapshot(parsed);
      } else if (isValidSnapshot(parsed)) {
        // Use existing FlowSnapshot format
        snapshot = normalizeSnapshot(parsed);
      } else {
        setValidationError(
          '無効なワークフロー構造です。以下のいずれかの形式が必要です:\n' +
          '簡易形式: { "processNodes": [{ "functionName": "...", "params": {...} }] }\n' +
          '完全形式: { "nodes": [...], "edges": [...], "viewport": {...} }'
        );
        return;
      }

      // Step 3: Clear error and pass to parent
      setValidationError(null);
      onImport(snapshot);

      // Step 4: Reset form and close modal
      setJsonInput('');
      onClose();
    } catch (error) {
      if (error instanceof SyntaxError) {
        setValidationError('無効なJSON形式です。構文を確認してください。');
      } else {
        setValidationError('ワークフローのインポートに失敗しました。JSON構造を確認してください。');
      }
    }
  }, [jsonInput, onImport, onClose]);

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
