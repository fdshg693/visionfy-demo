'use client';

import { Button } from '@/components/ui/Button';
import { useCallback, useState } from 'react';
import styles from './UsageGuidePanel.module.css';

const guideItems = [
    { icon: '📤', text: 'スタートノードに画像をアップロード' },
    { icon: '⚙️', text: '処理ノード（CLAHE、ガウシアンブラー、グレースケールなど）を追加して連結' },
    { icon: '🔗', text: 'ノード間をエッジで接続してパイプラインを構築' },
    { icon: '▶️', text: 'キャンバス右上の「▶ Run」ボタンでワークフロー実行' },
    { icon: '🗑️', text: '右クリックでノード / エッジの削除が可能' },
    { icon: '🖼️', text: '終了ノードで結果画像を確認可能' },
    { icon: '💾', text: 'スナップショット機能でワークフローの保存 / 復元が可能' },
    { icon: '🤖', text: 'AIチャットでアシスタントと会話可能' },
];

/**
 * 使い方ガイドパネル
 * キャンバス右下に表示される折りたたみ可能なヘルプパネル。
 */
export function UsageGuidePanel() {
    const [isOpen, setIsOpen] = useState(false);

    const toggle = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    return (
        <>
            {isOpen && (
                <div className={styles.panel}>
                    <div className={styles.header}>
                        <h3 className={styles.title}>使い方</h3>
                        <Button
                            variant="icon"
                            size="sm"
                            onClick={toggle}
                            aria-label="閉じる"
                        >
                            ✕
                        </Button>
                    </div>
                    <div className={styles.body}>
                        <ul className={styles.list}>
                            {guideItems.map((item, i) => (
                                <li key={i} className={styles.item}>
                                    <span className={styles.icon}>{item.icon}</span>
                                    <span className={styles.text}>{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <Button
                variant={isOpen ? 'primary' : 'secondary'}
                size="lg"
                onClick={toggle}
                aria-label="使い方ガイドを表示"
                title="使い方"
                className={styles.toggleButton}
            >
                ❓ 使い方
            </Button>
        </>
    );
}
