> “loading 动画结束 → 还停在 form 页约 1 秒 → 然后才跳到主页”

**说明：不是动画卡顿，而是跳转触发得晚**

我们先不瞎猜，我们按层级逐步排查👇

---

# ✅ **先明确问题发生在哪个阶段**

登录流程一般是：

```
点击 Login → authClient.signIn → 后端验证 → 设置 cookie/session → resolve Promise → 前端 router.push("/")
```

你的延迟发生在：

✔ login promise resolve **之后**
✔ router.push("/") **之前或途中**

所以问题大概率出在两个地方：

---

# 🧩 **可能原因 1：`onSuccess` 回调执行太晚**

你的代码：

```ts
await authClient.signIn.email(
  { ... },
  {
    onSuccess: () => {
      router.push("/");
    },
  }
);
```

关键点是：

`authClient.signIn` **不会立即触发 onSuccess**

它必须等待：

1. session 写入数据库
2. session cookie 写入 response
3. Sentry / Inngest / TRPC Telemetry 采样
4. 再 resolve
5. 再执行 onSuccess

**这些步骤通常需要 300ms - 1200ms**

如果你的后端是 Vercel Edge / Serverless，延迟更明显。

---

# 🧩 **可能原因 2：`router.push("/")` 不是同步跳转**

在 Next.js App Router 中：

`router.push` 是 **React concurrent transition**，不会立刻刷新路由，而是：

> 标记路由变化 → 等待一次渲染 → 然后切换 → 然后等待 Suspense → 再加载 page.tsx → 渲染布局

这本身就会带来约 200~800ms 延迟。

---

# 🧩 **可能原因 3：主页数据加载阻塞跳转**

你的主页现在应该包含：

```
protectedProcedure.query()
React Query / TRPC / Suspense
maybe Inngest polling 或 workflow fetch
```

第一次进入 `/workflows` 或 `/dashboard` 时：

TRPC 会执行：

```
getWorkflows
getCredentials
getExecutions
```

会阻塞 UI 渲染，延迟跳转。

---

# 🧩 **可能原因 4：BetterAuth session validation**

BetterAuth（或 Clerk / Auth0 / NextAuth）都会在第一次 client render 时执行：

```
auth.api.getSession()
```

这一步意味着：

客户端登陆后第一次进入 protected 页面时 → 必须从 server fetch session

网络延迟又 ~200–1000ms

---

# 🧩 **可能原因 5：Pre-fetch 没开启**

如果登陆后跳转 `/` 而 `/` 的 page.tsx 没有预加载，则需要：

```
下载页面 bundle → hydrate → 执行 hooks → 请求数据 → 渲染
```

默认会慢。
