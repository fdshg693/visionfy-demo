/**
 * ズームレベルに応じた LOD（Level of Detail）を返すフック
 * 役割: ReactFlow の viewport.zoom を監視し、compact / expanded を切り替える
 * 依存: @xyflow/react の useViewport
 */
import { useViewport } from '@xyflow/react';

const ZOOM_THRESHOLD = 0.8;

export type NodeLOD = 'compact' | 'expanded';

export function useZoomLevel(): { zoom: number; lod: NodeLOD } {
    const { zoom } = useViewport();
    const lod: NodeLOD = zoom < ZOOM_THRESHOLD ? 'compact' : 'expanded';
    return { zoom, lod };
}
