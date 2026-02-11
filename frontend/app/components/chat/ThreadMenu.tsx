'use client';

import { useCallback } from 'react';
import { Menu, Plus, Trash2, MessageSquare } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { IconButton, MenuButton } from '@/components/ui/Button';
import styles from './ThreadMenu.module.css';
import type { ChatThread } from '@/lib/chatStorageService';

type ThreadMenuProps = {
    threads: ChatThread[];
    activeThreadId: string | null;
    onNewThread: () => void;
    onSelectThread: (threadId: string) => void;
    onDeleteThread: (threadId: string) => void;
};

/**
 * スレッド管理メニューコンポーネント
 * ハンバーガーアイコンをクリックしてスレッドの切り替え・削除・新規作成を行う
 */
export function ThreadMenu({
    threads,
    activeThreadId,
    onNewThread,
    onSelectThread,
    onDeleteThread,
}: ThreadMenuProps) {
    const handleDelete = useCallback((e: React.MouseEvent, threadId: string) => {
        e.stopPropagation();
        onDeleteThread(threadId);
    }, [onDeleteThread]);

    // Format date for display
    const formatDate = (timestamp: number) => {
        const d = new Date(timestamp);
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${month}/${day} ${hours}:${minutes}`;
    };

    return (
        <Dropdown
            trigger={(isOpen, toggle) => (
                <IconButton
                    size="sm"
                    onClick={toggle}
                    aria-label="スレッドメニュー"
                    title="スレッドメニュー"
                >
                    <Menu size={16} />
                </IconButton>
            )}
            className={styles.dropdown}
            position="bottom-left"
        >
            <MenuButton
                className={styles.newThreadBtn}
                onClick={onNewThread}
            >
                <Plus size={14} />
                <span>新しいスレッド</span>
            </MenuButton>

            {threads.length > 0 && (
                <div className={styles.threadList}>
                    <div className={styles.threadListLabel}>履歴</div>
                    {threads.map((thread) => (
                        <div
                            key={thread.id}
                            className={`${styles.threadItem} ${thread.id === activeThreadId ? styles.threadItemActive : ''
                                }`}
                            onClick={() => onSelectThread(thread.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onSelectThread(thread.id);
                            }}
                        >
                            <MessageSquare size={12} className={styles.threadIcon} />
                            <div className={styles.threadInfo}>
                                <span className={styles.threadTitle}>{thread.title}</span>
                                <span className={styles.threadDate}>
                                    {formatDate(thread.updatedAt)}
                                </span>
                            </div>
                            <IconButton
                                size="sm"
                                iconVariant="ghost"
                                className={styles.threadDeleteBtn}
                                onClick={(e) => handleDelete(e, thread.id)}
                                aria-label={`${thread.title}を削除`}
                                title="削除"
                            >
                                <Trash2 size={12} />
                            </IconButton>
                        </div>
                    ))}
                </div>
            )}

            {threads.length === 0 && (
                <p className={styles.emptyMessage}>スレッド履歴はありません</p>
            )}
        </Dropdown>
    );
}
