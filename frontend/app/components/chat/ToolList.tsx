'use client';
import { Info } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/Button';
import styles from '@/app/page.module.css';
import { TOOL_REGISTRY } from '@/lib/tools';

export function ToolList() {
    return (
        <Dropdown
            trigger={(isOpen, toggle) => (
                <IconButton
                    size="sm"
                    className={styles.toolListBtn}
                    onClick={toggle}
                    aria-label="AIツール一覧"
                    title="AIツール一覧"
                >
                    <Info size={14} />
                </IconButton>
            )}
            className={styles.toolListDropdown}
            containerClassName={styles.toolListContainer}
            position="bottom-left"
        >
            <div className={styles.toolListTitle}>AIが使えるツール</div>
            {TOOL_REGISTRY.map((tool) => (
                <div key={tool.name} className={styles.toolListItem}>
                    <span className={styles.toolListName}>{tool.name}</span>
                    <span className={styles.toolListDesc}>{tool.description}</span>
                </div>
            ))}
        </Dropdown>
    );
}
