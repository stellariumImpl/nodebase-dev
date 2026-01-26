"use client";

import { ExecutionStatus } from "@/generated/prisma/enums";
import {
  CheckCircle2Icon,
  ClockIcon,
  CopyIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";

import { formatDistanceToNow } from "date-fns";

import Link from "next/link";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { useSuspenseExecution } from "../hooks/use-executions";
import { toast } from "sonner";

const getStatusIcon = (status: ExecutionStatus) => {
  switch (status) {
    case ExecutionStatus.SUCCESS:
      return <CheckCircle2Icon className="size-5 text-green-600" />;
    case ExecutionStatus.FAILED:
      return <XCircleIcon className="size-5 text-red-600" />;
    case ExecutionStatus.RUNNING:
      return <Loader2Icon className="size-5 text-blue-600 animate-spin" />;
    default:
      return <ClockIcon className="size-5 text-muted-foreground" />;
  }
};

const formatStatus = (status: ExecutionStatus) => {
  return status.charAt(0) + status.slice(1).toLowerCase();
};
export const ExecutionView = ({ executionId }: { executionId: string }) => {
  const { data: execution } = useSuspenseExecution(executionId);
  const [showStackTrace, setShowStackTrace] = useState(false);

  const duration = execution.completedAt
    ? Math.round(
        (new Date(execution.completedAt).getTime() -
          new Date(execution.startedAt).getTime()) /
          1000,
      )
    : null;

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          {getStatusIcon(execution.status)}
          <div>
            <CardTitle>{formatStatus(execution.status)}</CardTitle>
            <CardDescription>
              Execution for {execution.workflow.name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Workflow
            </p>
            <Link
              href={`/workflows/${execution.workflowId}`}
              prefetch
              className="text-sm hover:underline text-primary"
            >
              {execution.workflow.name}
            </Link>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>

            <p className="text-sm font-medium text-muted-foreground">
              {formatStatus(execution.status)}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Started</p>

            <p className="text-sm font-medium text-muted-foreground">
              {formatDistanceToNow(execution.startedAt, { addSuffix: true })}
            </p>
          </div>

          {execution.completedAt ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed
              </p>

              <p className="text-sm font-medium text-muted-foreground">
                {formatDistanceToNow(execution.completedAt, {
                  addSuffix: true,
                })}
              </p>
            </div>
          ) : null}

          {duration !== null ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Duration
              </p>

              <p className="text-sm font-medium text-muted-foreground">
                {duration}s
              </p>
            </div>
          ) : null}

          {execution.inngestEventId ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Event ID
              </p>

              <p className="text-sm font-medium text-muted-foreground">
                {execution.inngestEventId}
              </p>
            </div>
          ) : null}

          {execution.error && (
            <div className="col-span-2 mt-6 border border-destructive/20 dark:border-destructive/40 rounded-lg p-4 space-y-4 bg-destructive/5 dark:bg-destructive/10">
              <div>
                <p className="text-sm font-medium text-destructive mb-3">
                  Error
                </p>
                <div className="bg-background/50 dark:bg-background/80 rounded border p-3">
                  <p className="text-sm font-mono text-foreground">
                    {execution.error}
                  </p>
                </div>
              </div>

              {execution.errorStack && (
                <Collapsible
                  open={showStackTrace}
                  onOpenChange={setShowStackTrace}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 border-destructive/20"
                    >
                      {showStackTrace ? "Hide stack trace" : "Show stack trace"}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="bg-background/80 dark:bg-background/90 rounded border max-h-60 overflow-auto relative">
                      <div className="absolute top-2 right-2 z-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-70 hover:opacity-100 transition-opacity"
                          onClick={() => {
                            navigator.clipboard.writeText(execution.errorStack || "");
                            toast.success("Stack trace copied to clipboard");
                          }}
                        >
                          <CopyIcon className="h-3 w-3" />
                        </Button>
                      </div>
                      <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap p-3 pt-8">
                        {execution.errorStack}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}

          {execution.output && (
            <div className="col-span-2 mt-6 border border-border rounded-lg p-4 space-y-4 bg-accent/5 dark:bg-accent/10">
              <p className="text-sm font-medium text-accent-foreground">
                Output
              </p>
              <div className="bg-background/50 dark:bg-background/80 rounded border p-3">
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap max-h-60 overflow-auto">
                  {JSON.stringify(execution.output, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
