// 役割: 入力画像のアップロード・プレビューを提供する常時表示パネル。
// 依存: FilePondで画像プレビュー/アップロード制御。InspectorContextからfiles/setFilesを取得。
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import 'filepond/dist/filepond.min.css';
import { FilePond, registerPlugin } from 'react-filepond';
import type { WorkflowFile } from '@/types/workflow';
import { useInspector } from '@/contexts/InspectorContext';

import styles from '@/app/page.module.css';

registerPlugin(FilePondPluginImagePreview);

/**
 * 入力画像パネルコンポーネント。
 * サイドバー上部に常時表示され、画像のアップロードとプレビューを提供する。
 */
export function InputImagePanel() {
    const { files, setFiles } = useInspector();

    return (
        <div className={styles.inputImagePanel}>
            <h3 className={styles.inputImageTitle}>入力画像</h3>
            <div className={styles.inputImageUpload}>
                <FilePond
                    files={files as any}
                    onupdatefiles={(nextFiles) => setFiles(nextFiles as unknown as WorkflowFile[])}
                    allowMultiple={false}
                    maxFiles={1}
                    name="files"
                    labelIdle='<span class="filepond--label-action">参照</span>'
                    credits={false}
                />
            </div>
        </div>
    );
}
