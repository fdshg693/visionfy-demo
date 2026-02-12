'use client';

import { useChatThreads } from '@/hooks/useChatThreads';
import { HelpCircle, Image as ImageIcon, Lightbulb, Terminal } from 'lucide-react';
import styles from './ChatPlaceholder.module.css';

export function ChatPlaceholder() {
    const { addMessage } = useChatThreads();

    const suggestions = [
        {
            icon: <Terminal size={18} />,
            text: "ワークフローの作成を手伝って",
            prompt: "画像処理のワークフローを作成したいです。手伝ってください。"
        },
        {
            icon: <ImageIcon size={18} />,
            text: "画像処理のアイデアを提案して",
            prompt: "この画像に対してどのような処理を行うと効果的か、アイデアを提案してください。"
        },
        {
            icon: <HelpCircle size={18} />,
            text: "各ノードの使い方を教えて",
            prompt: "利用可能なノードとその使い方について詳しく教えてください。"
        },
        {
            icon: <Lightbulb size={18} />,
            text: "全体をリセットして",
            prompt: "キャンバスをリセットして、最初からやり直したいです。"
        }
    ];

    const handleClick = (prompt: string) => {
        addMessage({
            role: 'user',
            content: prompt
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                <div className={styles.logoIcon}>VisionFy</div>
            </div>
            <h3 className={styles.title}>VisionFyへようこそ</h3>
            <p className={styles.description}>
                AIアシスタントが画像処理ワークフローの構築をお手伝いします。<br />
                質問を入力するか、以下の例から選んでください。
            </p>

            <div className={styles.grid}>
                {suggestions.map((item, index) => (
                    <button
                        key={index}
                        className={styles.card}
                        onClick={() => handleClick(item.prompt)}
                    >
                        <div className={styles.cardIcon}>{item.icon}</div>
                        <span className={styles.cardText}>{item.text}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
