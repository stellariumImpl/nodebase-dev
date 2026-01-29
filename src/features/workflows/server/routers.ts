import {
  protectedProcedure,
  createTRPCRouter,
  premiumProcedure,
} from "@/trpc/init";
import prisma from "@/lib/prisma";
import { generateSlug } from "random-word-slugs";
import z from "zod";
import { PAGINATION } from "@/config/constants";
import { TRPCError } from "@trpc/server";
import { NodeType } from "@/generated/prisma/enums";
import type { Node, Edge } from "@xyflow/react";
import { inngest } from "@/inngest/client";
import { sendWorkflowExecution } from "@/inngest/utils";

export const WorkflowsRouter = createTRPCRouter({
  execute: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });

      await sendWorkflowExecution({
        workflowId: input.id,
      });

      return workflow;
    }),

  create: premiumProcedure.mutation(({ ctx }) => {
    return prisma.workflow.create({
      data: {
        name: generateSlug(3),
        userId: ctx.auth.user.id,
        nodes: {
          create: {
            type: NodeType.INITIAL,
            position: { x: 0, y: 0 },
            name: NodeType.INITIAL,
          },
        },
      },
    });
  }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.delete({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nodes: z.array(
          z.object({
            id: z.string(),
            type: z.string().nullish(),
            position: z.object({ x: z.number(), y: z.number() }),
            data: z.record(z.string(), z.any()).optional(),
          }),
        ),
        edges: z.array(
          z.object({
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().nullish(),
            targetHandle: z.string().nullish(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, nodes, edges } = input;

      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id, userId: ctx.auth.user.id },
      });

      return await prisma.$transaction(async (tx) => {
        // 先删除所有现有连接，避免外键约束
        await tx.connection.deleteMany({
          where: { workflowId: id },
        });

        // 然后删除所有现有节点
        await tx.node.deleteMany({
          where: { workflowId: id },
        });

        // 创建新节点
        await tx.node.createMany({
          data: nodes.map((node) => ({
            id: node.id,
            workflowId: id,
            name: node.type || "unknown",
            type: node.type as NodeType,
            position: node.position,
            data: node.data || {},
          })),
        });

        // 创建新连接（此时节点已经存在）
        await tx.connection.createMany({
          data: edges.map((edge) => ({
            workflowId: id,
            fromNodeId: edge.source,
            toNodeId: edge.target,
            fromOutput: edge.sourceHandle || "main",
            toInput: edge.targetHandle || "main",
          })),
        });

        await tx.workflow.update({
          where: { id },
          data: { updatedAt: new Date() },
        });

        return workflow;
      });
    }),

  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.update({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
        data: {
          name: input.name,
        },
      });
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
        include: {
          nodes: true,
          connections: true,
        },
      });

      const nodes: Node[] = workflow.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position as { x: number; y: number },
        data: (node.data as Record<string, unknown>) || {},
      }));

      const edges: Edge[] = workflow.connections.map((connection) => ({
        id: connection.id,
        source: connection.fromNodeId,
        target: connection.toNodeId,
        sourceHandle: connection.fromOutput,
        targetHandle: connection.toInput,
      }));

      return {
        id: workflow.id,
        name: workflow.name,
        nodes,
        edges,
      };
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;
      const [items, totalCount] = await Promise.all([
        prisma.workflow.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: {
            userId: ctx.auth.user.id,
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),
        prisma.workflow.count({
          where: {
            userId: ctx.auth.user.id,
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        }),
      ]);
      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    }),

  /**
   * AI 对话增强接口
   */

  // 1. 获取工作流关联的消息历史
  getChatMessages: protectedProcedure
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ input, ctx }) => {
      return prisma.chatMessage.findMany({
        where: {
          workflowId: input.workflowId,
          // 安全校验：确保工作流属于当前用户
          workflow: {
            userId: ctx.auth.user.id,
          },
        },
        orderBy: {
          createdAt: "asc", // 按时间升序展示对话
        },
      });
    }),

  // 2. 发送聊天消息并触发 Agent 执行
  sendChatMessage: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        message: z.string().min(1),
        // 核心增强：混合模式配置对象
        aiConfig: z
          .object({
            credentialId: z.string().optional(),
            customBaseUrl: z.string().optional(),
            customApiKey: z.string().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // 验证权限
      await prisma.workflow.findUniqueOrThrow({
        where: {
          id: input.workflowId,
          userId: ctx.auth.user.id,
        },
      });

      // 关键改动：先同步保存用户消息，确保 UI 响应极速且不失踪
      await prisma.chatMessage.create({
        data: {
          workflowId: input.workflowId,
          role: "user",
          content: input.message,
        },
      });

      // 触发 Inngest 工作流，将消息放入 initialData
      // 刚才我们在 Inngest 里写的 save-user-message 逻辑会在这里被激活
      await inngest.send({
        name: "chat/message.sent", // 专门的消息事件，不再干扰 workflow/execute.workflow
        data: {
          workflowId: input.workflowId,
          userId: ctx.auth.user.id,
          message: input.message,
          aiConfig: input.aiConfig, // 传递混合配置
        },
      });

      return { success: true };
    }),
});
