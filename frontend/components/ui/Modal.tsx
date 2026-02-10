'use client';

import { type ReactNode } from 'react';
import { useOutsideClickDropdown } from '@/hooks/useOutsideClickDropdown';
import { IconButton } from './Button';
import styles from './Modal.module.css';

export type ModalProps = {
    /**
     * Whether the modal is open
     */
    isOpen: boolean;

    /**
     * Callback when the modal should close
     */
    onClose: () => void;

    /**
     * Modal title displayed in the header
     */
    title?: string;

    /**
     * Modal content
     */
    children: ReactNode;

    /**
     * Additional CSS class for the modal content
     */
    className?: string;

    /**
     * Width of the modal
     * @default '380px'
     */
    width?: string | number;

    /**
     * Max height of the modal
     * @default '80vh'
     */
    maxHeight?: string;

    /**
     * Whether to show the close button in the header
     * @default true
     */
    showCloseButton?: boolean;

    /**
     * Whether to close on overlay click
     * @default true
     */
    closeOnOverlayClick?: boolean;

    /**
     * Whether to close on Escape key
     * @default true
     */
    closeOnEscape?: boolean;
};

/**
 * Reusable modal component with overlay and outside-click detection
 *
 * Extracted from ProcessNodePopup to be used across the application
 * for consistent modal behavior and styling.
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Settings"
 * >
 *   <p>Modal content goes here</p>
 * </Modal>
 * ```
 */
export function Modal({
    isOpen,
    onClose,
    title,
    children,
    className,
    width = '380px',
    maxHeight = '80vh',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
}: ModalProps) {
    const containerRef = useOutsideClickDropdown({
        isOpen,
        onClose: closeOnOverlayClick ? onClose : () => { },
        enableEscapeKey: closeOnEscape,
    });

    if (!isOpen) {
        return null;
    }

    const handleOverlayClick = () => {
        if (closeOnOverlayClick) {
            onClose();
        }
    };

    const handleModalClick = (e: React.MouseEvent) => {
        // Prevent clicks inside the modal from closing it
        e.stopPropagation();
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div
                ref={containerRef}
                className={`${styles.modal} ${className || ''}`}
                onClick={handleModalClick}
                style={{
                    width: typeof width === 'number' ? `${width}px` : width,
                    maxHeight,
                }}
            >
                {(title || showCloseButton) && (
                    <div className={styles.modalHeader}>
                        {title && <h3 className={styles.modalTitle}>{title}</h3>}
                        {showCloseButton && (
                            <IconButton
                                size="sm"
                                onClick={onClose}
                                aria-label="閉じる"
                                className={styles.closeButton}
                            >
                                ✕
                            </IconButton>
                        )}
                    </div>
                )}
                <div className={styles.modalBody}>
                    {children}
                </div>
            </div>
        </div>
    );
}
