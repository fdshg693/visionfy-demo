'use client';
import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import styles from '@/app/page.module.css';
import { TOOL_REGISTRY } from '@/lib/tools';

export function ToolList() {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    return (
        <div className={styles.toolListContainer} ref={ref}>
            <button
                type="button"
                className={styles.toolListBtn}
                onClick={() => setIsOpen(v => !v)}
                aria-label="AIツール一覧"
                title="AIツール一覧"
            >
                <Info size={14} />
            </button>
            {isOpen && (
                <div className={styles.toolListDropdown}>
                    <div className={styles.toolListTitle}>AIが使えるツール</div>
                    {TOOL_REGISTRY.map((tool) => (
                        <div key={tool.name} className={styles.toolListItem}>
                            <span className={styles.toolListName}>{tool.name}</span>
                            <span className={styles.toolListDesc}>{tool.description}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
