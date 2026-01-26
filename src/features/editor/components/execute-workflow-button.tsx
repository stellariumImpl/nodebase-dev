import { Button } from "@/components/ui/button";
import { FlaskConicalIcon } from "lucide-react";
import { Hint } from "@/components/hint";
import { useExecuteWorkflow } from "@/features/workflows/hooks/use-workflows";
import { useSetAtom, useAtomValue } from "jotai";
import { triggerNodeStatusResetAtom } from "@/features/executions/store/node-status-store";
import { workflowSaveStatusAtom } from "../store/atoms";

export const ExecuteWorkflowButton = ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const executeWorkflow = useExecuteWorkflow();
  const triggerNodeStatusReset = useSetAtom(triggerNodeStatusResetAtom);
  const saveStatus = useAtomValue(workflowSaveStatusAtom);

  // 当workflow处于未保存或保存中状态时禁用执行按钮
  const isUnsaved = saveStatus === "unsaved";
  const isSaving = saveStatus === "saving";
  const isDisabled = executeWorkflow.isPending || isUnsaved || isSaving;

  const handleExecute = () => {
    // Reset all node statuses before executing workflow
    triggerNodeStatusReset();
    executeWorkflow.mutate({ id: workflowId });
  };

  const getHintLabel = () => {
    if (isUnsaved) {
      return "Please save workflow before executing";
    }
    return "Execute workflow";
  };

  return (
    <>
      {/* 手机端（无文字 + 有hint） */}
      <div className="md:hidden">
        <Hint label={getHintLabel()} side="bottom" align="center">
          <Button size="lg" onClick={handleExecute} disabled={isDisabled}>
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
          disabled={isDisabled}
          title={
            isUnsaved ? "Please save workflow before executing" : undefined
          }
        >
          <FlaskConicalIcon className="size-4" />
          Execute workflow
        </Button>
      </div>
    </>
  );
};
