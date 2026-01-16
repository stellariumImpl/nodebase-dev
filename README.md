## 纯服务端组件

一开始 page.tsx 是 服务器组件，直接 async 拉数据

```typescript
// 伪代码
const Page = async () => {
  const users = await prisma.user.findMany(); // 或 caller.getUsers()
  return <div>{JSON.stringify(users)}</div>;
};
```

在服务端渲染时就已经 await 拿到数据；浏览器拿到的 HTML 里已经有完整数据，所以首屏非常快；但这是纯 Server Component，不能用 useState/useEffect 之类的客户端 hook，交互能力有限。

## 改成纯客户端

把 page.tsx 改成客户端组件，"use client" + useQuery（加载慢一些）

```typescript
"use client";

const Page = () => {
  const trpc = useTRPC();
  const { data: users } = useQuery(trpc.getUsers.queryOptions());
  return <div>{JSON.stringify(users)}</div>;
};
```

变化是：

- page.tsx 顶部加了 "use client"，整个页面变成 Client Component；
- 可以用 useTRPC、useQuery、useEffect 等各种 hook；
- 但数据获取逻辑现在在 浏览器端执行： 1. 首屏先渲染一个没有数据的空页面（或者 loading） 2. 等 JS bundle 下载完、React 启动后 3. useQuery 再去发请求拿数据

所以会感觉：加载变慢了，首屏会有一段“白屏/加载”的时间。

## 现在的做法是：服务端渲染 + 客户端渲染

用 Hydration + React Query 结合两者优点

1. Server 端创建一个 React Query 的 queryClient
   getQueryClient() 返回在服务端用的 QueryClient，它和 tRPC 的 server helper 绑在一起。
2. 服务端提前执行 prefetchQuery
   `void queryClient.prefetchQuery(trpc.getUsers.queryOptions());`
   - 跟 useQuery 是同一条 query（同一个 key）；
   - 但这次是在 Node/服务端 提前把 getUsers 的数据查出来，放进 queryClient 的缓存里；
   - 这一步利用了“服务端快、离数据库近”的优势。
3. dehydrate(queryClient) 把服务端的缓存序列化
   - queryClient 里有数据了，用 dehydrate 把数据序列化成 JSON，打包到 HTML 里。
   - 这样客户端拿到 HTML 时，queryClient 里已经有数据了，不需要再发请求。
4. client 端，客户端组件，可以用各种 hook；useTRPC() 拿到的是 在客户端的 tRPC+React Query 封装；
   `useSuspenseQuery(trpc.getUsers.queryOptions())：`
   - query key 和 server 那边 prefetchQuery 用的是 完全相同的 options；
   - 因为外面包着 `<HydrationBoundary state={...}>`，React Query 在浏览器启动时会：
     1. 用 dehydrate 传进来的缓存 rehydrate 成客户端的 queryClient；
     2. 所以 useSuspenseQuery 一上来就能在缓存里找到 getUsers 的数据；
     3. 几乎不需要再发请求，也不会出现 loading 闪烁。

## 备份

```typescript
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  published Boolean @default(false)
  authorId  Int
  author    User    @relation(fields: [authorId], references: [id])
}
```

```typescript
// import prisma from "@/lib/prisma";
// import { caller } from "@/trpc/server"; // let the page as server component
import { getQueryClient, trpc } from "@/trpc/server";
import { Client } from "./client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

// "use client";
// import { useTRPC } from "@/trpc/client";
// import { useQuery } from "@tanstack/react-query";

// Here we build a boundary between server components and client components
// and we pass the dehydrated query client to the client component
const Page = async () => {
  // const Page = async () => {
  // const users = await prisma.user.findMany();
  // const users = await caller.getUsers(); // NOTE: import "server-only";
  const queryClient = getQueryClient();
  // leverage the speed of server to prefetch the data
  void queryClient.prefetchQuery(trpc.getUsers.queryOptions());

  // Here is the client way for tRPC
  // const trpc = useTRPC();
  // const { data: users } = useQuery(trpc.getUsers.queryOptions());
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      {/* {JSON.stringify(users)} */}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<p>Loading...</p>}>
          <Client />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
};
export default Page;
```

```typescript
// COPY from page.tsx & MODIFY
"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

export const Client = () => {
  // const Page = async () => {
  // const users = await prisma.user.findMany();
  // const users = await caller.getUsers(); // NOTE: import "server-only";
  // Here is the client way for tRPC
  const trpc = useTRPC();
  //   const { data: users } = useQuery(trpc.getUsers.queryOptions());
  const { data: users } = useSuspenseQuery(trpc.getUsers.queryOptions());
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      Client component: {JSON.stringify(users)}
    </div>
  );
};
```

```typescript
import prisma from "@/lib/prisma";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    // Fetching the video
    await step.sleep("fetching-the-video", "5s");

    // Transcribing the video
    await step.sleep("transcribing-the-video", "5s");

    // Sending transcription to AI
    await step.sleep("sending-transcription-to-ai", "5s");

    await step.run("create-workflow", () => {
      return prisma.workflow.create({
        data: {
          name: "workflow-from-inngest",
        },
      });
    });
  }
);
```
