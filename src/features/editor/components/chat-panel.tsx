"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { ChatMessageModel as ChatMessage } from "@/generated/prisma/models";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Loader2,
  X,
  Sparkles,
  Settings2,
  Database,
  Globe,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  workflowId: string;
  onClose: () => void;
}

type ConfigMode = "credential" | "manual";

export const ChatPanel = ({ workflowId, onClose }: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasInitialScrollRef = useRef(false);
  const lastUserMessageAtRef = useRef<Date | null>(null);

  //  当用户发送消息时，强制滚动到底部一次（即使用户在看历史）
  const forceScrollOnNextMessagesRef = useRef(false);

  // --- 混合模式状态管理 ---
  const [configMode, setConfigMode] = useState<ConfigMode>("credential");
  const [selectedCredentialId, setSelectedCredentialId] = useState<string>("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [isAwaitingAssistant, setIsAwaitingAssistant] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // 1. 获取消息历史 - 优化轮询频率
  const { data: messages, isLoading } = useQuery(
    trpc.workflows.getChatMessages.queryOptions(
      { workflowId },
      {
        refetchInterval: 1500,
        staleTime: 0,
      },
    ),
  );

  // 2. 获取用户现有的凭证列表
  const { data: credentialsData } = useQuery(
    trpc.credentials.getMany.queryOptions({ pageSize: 50 }),
  );

  //  获取 ScrollArea viewport
  const getViewport = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return null;
    return root.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
  }, []);

  const scrollToBottom = useCallback(() => {
    const viewport = getViewport();
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [getViewport]);

  // 3. 发送消息 Mutation
  const sendMessage = useMutation(
    trpc.workflows.sendChatMessage.mutationOptions({
      onMutate: async (variables) => {
        const optimisticMessage: ChatMessage = {
          id: `optimistic-${Date.now()}`,
          role: "user",
          content: variables.message,
          workflowId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        lastUserMessageAtRef.current = optimisticMessage.createdAt;
        setIsAwaitingAssistant(true);
        setInput("");

        await queryClient.cancelQueries({
          queryKey: trpc.workflows.getChatMessages.queryKey({ workflowId }),
        });

        const previousMessages = queryClient.getQueryData<ChatMessage[]>(
          trpc.workflows.getChatMessages.queryKey({ workflowId }),
        );

        queryClient.setQueryData<ChatMessage[]>(
          trpc.workflows.getChatMessages.queryKey({ workflowId }),
          (old) => [...(old ?? []), optimisticMessage],
        );

        return { previousMessages };
      },
      onSuccess: () => {
        setInput("");
        queryClient.invalidateQueries({
          queryKey: trpc.workflows.getChatMessages.queryKey({ workflowId }),
        });
      },
      onError: (_error, _variables, context) => {
        if (context?.previousMessages) {
          queryClient.setQueryData(
            trpc.workflows.getChatMessages.queryKey({ workflowId }),
            context.previousMessages,
          );
        }
        setIsAwaitingAssistant(false);
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.workflows.getChatMessages.queryKey({ workflowId }),
        });
      },
    }),
  );

  //  自动滚动规则：
  // - 平时：仅当“接近底部”时才自动贴底（不打扰用户上滑）
  // - 但如果用户刚刚从输入框发送了消息：强制贴底一次
  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;

    if (!hasInitialScrollRef.current && (messages?.length ?? 0) > 0) {
      hasInitialScrollRef.current = true;
      requestAnimationFrame(scrollToBottom);
      return;
    }

    if (forceScrollOnNextMessagesRef.current) {
      forceScrollOnNextMessagesRef.current = false;
      requestAnimationFrame(scrollToBottom);
      return;
    }

    const distanceToBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const isNearBottom = distanceToBottom < 80;

    if (isNearBottom) {
      requestAnimationFrame(scrollToBottom);
    }
  }, [messages, getViewport, scrollToBottom]);

  useEffect(() => {
    if (!isAwaitingAssistant || !messages?.length) return;

    const lastUserMessageAt = lastUserMessageAtRef.current;
    if (!lastUserMessageAt) return;

    const hasAssistantReply = messages.some((message) => {
      if (message.role !== "assistant") return false;
      const createdAt =
        message.createdAt instanceof Date
          ? message.createdAt
          : new Date(message.createdAt);
      return createdAt > lastUserMessageAt;
    });

    if (hasAssistantReply) {
      setIsAwaitingAssistant(false);
    }
  }, [isAwaitingAssistant, messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending) return;

    forceScrollOnNextMessagesRef.current = true;

    const aiConfig =
      configMode === "credential"
        ? { credentialId: selectedCredentialId || undefined }
        : {
            customBaseUrl: customBaseUrl || undefined,
            customApiKey: customApiKey || undefined,
          };

    sendMessage.mutate({
      workflowId,
      message: trimmed,
      aiConfig,
    });

    requestAnimationFrame(scrollToBottom);
  };

  return (
    <div className="flex flex-col h-full w-full min-w-0 bg-background overflow-hidden shadow-sm">
      {/* 头部：包含配置开关 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary animate-pulse" />
          <h2 className="text-sm font-bold tracking-tight">AI Agent Copilot</h2>
        </div>

        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <Settings2
                  className={cn(
                    "size-4",
                    (selectedCredentialId || customBaseUrl) && "text-primary",
                  )}
                />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="w-80 z-[60]"
              align="end"
              sideOffset={8}
              collisionPadding={12}
              onFocusOutside={(e) => {
                if (
                  e.target instanceof Element &&
                  e.target.closest("[data-radix-select-content]")
                ) {
                  e.preventDefault();
                }
              }}
              onInteractOutside={(e) => {
                if (
                  e.target instanceof Element &&
                  e.target.closest("[data-radix-select-content]")
                ) {
                  e.preventDefault();
                }
              }}
            >
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">AI 推理配置</h4>
                  <p className="text-xs text-muted-foreground">
                    选择凭证或手动配置本地 Ollama
                  </p>
                </div>

                <div className="flex gap-2 p-1 bg-muted rounded-md">
                  <Button
                    variant={configMode === "credential" ? "default" : "ghost"}
                    size="sm"
                    className="flex-1 text-xs h-7"
                    onClick={() => setConfigMode("credential")}
                  >
                    <Database className="size-3 mr-1" /> 已有凭证
                  </Button>
                  <Button
                    variant={configMode === "manual" ? "default" : "ghost"}
                    size="sm"
                    className="flex-1 text-xs h-7"
                    onClick={() => setConfigMode("manual")}
                  >
                    <Globe className="size-3 mr-1" /> 手动/本地
                  </Button>
                </div>

                {configMode === "credential" ? (
                  <div className="space-y-2">
                    <Label className="text-xs">选择 AI 凭证</Label>

                    <Select
                      value={selectedCredentialId}
                      onValueChange={setSelectedCredentialId}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="请选择凭证" />
                      </SelectTrigger>

                      <SelectContent className="z-[80]">
                        {credentialsData?.items.map((c) => (
                          <SelectItem
                            key={c.id}
                            value={c.id}
                            className="text-xs"
                          >
                            {c.name} ({c.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Base URL</Label>
                      <Input
                        placeholder="http://localhost:11434/v1"
                        className="h-8 text-xs"
                        value={customBaseUrl}
                        onChange={(e) => setCustomBaseUrl(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">API Key (可选)</Label>
                      <Input
                        type="password"
                        placeholder="Ollama 默认无需填写"
                        className="h-8 text-xs"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/*  关键：不要在 ScrollArea 根节点上加 p-4（容易让滚动条覆盖内容）
          改为在内部内容容器加 padding，并额外加 pr-6 让内容永远不被右侧滚动条遮住 */}
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0 bg-dot-pattern">
        <div className="p-4 pr-6 min-w-0">
          <div className="flex flex-col min-h-full min-w-0">
            {isLoading && (
              <div className="text-center text-xs text-muted-foreground mt-4 italic">
                同步历史记录...
              </div>
            )}

            {messages?.map((m: ChatMessage) => (
              <div
                key={m.id}
                className={cn(
                  "mb-4 flex flex-col min-w-0",
                  m.role === "user" ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "px-3 py-2 rounded-2xl text-[13px] leading-relaxed max-w-[90%] shadow-sm break-words",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-background border rounded-tl-none text-foreground",
                  )}
                >
                  {m.content}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {m.role === "user" ? "你" : "AI 助手"}
                </span>
              </div>
            ))}

            {isAwaitingAssistant && (
              <div className="flex flex-col items-start mb-4 text-muted-foreground">
                <div className="flex items-center gap-2 bg-background border px-3 py-2 rounded-2xl rounded-tl-none text-[13px] shadow-sm">
                  <Loader2 className="size-4 animate-spin" />
                  AI 正在思考...
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* 输入区域 */}
      <div className="p-4 border-t bg-background shrink-0">
        <div className="relative flex items-center gap-2 bg-muted/50 p-1.5 rounded-xl border border-input focus-within:ring-1 focus-within:ring-primary transition-all">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              configMode === "manual"
                ? "通过自定义 URL 询问..."
                : "询问 AI 关于工作流..."
            }
            className="border-0 bg-transparent focus-visible:ring-0 h-9 text-sm flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={sendMessage.isPending}
          />
          <Button
            size="icon"
            className="size-8 rounded-lg shrink-0"
            onClick={handleSend}
            disabled={sendMessage.isPending || !input.trim()}
          >
            {sendMessage.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
