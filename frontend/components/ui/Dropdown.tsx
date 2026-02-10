'use client';

import { useState, type ReactNode } from 'react';
import { useOutsideClickDropdown } from '@/hooks/useOutsideClickDropdown';
import styles from './Dropdown.module.css';

export type DropdownPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

export type DropdownProps = {
    /**
     * Trigger element (usually a button)
     * Gets passed isOpen state and toggle function
     */
    trigger: (isOpen: boolean, toggle: () => void) => ReactNode;

    /**
     * Dropdown content to display when open
     */
    children: ReactNode;

    /**
     * Whether to show an overlay behind the dropdown
     * When true, clicking overlay will close the dropdown
     * @default false
     */
    overlay?: boolean;

    /**
     * Position of the dropdown relative to trigger
     * @default 'bottom-left'
     */
    position?: DropdownPosition;

    /**
     * Additional CSS class for the dropdown content
     */
    className?: string;

    /**
     * Additional CSS class for the container
     */
    containerClassName?: string;

    /**
     * Z-index for the dropdown
     * @default 50
     */
    zIndex?: number;

    /**
     * Whether the dropdown is controlled externally
     * When provided, component becomes controlled
     */
    isOpen?: boolean;

    /**
     * Callback when dropdown open state changes (for controlled mode)
     */
    onOpenChange?: (isOpen: boolean) => void;

    /**
     * Whether to close dropdown on click inside content
     * @default false
     */
    closeOnClickInside?: boolean;
};

/**
 * Reusable dropdown component with outside-click detection
 *
 * @example
 * ```tsx
 * <Dropdown
 *   trigger={(isOpen, toggle) => (
 *     <button onClick={toggle}>Menu</button>
 *   )}
 *   overlay
 * >
 *   <div>Dropdown content</div>
 * </Dropdown>
 * ```
 */
export function Dropdown({
    trigger,
    children,
    overlay = false,
    position = 'bottom-left',
    className,
    containerClassName,
    zIndex = 50,
    isOpen: controlledIsOpen,
    onOpenChange,
    closeOnClickInside = false,
}: DropdownProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);

    // Use controlled state if provided, otherwise use internal state
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const setIsOpen = (value: boolean) => {
        if (controlledIsOpen === undefined) {
            setInternalIsOpen(value);
        }
        onOpenChange?.(value);
    };

    const toggle = () => setIsOpen(!isOpen);

    // Use the extracted hook for outside-click and escape key detection
    const containerRef = useOutsideClickDropdown({
        isOpen,
        onClose: () => setIsOpen(false),
        enableEscapeKey: true,
    });

    const handleContentClick = () => {
        if (closeOnClickInside) {
            setIsOpen(false);
        }
    };

    const handleOverlayClick = () => {
        setIsOpen(false);
    };

    const positionClass = styles[`position-${position}`] || styles['position-bottom-left'];

    return (
        <div
            className={`${styles.container} ${containerClassName || ''}`}
            ref={containerRef}
        >
            {trigger(isOpen, toggle)}

            {isOpen && (
                <>
                    {overlay && (
                        <div
                            className={styles.overlay}
                            onClick={handleOverlayClick}
                            style={{ zIndex: zIndex - 1 }}
                        />
                    )}
                    <div
                        className={`${styles.dropdown} ${positionClass} ${className || ''}`}
                        onClick={handleContentClick}
                        style={{ zIndex }}
                    >
                        {children}
                    </div>
                </>
            )}
        </div>
    );
}
