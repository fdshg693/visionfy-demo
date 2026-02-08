'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './ChatMarkdown.module.css';

type ChatMarkdownProps = {
    content: string;
};

/**
 * マークダウンレンダラーコンポーネント
 * AIアシスタントのメッセージをマークダウンとして表示する
 */
export function ChatMarkdown({ content }: ChatMarkdownProps) {
    return (
        <div className={styles.markdown}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
    );
}
