import type { Edge, Node } from "@xyflow/react";

export type PersistedNode = Pick<Node, "id" | "type" | "position" | "data">;
export type PersistedEdge = Pick<
  Edge,
  "source" | "target" | "sourceHandle" | "targetHandle"
>;

const normalizeNodes = (nodes: Node[]): PersistedNode[] => {
  return nodes
    .map((node) => ({
      id: node.id,
      type: node.type ?? undefined,
      position: node.position,
      data: node.data ?? {},
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
};

const normalizeEdges = (edges: Edge[]): PersistedEdge[] => {
  return edges
    .map((edge) => ({
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? null,
      targetHandle: edge.targetHandle ?? null,
    }))
    .sort((a, b) => {
      const aKey = `${a.source}:${a.target}:${a.sourceHandle ?? ""}:${
        a.targetHandle ?? ""
      }`;
      const bKey = `${b.source}:${b.target}:${b.sourceHandle ?? ""}:${
        b.targetHandle ?? ""
      }`;
      return aKey.localeCompare(bKey);
    });
};

export const serializeWorkflowSnapshot = (nodes: Node[], edges: Edge[]) => {
  return JSON.stringify({
    nodes: normalizeNodes(nodes),
    edges: normalizeEdges(edges),
  });
};

export const toPersistedWorkflow = (nodes: Node[], edges: Edge[]) => {
  return {
    nodes: normalizeNodes(nodes),
    edges: normalizeEdges(edges),
  };
};
