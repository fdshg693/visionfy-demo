// 役割: Inspector関連のUI状態を管理するContext。Props Drillingを解消する。
// 依存: WorkflowFileやNodeの型定義。
'use client';

import type { WorkflowFile } from '@/types/workflow';
import { createContext, useContext, type ReactNode } from 'react';

type InspectorContextValue = {
  files: WorkflowFile[];
  setFiles: (files: WorkflowFile[]) => void;
  resultImage: string | null;
  executeWorkflow: () => void;
};

const InspectorContext = createContext<InspectorContextValue | undefined>(undefined);

type InspectorProviderProps = {
  children: ReactNode;
  value: InspectorContextValue;
};

export function InspectorProvider({ children, value }: InspectorProviderProps) {
  return (
    <InspectorContext.Provider value={value}>
      {children}
    </InspectorContext.Provider>
  );
}

export function useInspector(): InspectorContextValue {
  const context = useContext(InspectorContext);
  if (context === undefined) {
    throw new Error('useInspector must be used within InspectorProvider');
  }
  return context;
}
