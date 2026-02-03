type StorageService = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const canUseStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * ローカルストレージを使用した永続化サービス
 * シンプルな、同期的なキー・バリュー型ストレージインターフェースを提供
 */
export const storageService: StorageService = {
  getItem: (key) => {
    if (!canUseStorage()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    if (!canUseStorage()) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage is unavailable (quota, privacy mode, etc.)
    }
  },
  removeItem: (key) => {
    if (!canUseStorage()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // noop
    }
  },
};
