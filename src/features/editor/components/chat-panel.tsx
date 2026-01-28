"use client";

import { useState, useRef, useEffect } from "react";
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

// 定义配置模式
type ConfigMode = "credential" | "manual";

export const ChatPanel = ({ workflowId, onClose }: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 混合模式状态管理 ---
  const [configMode, setConfigMode] = useState<ConfigMode>("credential");
  const [selectedCredentialId, setSelectedCredentialId] = useState<string>("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // 1. 获取消息历史
  const { data: messages, isLoading } = useQuery(
    trpc.workflows.getChatMessages.queryOptions(
      { workflowId },
      { refetchInterval: 3000 },
    ),
  );

  // 2. 获取用户现有的凭证列表
  // 稳扎稳打：只获取与 AI 相关的凭证（假设通过名称或类型筛选）
  const { data: credentialsData } = useQuery(
    trpc.credentials.getMany.queryOptions({ pageSize: 50 }),
  );

  // 3. 发送消息 Mutation
  const sendMessage = useMutation(
    trpc.workflows.sendChatMessage.mutationOptions({
      onSuccess: () => {
        setInput("");
        queryClient.invalidateQueries({
          queryKey: trpc.workflows.getChatMessages.queryKey({ workflowId }),
        });
      },
    }),
  );

  // 4. 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement | null;

      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending) return;

    // 组装 AI 配置参数
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
      aiConfig, // 传递给后端 handleChatMessage 处理
    });
  };

  return (
    <div className="flex flex-col h-full bg-background border-l shadow-sm">
      {/* 头部：包含配置开关 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary animate-pulse" />
          <h2 className="text-sm font-bold tracking-tight">AI Agent Copilot</h2>
        </div>

        <div className="flex items-center gap-1">
          {/* AI 配置弹出层 */}
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

                      {/* 关键：层级高于 Popover */}
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

      <ScrollArea ref={scrollRef} className="flex-1 p-4 bg-dot-pattern">
        {isLoading && (
          <div className="text-center text-xs text-muted-foreground mt-4 italic">
            同步历史记录...
          </div>
        )}

        {messages?.map((m: ChatMessage) => (
          <div
            key={m.id}
            className={cn(
              "mb-4 flex flex-col",
              m.role === "user" ? "items-end" : "items-start",
            )}
          >
            <div
              className={cn(
                "px-3 py-2 rounded-2xl text-[13px] leading-relaxed max-w-[90%] shadow-sm",
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

        {sendMessage.isPending && (
          <div className="flex flex-col items-end mb-4 opacity-50 animate-pulse">
            <div className="bg-primary text-primary-foreground px-3 py-2 rounded-2xl rounded-tr-none text-[13px]">
              正在发送请求...
            </div>
          </div>
        )}
      </ScrollArea>

      {/* 输入区域 */}
      <div className="p-4 border-t bg-background">
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
