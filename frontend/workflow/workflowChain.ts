/**
 * ワークフローチェイン構築サービス
 * 役割: ノードグラフのエッジを辿り、実行順序のチェインを組み立てる
 * 依存: @xyflow/reactのNode/Edge型、NODE_TYPE定数
 */
import type { Node, Edge } from '@xyflow/react';
import { NODE_TYPE } from '@/constants/index';

/**
 * Startノードからエッジを辿り、接続順序のノード配列を返す。
 * Startノードが存在しない場合は空配列を返す。
 * 無限ループ防止のためvisitedセットを持ち、既訪問ノードで辿る停止する。
 */
export function buildNodeChain(nodes: Node[], edges: Edge[]): Node[] {
  const startNode = nodes.find((n) => n.type === NODE_TYPE.START);
  if (!startNode) return [];

  const chain: Node[] = [startNode];
  const visited = new Set<string>([startNode.id]);
  let currentId: string | null = startNode.id;

  while (currentId) {
    const edge = edges.find((e) => e.source === currentId);
    if (!edge) break;
    const next = nodes.find((n) => n.id === edge.target);
    if (!next || visited.has(next.id)) break;
    chain.push(next);
    visited.add(next.id);
    currentId = next.id;
  }

  return chain;
}
