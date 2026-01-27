"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { ChatMessageModel as ChatMessage } from "@/generated/prisma/models";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  workflowId: string;
  onClose: () => void;
}

export const ChatPanel = ({ workflowId, onClose }: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // 1. 获取消息历史
  const { data: messages, isLoading } = useQuery(
    trpc.workflows.getChatMessages.queryOptions(
      { workflowId },
      { refetchInterval: 3000 },
    ),
  );

  // 2. 发送消息 Mutation
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

  // 3. 彻底修复：自动滚动到底部
  // querySelector 返回 Element，必须转换为 HTMLElement 才能访问 scrollTop
  useEffect(() => {
    /**
     * 将滚动区域滚动到底部
     * 通过查找ScrollArea组件的viewport元素并设置其scrollTop为scrollHeight实现
     */
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement | null;

      if (viewport) {
        // 修正点：将之前的 typo viewport.viewport.scrollHeight 改为正确的 scrollHeight
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending) return;
    sendMessage.mutate({ workflowId, message: trimmed });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary animate-pulse" />
          <h2 className="text-sm font-bold tracking-tight">AI Agent Copilot</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="size-8"
        >
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {isLoading && (
          <div className="text-center text-xs text-muted-foreground mt-4 italic">
            加载历史记录...
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
                  : "bg-muted border rounded-tl-none",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sendMessage.isPending && (
          <div className="flex flex-col items-end mb-4 opacity-50">
            <div className="bg-primary text-primary-foreground px-3 py-2 rounded-2xl rounded-tr-none text-[13px]">
              发送中...
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <div className="relative flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-input focus-within:ring-1 focus-within:ring-primary">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="问问 AI..."
            className="border-0 bg-transparent focus-visible:ring-0 h-9 text-sm flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={sendMessage.isPending}
          />
          <Button
            size="icon"
            className="size-8 rounded-lg"
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
