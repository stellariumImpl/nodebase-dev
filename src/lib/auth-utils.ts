import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

const getSessionSafe = async () => {
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    console.error("Failed to read session", error);
    return null;
  }
};

// 防止用户没登录就访问需要登录的页面
export const requireAuth = async () => {
  // const session = await auth.api.getSession({
  //   headers: await headers(),
  // });

  const session = await getSessionSafe();

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
