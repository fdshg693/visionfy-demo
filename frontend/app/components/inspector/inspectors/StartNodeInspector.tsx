
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import 'filepond/dist/filepond.min.css';
import { FilePond, registerPlugin } from 'react-filepond';
import styles from '../NodeInspector.module.css';

registerPlugin(FilePondPluginImagePreview);

interface StartNodeInspectorProps {
    files: any[];
    setFiles: (files: any[]) => void;
    onRun: () => void;
}

export function StartNodeInspector({ files, setFiles, onRun }: StartNodeInspectorProps) {
    return (
        <div className={styles.inspectorContent}>
            <div className={styles.field}>
                <label className={styles.label}>Input Image</label>
                <div className={styles.uploadArea}>
                    <FilePond
                        files={files}
                        onupdatefiles={setFiles}
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
                    onClick={onRun}
                    disabled={files.length === 0}
                >
                    Run Workflow
                </button>
            </div>
        </div>
    );
}
