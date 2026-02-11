/**
 * Tabs Component
 *
 * A reusable tabs component for switching between different views or content.
 * Uses tab-list pattern with keyboard navigation support.
 *
 * Usage example:
 * <Tabs
 *   value={activeTab}
 *   onChange={setActiveTab}
 *   tabs={[
 *     { value: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
 *     { value: 'tab2', label: 'Tab 2', content: <div>Content 2</div> }
 *   ]}
 * />
 */

import type { ReactNode } from 'react';
import styles from './Tabs.module.css';

export type Tab = {
  /** Unique value for this tab */
  value: string;
  /** Display label for the tab button */
  label: string;
  /** Content to display when this tab is active */
  content?: ReactNode;
  /** Whether this tab is disabled */
  disabled?: boolean;
};

type TabsProps = {
  /** Currently active tab value */
  value: string;
  /** Callback when tab changes */
  onChange: (value: string) => void;
  /** Array of tab definitions */
  tabs: Tab[];
  /** Additional CSS class for the container */
  className?: string;
  /** Additional CSS class for tab buttons */
  tabClassName?: string;
  /** Additional CSS class for content area */
  contentClassName?: string;
  /** Theme variant */
  theme?: 'light' | 'dark';
};

/**
 * Tabs component for switching between different views
 */
export function Tabs({
  value,
  onChange,
  tabs,
  className,
  tabClassName,
  contentClassName,
  theme = 'light',
}: TabsProps) {
  const activeTab = tabs.find((tab) => tab.value === value);

  return (
    <div className={`${styles.tabs} ${theme === 'dark' ? styles.dark : ''} ${className || ''}`}>
      <div className={styles.tabList} role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.value}`}
              id={`tab-${tab.value}`}
              className={`${styles.tabButton} ${isActive ? styles.active : ''} ${tab.disabled ? styles.disabled : ''} ${tabClassName || ''}`}
              onClick={() => !tab.disabled && onChange(tab.value)}
              disabled={tab.disabled}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeTab?.content && (
        <div
          className={`${styles.tabContent} ${contentClassName || ''}`}
          role="tabpanel"
          id={`tabpanel-${activeTab.value}`}
          aria-labelledby={`tab-${activeTab.value}`}
        >
          {activeTab.content}
        </div>
      )}
    </div>
  );
}
