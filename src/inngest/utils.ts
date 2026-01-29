import {
  type ConnectionModel as Connection,
  type NodeModel as Node,
} from "@/generated/prisma/models";
import toposort from "toposort";
import { inngest } from "./client";
import { createId } from "@paralleldrive/cuid2";

// 定义一个简化的节点类型，用于拓扑排序
export type SortableNode = {
  id: string;
  name: string;
  type: import("@/generated/prisma/enums").NodeType;
  position: any;
  data: any;
  workflowId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  credentialId: string | null;
};

// 定义一个简化的连接类型，用于拓扑排序
export type SortableConnection = {
  id: string;
  workflowId: string;
  fromNodeId: string;
  toNodeId: string;
  fromOutput: string | null;
  toInput: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export const topologicalSort = (
  nodes: SortableNode[],
  connections: SortableConnection[],
  // 占位符
): SortableNode[] => {
  // 如果没有connections, 就只返回nodes（因为它们都是独立的）
  if (connections.length === 0) {
    return nodes;
  }

  // Create edges array for toposort
  const edges: [string, string][] = connections.map((connection) => [
    connection.fromNodeId,
    connection.toNodeId,
  ]);

  // Add nodes with no connections as self-edges to ensure they're included
  const connectedNodeIds = new Set<string>();
  for (const connection of connections) {
    connectedNodeIds.add(connection.fromNodeId);
    connectedNodeIds.add(connection.toNodeId);
  }

  for (const node of nodes) {
    if (!connectedNodeIds.has(node.id)) {
      edges.push([node.id, node.id]);
    }
  }

  // Perform topological sort
  let sortedNodeIds: string[];
  try {
    sortedNodeIds = toposort(edges);
    // Remove duplicates (from self-edges)
    sortedNodeIds = [...new Set(sortedNodeIds)];
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cyclic")) {
      throw new Error("Workflow contains a cycle, we cannot actually do this");
    }
    throw error;
  }

  // Map sorted IDs back to node objects
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return sortedNodeIds.map((id) => nodeMap.get(id)!).filter(Boolean);
};

export const sendWorkflowExecution = async (data: {
  workflowId: string;
  [key: string]: any;
}) => {
  return inngest.send({
    name: "workflow/execute.workflow",
    data,
    id: createId(),
  });
};
