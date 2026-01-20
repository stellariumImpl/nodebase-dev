import { NodeType } from "@/generated/prisma/enums";
import { NodeTypes } from "@xyflow/react";
import { InitialNode } from "@/components/initial-node";

export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;
