'use client';

/**
 * Error Boundary
 * 役割: React コンポーネントツリー内の予期しないエラーをキャッチ
 */
import { Component, type ReactNode } from 'react';
import { categorizeError, type AppError } from '@/lib/errors';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, reset: () => void) => ReactNode;
  onError?: (error: AppError) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const appError = categorizeError(error);
    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    const appError = categorizeError(error);

    // コンソールに詳細を出力
    console.error('[ErrorBoundary] Caught error:', appError);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // カスタムエラーハンドラを呼び出し
    if (this.props.onError) {
      this.props.onError(appError);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // カスタムフォールバックがある場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      // デフォルトのエラーUI
      return <DefaultErrorFallback error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

/**
 * デフォルトのエラーフォールバックUI
 */
function DefaultErrorFallback({
  error,
  reset,
}: {
  error: AppError;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <h1 className="text-xl font-bold text-gray-900">
            エラーが発生しました
          </h1>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-2">{error.userMessage}</p>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              技術的な詳細
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-sm font-mono text-gray-800 break-words">
              <p className="mb-1">
                <strong>エラー種別:</strong> {error.category}
              </p>
              <p className="mb-1">
                <strong>メッセージ:</strong> {error.message}
              </p>
              {error.statusCode && (
                <p className="mb-1">
                  <strong>ステータスコード:</strong> {error.statusCode}
                </p>
              )}
              {error.technicalDetails && (
                <p className="mt-2 text-xs whitespace-pre-wrap">
                  {error.technicalDetails}
                </p>
              )}
            </div>
          </details>
        </div>

        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={reset}
            className="flex-1"
          >
            再試行
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/'}
            className="flex-1"
          >
            ホームに戻る
          </Button>
        </div>
      </div>
    </div>
  );
}
