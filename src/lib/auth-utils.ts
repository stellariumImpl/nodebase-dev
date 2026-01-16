import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

// 防止用户没登录就访问需要登录的页面
export const requireAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return session;
};

// 防止用户登录了还能到注册或者登录页面
export const requireUnauth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/");
  }
};
