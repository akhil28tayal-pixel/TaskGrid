"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import { useSession } from "next-auth/react";

export function WorkflowsPageClient() {
  const { data: session } = useSession();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const userRole = (session?.user as any)?.role;
  const isPartner = userRole === "PARTNER";

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-500">Manage templates</p>
        </div>
        <div className="flex items-center gap-2">
          {isPartner && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          )}
        </div>
      </div>

      <CreateTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
