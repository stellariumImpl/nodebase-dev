# 登录跳转修改问题简析

## 现象与目标偏差

- 当前改动把登录成功后的跳转延迟隐藏在全屏 Loader 中，但**并未缩短真实跳转耗时**，只是把“空白等待”变成“持续加载”。【F:src/features/auth/components/login-form.tsx†L56-L84】

## 具体问题点

1. **导航状态不可恢复**
   - `isNavigating` 在 `onSuccess` 设置为 `true` 后没有任何复位逻辑。若路由失败或卡住，Loader 会一直覆盖界面，用户无法操作或重试。【F:src/features/auth/components/login-form.tsx†L70-L78】

2. **行为改变但缺乏说明**
   - `router.push("/")` 改为 `router.replace("/")` 会改变浏览器历史行为（返回键无法回到登录页）。这是产品层面的行为变化，但未说明其必要性或收益。【F:src/features/auth/components/login-form.tsx†L70-L73】

3. **预取位置与收益不明确**
   - 在登录页 `useEffect` 中做 `router.prefetch("/")` 只是提前下载 bundle，但登录后仍需 session 校验和数据请求，**核心延迟未被解决**。如果首页是受保护路由，prefetch 的边际收益可能很低。【F:src/features/auth/components/login-form.tsx†L58-L60】

4. **错误体验可能退化**
   - 当登录失败触发 `onError` 之外的异常（例如网络中断导致 `onSuccess` 未回调）时，`isNavigating` 不会被重置，用户只能刷新页面恢复。【F:src/features/auth/components/login-form.tsx†L62-L78】

## 建议方向（简要）

- 若要“真正变快”，需要**减少 session 读取/主页数据阻塞**，或改用 `redirect()` / server action 等服务端跳转策略。
- 若只是避免空白，需保证导航失败时的兜底逻辑（如 `router.refresh()` 或 timeout 复位）。【F:src/features/auth/components/login-form.tsx†L62-L78】

```typescript
import { inngest } from "@/inngest/client";
import {
  premiumProcedure,
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../init";
import prisma from "@/lib/prisma";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { TRPCError } from "@trpc/server";

export const appRouter = createTRPCRouter({
  // even when i logout, i can still call this endpoint
  testAi: premiumProcedure.mutation(async () => {
    await inngest.send({
      name: "execute/ai",
    });
    return { success: true, message: "Job queued" };
  }),
  getWorkflows: protectedProcedure.query(({ ctx }) => {
    return prisma.workflow.findMany();
  }),
  createWorkflow: protectedProcedure.mutation(async () => {
    await inngest.send({
      name: "test/hello.world",
      data: {
        email: "fy2226762795@outlook.com",
      },
    });

    return { success: true, message: "Job queued" };
  }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
```
