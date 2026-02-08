/**
 * オブジェクトURLのライフサイクルを管理するカスタムフック
 * 役割: Fileからblob URLを生成し、不要時に自動revoke
 */
import { useEffect, useState } from 'react';

export function useObjectURL(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}
