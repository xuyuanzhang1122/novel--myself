
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@xu-novel/ui";
import { deleteNovelAction } from "./actions";

export function DeleteNovelButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      className="bg-red-950 text-red-500 hover:bg-red-900 border border-red-900"
      disabled={isPending}
      onClick={() => {
        if (confirm("确定要删除这本小说及其所有章节吗？")) {
          startTransition(async () => {
            await deleteNovelAction(id);
            router.push("/novels");
            router.refresh();
          });
        }
      }}
    >
      {isPending ? "删除中..." : "删除作品"}
    </Button>
  );
}
