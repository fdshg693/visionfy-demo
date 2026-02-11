import { useEffect, useRef } from 'react';

export type UseOutsideClickDropdownOptions = {
    /**
     * Whether the dropdown/modal is currently open
     */
    isOpen: boolean;

    /**
     * Callback to close the dropdown/modal
     */
    onClose: () => void;

    /**
     * Whether to listen for Escape key to close
     * @default true
     */
    enableEscapeKey?: boolean;
};

/**
 * Reusable hook for outside-click and escape key detection
 *
 * Extracted from Dropdown component to be used in various UI components
 * that need outside-click dismissal behavior (dropdowns, modals, popovers, etc.)
 *
 * @example
 * ```tsx
 * function MyDropdown() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const containerRef = useOutsideClickDropdown({
 *     isOpen,
 *     onClose: () => setIsOpen(false),
 *   });
 *
 *   return (
 *     <div ref={containerRef}>
 *       <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
 *       {isOpen && <div>Dropdown content</div>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns A ref to attach to the container element
 */
export function useOutsideClickDropdown<T extends HTMLElement = HTMLDivElement>({
    isOpen,
    onClose,
    enableEscapeKey = true,
}: UseOutsideClickDropdownOptions) {
    const containerRef = useRef<T>(null);

    // Outside click detection
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        // Use mousedown instead of click to catch the event before other handlers
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen || !enableEscapeKey) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose, enableEscapeKey]);

    return containerRef;
}
