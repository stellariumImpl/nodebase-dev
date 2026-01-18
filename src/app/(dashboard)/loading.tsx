import { Loader } from "@/components/ui/loader";

export default function Loading() {
  return (
    <div className="flex w-full h-full items-center justify-center">
      <Loader variant="inline" />
    </div>
  );
}
