
// 役割: Startノード用の入力UI。画像アップロードと実行ボタンを提供する。
// 依存: FilePondで画像プレビュー/アップロード制御。
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import 'filepond/dist/filepond.min.css';
import { FilePond, registerPlugin } from 'react-filepond';
import type { WorkflowFile } from '@/workflow/type';
import styles from '../NodeInspector.module.css';
import { useInspector } from '@/contexts/InspectorContext';

registerPlugin(FilePondPluginImagePreview);

/**
 * ワークフローの開始ノード用インスペクターコンポーネント。
 * ファイルアップロードとワークフロー実行ボタンを提供する。
 */
export function StartNodeInspector() {
    const { files, setFiles, executeWorkflow } = useInspector();
    return (
        <div className={styles.inspectorContent}>
            <div className={styles.field}>
                <label className={styles.label}>Input Image</label>
                <div className={styles.uploadArea}>
                    <FilePond
                        files={files as any}
                        onupdatefiles={(nextFiles) => setFiles(nextFiles as unknown as WorkflowFile[])}
                        allowMultiple={false}
                        maxFiles={1}
                        name="files"
                        labelIdle='Drag & Drop your image or <span class="filepond--label-action">Browse</span>'
                        credits={false}
                    />
                </div>
            </div>

            <div className={styles.field}>
                <button
                    className={styles.runBtn}
                    onClick={executeWorkflow}
                    disabled={files.length === 0}
                >
                    Run Workflow
                </button>
            </div>
        </div>
    );
}
