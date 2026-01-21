import { Button } from "@/components/ui/button";
import { FlaskConicalIcon } from "lucide-react";
import { Hint } from "@/components/hint";
import { useExecuteWorkflow } from "@/features/workflows/hooks/use-workflows";

export const ExecuteWorkflowButton = ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const executeWorkflow = useExecuteWorkflow();
  const handleExecute = () => {
    executeWorkflow.mutate({ id: workflowId });
  };
  return (
    <>
      {/* 手机端（无文字 + 有hint） */}
      <div className="md:hidden">
        <Hint label="Execute workflow" side="bottom" align="center">
          <Button
            size="lg"
            onClick={handleExecute}
            disabled={executeWorkflow.isPending}
          >
            <FlaskConicalIcon className="size-4" />
          </Button>
        </Hint>
      </div>

      {/* 电脑端（有文字 + 无hint） */}
      <div className="hidden md:block">
        <Button
          size="lg"
          onClick={handleExecute}
          className="gap-2"
          disabled={executeWorkflow.isPending}
        >
          <FlaskConicalIcon className="size-4" />
          Execute workflow
        </Button>
      </div>
    </>
  );
};
