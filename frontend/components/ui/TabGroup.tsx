'use client';

import { type ReactNode, type MouseEvent } from 'react';
import { TabButton, type ButtonSize } from './Button';
import styles from './TabGroup.module.css';

/**
 * Tab item configuration
 */
export interface Tab<T extends string = string> {
  /**
   * Unique identifier for this tab
   */
  value: T;

  /**
   * Display label for the tab
   */
  label: ReactNode;

  /**
   * Whether this tab is disabled
   */
  disabled?: boolean;

  /**
   * Optional icon to display before the label
   */
  icon?: ReactNode;

  /**
   * Optional aria-label for accessibility
   */
  ariaLabel?: string;
}

export interface TabGroupProps<T extends string = string> {
  /**
   * Array of tab configurations
   */
  tabs: Tab<T>[];

  /**
   * Currently active tab value
   */
  activeTab: T;

  /**
   * Callback when a tab is clicked
   */
  onChange: (value: T) => void;

  /**
   * Size of the tab buttons
   * @default 'md'
   */
  size?: ButtonSize;

  /**
   * Full width tabs (each tab takes equal width)
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Additional CSS class for the container
   */
  className?: string;

  /**
   * Variant style for the tab group
   * - 'default': Standard tab buttons with bottom border
   * - 'pills': Pill-shaped tab buttons
   * @default 'default'
   */
  variant?: 'default' | 'pills';
}

/**
 * TabGroup Component
 *
 * A flexible tab navigation component that wraps multiple TabButton components
 * and provides a consistent API for tab management.
 *
 * @example
 * ```tsx
 * const [activeTab, setActiveTab] = useState<'result' | 'history'>('result');
 *
 * <TabGroup
 *   tabs={[
 *     { value: 'result', label: 'Result' },
 *     { value: 'history', label: 'History' }
 *   ]}
 *   activeTab={activeTab}
 *   onChange={setActiveTab}
 * />
 * ```
 *
 * @example With icons
 * ```tsx
 * <TabGroup
 *   tabs={[
 *     { value: 'grid', label: 'Grid View', icon: <Grid size={16} /> },
 *     { value: 'list', label: 'List View', icon: <List size={16} /> }
 *   ]}
 *   activeTab={viewMode}
 *   onChange={setViewMode}
 *   variant="pills"
 * />
 * ```
 */
export function TabGroup<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
  variant = 'default',
}: TabGroupProps<T>) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>, value: T, disabled?: boolean) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onChange(value);
  };

  const containerClasses = [
    variant === 'pills' ? styles.tabGroupPills : styles.tabGroup,
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab;
        const tabSize = variant === 'pills' ? 'sm' : size;

        return (
          <TabButton
            key={tab.value}
            size={tabSize}
            isActive={isActive}
            disabled={tab.disabled}
            onClick={(e) => handleClick(e, tab.value, tab.disabled)}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.ariaLabel || (typeof tab.label === 'string' ? tab.label : undefined)}
            aria-controls={`tabpanel-${tab.value}`}
            id={`tab-${tab.value}`}
            className={fullWidth ? styles.fullWidthTab : ''}
          >
            {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
            {tab.label}
          </TabButton>
        );
      })}
    </div>
  );
}

/**
 * TabPanel Component
 *
 * A companion component for TabGroup to wrap tab content with proper ARIA attributes.
 *
 * @example
 * ```tsx
 * <TabPanel value="result" activeTab={activeTab}>
 *   <ResultContent />
 * </TabPanel>
 * <TabPanel value="history" activeTab={activeTab}>
 *   <HistoryContent />
 * </TabPanel>
 * ```
 */
export interface TabPanelProps<T extends string = string> {
  /**
   * The value this panel corresponds to
   */
  value: T;

  /**
   * The currently active tab value
   */
  activeTab: T;

  /**
   * Content to display when this panel is active
   */
  children: ReactNode;

  /**
   * Additional CSS class for the panel
   */
  className?: string;
}

export function TabPanel<T extends string = string>({
  value,
  activeTab,
  children,
  className = '',
}: TabPanelProps<T>) {
  const isActive = value === activeTab;

  if (!isActive) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={className}
    >
      {children}
    </div>
  );
}
