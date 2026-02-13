// 役割: 要素をドラッグ移動させるための汎用フック。
// 依存: なし（React hooks のみ）。
'use client';

import { useCallback, useRef, useState, type RefObject } from 'react';

type Position = { x: number; y: number };

type UseDragOptions = {
    /** ドラッグ対象の要素 ref */
    containerRef: RefObject<HTMLElement | null>;
    /** 初期位置（省略時は { x: 0, y: 0 }） */
    initialPosition?: Position;
};

type UseDragReturn = {
    position: Position;
    isDragging: boolean;
    handleMouseDown: (e: React.MouseEvent) => void;
};

/**
 * ドラッグ移動を管理する汎用フック。
 * handleMouseDown をドラッグハンドル要素の onMouseDown に渡して使用する。
 */
export function useDrag({
    containerRef,
    initialPosition = { x: 0, y: 0 },
}: UseDragOptions): UseDragReturn {
    const [position, setPosition] = useState<Position>(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef<Position>({ x: 0, y: 0 });

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
            dragStart.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            };

            const handleMouseMove = (moveEvent: MouseEvent) => {
                const newX = moveEvent.clientX - dragStart.current.x;
                const newY = moveEvent.clientY - dragStart.current.y;
                setPosition({ x: newX, y: newY });
            };

            const handleMouseUp = () => {
                setIsDragging(false);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        },
        [position.x, position.y]
    );

    return { position, isDragging, handleMouseDown };
}
