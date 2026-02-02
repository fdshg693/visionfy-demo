import { ChartNoAxesColumn, CheckCircle, Image as ImageIcon, Paintbrush, Palette, Play, Settings } from 'lucide-react';
import type { FC } from 'react';

export type ProcessNodeIcon = FC<{ size?: number; className?: string }>;

export const PROCESS_NODE_ICON_MAP: Record<string, ProcessNodeIcon> = {
    'histogram': ChartNoAxesColumn,
    'settings': Settings,
    'image': ImageIcon,
    'check': CheckCircle,
    'play': Play,
    'brush': Paintbrush,
    'palette': Palette,
};

export const getProcessNodeIcon = (icon?: string) => (icon ? PROCESS_NODE_ICON_MAP[icon] : null);
