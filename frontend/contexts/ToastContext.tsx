'use client';

/**
 * トーストコンテキスト
 * 役割: アプリケーション全体でトースト通知を管理
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, errorToToast, type Toast } from '@/components/ui/Toast';
import type { AppError } from '@/lib/errors';

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showError: (error: AppError) => void;
  showSuccess: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const newToast: Toast = {
      ...toast,
      id: `toast-${Date.now()}-${Math.random()}`,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const showError = useCallback((error: AppError) => {
    const toast = errorToToast(error);
    setToasts((prev) => [...prev, toast]);

    // 技術的な詳細をコンソールに出力
    if (error.technicalDetails) {
      console.error(`[${error.category}] ${error.message}`, error.technicalDetails);
    } else {
      console.error(`[${error.category}] ${error.message}`);
    }
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    showToast({
      type: 'success',
      title,
      message,
      duration: 4000,
    });
  }, [showToast]);

  const showWarning = useCallback((title: string, message: string) => {
    showToast({
      type: 'warning',
      title,
      message,
      duration: 5000,
    });
  }, [showToast]);

  const showInfo = useCallback((title: string, message: string) => {
    showToast({
      type: 'info',
      title,
      message,
      duration: 4000,
    });
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showError,
        showSuccess,
        showWarning,
        showInfo,
        removeToast,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
