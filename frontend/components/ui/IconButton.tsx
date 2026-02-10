'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import buttonStyles from '@/lib/styles/buttons.module.css';

/**
 * Icon button sizes
 */
export type IconButtonSize = 'sm' | 'md' | 'lg';

/**
 * Icon button variants
 */
export type IconButtonVariant = 'default' | 'primary' | 'danger' | 'ghost';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button size
   * @default 'md'
   */
  size?: IconButtonSize;

  /**
   * Icon button variant style
   * @default 'default'
   */
  variant?: IconButtonVariant;

  /**
   * Button children (icon element)
   */
  children?: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show loading state with spinner
   */
  isLoading?: boolean;
}

/**
 * IconButton Component
 *
 * A compact icon-only button component for toolbar actions and utility buttons.
 * Provides consistent styling across the application for icon-based interactions.
 *
 * Features:
 * - Three sizes: sm (28x28), md (36x36), lg (44x44)
 * - Four variants: default (gray), primary (dark), danger (red), ghost (transparent)
 * - Built-in hover/active states
 * - Accessibility support with aria-label requirement
 *
 * @example
 * ```tsx
 * // Small settings button
 * <IconButton size="sm" aria-label="設定">
 *   <Settings size={14} />
 * </IconButton>
 *
 * // Primary send button
 * <IconButton size="md" variant="primary" aria-label="送信">
 *   <Send size={16} />
 * </IconButton>
 *
 * // Danger delete button
 * <IconButton size="sm" variant="danger" aria-label="削除">
 *   <Trash2 size={14} />
 * </IconButton>
 *
 * // Ghost close button
 * <IconButton size="sm" variant="ghost" aria-label="閉じる">
 *   <X size={14} />
 * </IconButton>
 * ```
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      size = 'md',
      variant = 'default',
      children,
      className = '',
      isLoading = false,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    /**
     * Build the CSS class name based on size and variant
     */
    const getButtonClasses = (): string => {
      const classes: string[] = [];

      // Size class
      switch (size) {
        case 'sm':
          classes.push(buttonStyles['btn-icon-sm']);
          break;
        case 'lg':
          classes.push(buttonStyles['btn-icon-lg']);
          break;
        case 'md':
        default:
          classes.push(buttonStyles['btn-icon-md']);
          break;
      }

      // Variant class
      switch (variant) {
        case 'primary':
          classes.push(buttonStyles['btn-icon-primary']);
          break;
        case 'danger':
          classes.push(buttonStyles['btn-icon-danger']);
          break;
        case 'ghost':
          classes.push(buttonStyles['btn-icon-ghost']);
          break;
        case 'default':
        default:
          // No additional class needed for default variant
          break;
      }

      // Loading state
      if (isLoading) {
        classes.push(buttonStyles['btn-loading']);
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

IconButton.displayName = 'IconButton';
