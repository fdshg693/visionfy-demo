'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import buttonStyles from '@/lib/styles/buttons.module.css';

/**
 * Button variants matching the design system in buttons.module.css
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'blue'
  | 'icon'
  | 'tab'
  | 'menu';

/**
 * Button sizes
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Icon button specific variants
 */
export type IconButtonVariant = 'default' | 'primary' | 'danger' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant style
   */
  variant?: ButtonVariant;

  /**
   * Button size
   */
  size?: ButtonSize;

  /**
   * For icon buttons: specific icon variant
   */
  iconVariant?: IconButtonVariant;

  /**
   * For tab buttons: whether this tab is active
   */
  isActive?: boolean;

  /**
   * Show loading state with spinner
   */
  isLoading?: boolean;

  /**
   * Full width button
   */
  fullWidth?: boolean;

  /**
   * Button children (text, icons, etc.)
   */
  children?: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Unified Button Component
 *
 * A comprehensive button component that supports all design system variants:
 * - Primary: Main actions, save buttons, submit buttons
 * - Secondary: Cancel actions, alternative options, toolbar buttons
 * - Danger: Delete actions, destructive operations
 * - Blue: High-visibility primary actions (e.g., Run workflow)
 * - Icon: Icon-only buttons for compact actions
 * - Tab: Tab-style navigation buttons
 * - Menu: Dropdown/menu item buttons
 *
 * @example
 * ```tsx
 * // Primary button
 * <Button variant="primary" size="md">保存する</Button>
 *
 * // Icon button with danger variant
 * <Button variant="icon" iconVariant="danger" size="sm">
 *   <Trash2 size={14} />
 * </Button>
 *
 * // Active tab button
 * <Button variant="tab" isActive={true}>履歴</Button>
 *
 * // Loading state
 * <Button variant="primary" isLoading disabled>処理中...</Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      iconVariant = 'default',
      isActive = false,
      isLoading = false,
      fullWidth = false,
      children,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    /**
     * Build the CSS class name based on variant, size, and modifiers
     */
    const getButtonClasses = (): string => {
      const classes: string[] = [];

      // Base variant selection
      switch (variant) {
        case 'primary':
          if (size === 'sm') {
            classes.push(buttonStyles['btn-primary-sm']);
          } else if (size === 'lg') {
            classes.push(buttonStyles['btn-primary-lg']);
          } else {
            classes.push(buttonStyles['btn-primary']);
          }
          break;

        case 'secondary':
          if (size === 'sm') {
            classes.push(buttonStyles['btn-secondary-sm']);
          } else if (size === 'lg') {
            classes.push(buttonStyles['btn-secondary-lg']);
          } else {
            classes.push(buttonStyles['btn-secondary']);
          }
          break;

        case 'danger':
          if (size === 'sm') {
            classes.push(buttonStyles['btn-danger-sm']);
          } else if (size === 'lg') {
            classes.push(buttonStyles['btn-danger-lg']);
          } else {
            classes.push(buttonStyles['btn-danger']);
          }
          break;

        case 'blue':
          if (size === 'sm') {
            classes.push(buttonStyles['btn-blue-sm']);
          } else if (size === 'md') {
            classes.push(buttonStyles['btn-blue-md']);
          } else {
            classes.push(buttonStyles['btn-blue']);
          }
          break;

        case 'icon':
          // Icon button with size
          if (size === 'sm') {
            classes.push(buttonStyles['btn-icon-sm']);
          } else if (size === 'lg') {
            classes.push(buttonStyles['btn-icon-lg']);
          } else {
            classes.push(buttonStyles['btn-icon-md']);
          }

          // Icon button variant
          if (iconVariant === 'primary') {
            classes.push(buttonStyles['btn-icon-primary']);
          } else if (iconVariant === 'danger') {
            classes.push(buttonStyles['btn-icon-danger']);
          } else if (iconVariant === 'ghost') {
            classes.push(buttonStyles['btn-icon-ghost']);
          }
          break;

        case 'tab':
          if (size === 'sm') {
            classes.push(isActive ? buttonStyles['btn-tab-sm-active'] : buttonStyles['btn-tab-sm']);
          } else {
            classes.push(isActive ? buttonStyles['btn-tab-active'] : buttonStyles['btn-tab']);
          }
          break;

        case 'menu':
          classes.push(buttonStyles['btn-menu']);
          break;
      }

      // Loading state
      if (isLoading) {
        classes.push(buttonStyles['btn-loading']);
      }

      // Full width
      if (fullWidth) {
        classes.push(buttonStyles['btn-full']);
      }

      // Custom classes
      if (className) {
        classes.push(className);
      }

      return classes.join(' ');
    };

    return (
      <button
        ref={ref}
        type={type}
        className={getButtonClasses()}
        disabled={disabled || isLoading}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * IconButton - Convenience component for icon buttons
 *
 * @example
 * ```tsx
 * <IconButton size="sm" iconVariant="danger" aria-label="削除">
 *   <Trash2 size={14} />
 * </IconButton>
 * ```
 */
export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => {
    return <Button ref={ref} variant="icon" {...props} />;
  }
);

IconButton.displayName = 'IconButton';

/**
 * MenuButton - Convenience component for menu item buttons
 *
 * @example
 * ```tsx
 * <MenuButton onClick={handleAction}>
 *   <Settings size={16} />
 *   <span>設定</span>
 * </MenuButton>
 * ```
 */
export interface MenuButtonProps extends Omit<ButtonProps, 'variant'> {
  /**
   * Whether this is a danger/destructive menu item
   */
  danger?: boolean;

  /**
   * Whether this menu item has an icon and description (two-line layout)
   */
  withIcon?: boolean;
}

export const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ danger = false, withIcon = false, className = '', ...props }, ref) => {
    const menuClassName = withIcon
      ? buttonStyles['btn-menu-with-icon']
      : danger
        ? buttonStyles['btn-menu-danger']
        : '';

    return (
      <Button
        ref={ref}
        variant="menu"
        className={`${menuClassName} ${className}`.trim()}
        {...props}
      />
    );
  }
);

MenuButton.displayName = 'MenuButton';

/**
 * TabButton - Convenience component for tab navigation buttons
 *
 * @example
 * ```tsx
 * <TabButton isActive={activeTab === 'history'} onClick={() => setActiveTab('history')}>
 *   履歴
 * </TabButton>
 * ```
 */
export const TabButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => {
    return <Button ref={ref} variant="tab" {...props} />;
  }
);

TabButton.displayName = 'TabButton';
