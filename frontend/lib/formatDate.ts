/**
 *  ワークフローのスナップショットを保存・表示する際に自動生成される名前に使われる日付のフォーマット関数
 */
export const formatSnapshotDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
