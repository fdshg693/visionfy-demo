// 役割: ワークフロー実行結果の常時表示UI。Before/Afterと実行パイプライン履歴をタブで切替表示する。
// 依存: useExecutionHistoryで履歴抽出、useObjectURLでblob URL管理。
// 備考: InspectorPanelに常時表示され、ENDノードのクリックには依存しない。
import { TabGroup, TabPanel } from '@/components/ui/TabGroup';
import { useInspector } from '@/contexts/InspectorContext';
import { useExecutionHistory } from '@/hooks/useExecutionHistory';
import { useObjectURL } from '@/hooks/useObjectURL';
import { useFlowStore } from '@/workflow/flowStore';
import { useState } from 'react';
import styles from '../NodeInspector.module.css';
import { ExecutionHistoryTab } from './tabs/ExecutionHistoryTab';
import { ResultComparisonTab } from './tabs/ResultComparisonTab';

/**
 * ワークフロー実行結果の常時表示コンポーネント。
 * Before/Afterと実行パイプライン履歴をタブで切替表示する。
 * - resultタブ：元画像と結果画像の比較表示
 * - historyタブ：元画像から最終画像までの変化を縦に並べて表示
 *
 * InspectorPanelに常時マウントされ、ENDノードのクリックには依存しない。
 */
export function ResultInspector() {
    const { resultImage, previewImage, previewTitle, files } = useInspector();
    const { nodes } = useFlowStore();
    const [activeTab, setActiveTab] = useState<'result' | 'history'>('result');
    const originalImage = useObjectURL(files.length > 0 ? files[0].file : null);
    const executionHistory = useExecutionHistory(nodes);

    // 表示すべき画像（プレビューがあればそれ、なければ最終結果）
    // page.tsx側でロジック制御しているので previewImage を優先使用
    const displayImage = previewImage ?? (previewTitle === '実行結果' ? resultImage : null);

    return (
        <div className={styles.inspectorContent}>
            {/* Tab Headers */}
            <TabGroup
                tabs={[
                    { value: 'result', label: previewTitle || '結果' },
                    { value: 'history', label: '履歴' }
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
                size="lg"
                fullWidth
            />

            {/* Result Tab */}
            <TabPanel value="result" activeTab={activeTab}>
                <ResultComparisonTab
                    originalImage={originalImage}
                    resultImage={displayImage}
                />
            </TabPanel>

            {/* History Tab - Pipeline View */}
            <TabPanel value="history" activeTab={activeTab}>
                <ExecutionHistoryTab
                    originalImage={originalImage}
                    executionHistory={executionHistory}
                />
            </TabPanel>
        </div>
    );
}
