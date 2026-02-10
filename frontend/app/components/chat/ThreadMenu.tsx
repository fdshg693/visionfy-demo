'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, Plus, Trash2, MessageSquare } from 'lucide-react';
import styles from './ThreadMenu.module.css';
import buttonStyles from '@/lib/styles/buttons.module.css';
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
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // 外側クリックで閉じる
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleNewThread = useCallback(() => {
        onNewThread();
        setIsOpen(false);
    }, [onNewThread]);

    const handleSelect = useCallback((threadId: string) => {
        onSelectThread(threadId);
        setIsOpen(false);
    }, [onSelectThread]);

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
        <div className={styles.menuContainer} ref={menuRef}>
            <button
                type="button"
                className={buttonStyles['btn-icon-sm']}
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label="スレッドメニュー"
                title="スレッドメニュー"
            >
                <Menu size={16} />
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <button
                        type="button"
                        className={`${buttonStyles['btn-menu']} ${styles.newThreadBtn}`}
                        onClick={handleNewThread}
                    >
                        <Plus size={14} />
                        <span>新しいスレッド</span>
                    </button>

                    {threads.length > 0 && (
                        <div className={styles.threadList}>
                            <div className={styles.threadListLabel}>履歴</div>
                            {threads.map((thread) => (
                                <div
                                    key={thread.id}
                                    className={`${styles.threadItem} ${thread.id === activeThreadId ? styles.threadItemActive : ''
                                        }`}
                                    onClick={() => handleSelect(thread.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSelect(thread.id);
                                    }}
                                >
                                    <MessageSquare size={12} className={styles.threadIcon} />
                                    <div className={styles.threadInfo}>
                                        <span className={styles.threadTitle}>{thread.title}</span>
                                        <span className={styles.threadDate}>
                                            {formatDate(thread.updatedAt)}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className={`${buttonStyles['btn-icon-sm']} ${buttonStyles['btn-icon-ghost']} ${styles.threadDeleteBtn}`}
                                        onClick={(e) => handleDelete(e, thread.id)}
                                        aria-label={`${thread.title}を削除`}
                                        title="削除"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {threads.length === 0 && (
                        <p className={styles.emptyMessage}>スレッド履歴はありません</p>
                    )}
                </div>
            )}
        </div>
    );
}
