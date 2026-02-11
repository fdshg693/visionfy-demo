'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Node, Edge, Viewport } from '@xyflow/react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { convertSnapshotToSimpleWorkflow } from '@/lib/workflow';
import styles from './GenerateCodeModal.module.css';

type GenerateCodeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
};

/**
 * コード生成モーダル
 *
 * 現在のワークフローからPythonコードを生成して表示する。
 * コピー・ダウンロード機能付き。
 */
export function GenerateCodeModal({
  isOpen,
  onClose,
  nodes,
  edges,
  viewport,
}: GenerateCodeModalProps) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess } = useToast();

  const fetchCode = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCode(null);

    try {
      const simpleWorkflow = convertSnapshotToSimpleWorkflow({ nodes, edges, viewport });

      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simpleWorkflow),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `エラー: ${response.status}`);
      }

      const data = await response.json();
      setCode(data.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'コード生成に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [nodes, edges, viewport]);

  useEffect(() => {
    if (isOpen) {
      fetchCode();
    } else {
      setCode(null);
      setError(null);
    }
  }, [isOpen, fetchCode]);

  const handleCopy = useCallback(async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      showSuccess('コピー完了', 'Pythonコードをクリップボードにコピーしました');
    } catch {
      setError('クリップボードへのコピーに失敗しました');
    }
  }, [code, showSuccess]);

  const handleDownload = useCallback(() => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow_${new Date().toISOString().slice(0, 10)}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [code]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Python コード生成"
      width="600px"
    >
      <div className={styles.content}>
        <p className={styles.description}>
          現在のワークフローから実行可能な Python スクリプトを生成します。
        </p>

        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            コード生成中...
          </div>
        )}

        {error && (
          <div className={styles.errorContainer}>
            {error}
          </div>
        )}

        {code && (
          <div className={styles.codeContainer}>
            <pre className={styles.codeBlock}>{code}</pre>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onClose}>
          閉じる
        </Button>
        {code && (
          <>
            <Button variant="secondary" onClick={handleCopy}>
              コピー
            </Button>
            <Button variant="blue" onClick={handleDownload}>
              ダウンロード (.py)
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
