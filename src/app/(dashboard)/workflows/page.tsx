import { Suspense } from "react";

// Force dynamic rendering to always fetch fresh data from database
export const dynamic = "force-dynamic";
import Link from "next/link";
import {
  Plus,
  Search,
  GitBranch,
  RefreshCw,
  Calendar,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getRecurringWork } from "@/app/actions/workflows";
import { getWorkflowTemplates } from "@/app/actions/templates";
import { WorkflowsPageClient } from "@/components/workflows/WorkflowsPageClient";

function formatProjectType(type: string) {
  return type?.replace(/_/g, " ") || "";
}

function countTasks(sections: any[]) {
  return sections?.reduce((acc, section) => acc + (section.tasks?.length || 0), 0) || 0;
}

function formatFrequency(frequency: string) {
  const map: Record<string, string> = {
    DAILY: "Daily",
    WEEKLY: "Weekly",
    BIWEEKLY: "Bi-weekly",
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    ANNUALLY: "Annually",
  };
  return map[frequency] || frequency;
}

async function WorkflowTemplatesTab() {
  const templates = await getWorkflowTemplates();

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <GitBranch className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No workflow templates</h3>
        <p className="mt-2 text-sm text-gray-500">
          Create workflow templates to standardize your processes.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template: any) => (
        <Link key={template.id} href={`/workflows/${template.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg hover:text-primary transition-colors">
                    {template.name}
                  </CardTitle>
                  <Badge className="mt-1 bg-yellow-100 text-yellow-800 border-yellow-300">
                    Template
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {template.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{template.description}</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>{template.sections?.length || 0} sections</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{countTasks(template.sections)} tasks</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

async function RecurringWorkTab() {
  const recurringWork = await getRecurringWork();

  if (recurringWork.length === 0) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No recurring work</h3>
        <p className="mt-2 text-sm text-gray-500">
          Set up recurring work to automatically create projects on a schedule.
        </p>
        <Button className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Add Recurring Work
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recurringWork.map((work) => (
        <Card key={work.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{work.name}</h3>
                  <Badge variant={work.isActive ? "default" : "secondary"}>
                    {work.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                  <span>{work.client.preferredName || work.client.legalName}</span>
                  <span>•</span>
                  <span>{formatFrequency(work.frequency)}</span>
                  {work.template && (
                    <>
                      <span>•</span>
                      <span>Template: {work.template.name}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Next Run</p>
                  <p className="font-medium">
                    {new Date(work.nextRunDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">
                    {work.isActive ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Play className="mr-2 h-4 w-4" />
                        Run Now
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Calendar className="mr-2 h-4 w-4" />
                        Edit Schedule
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <WorkflowsPageClient />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search workflows..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">
            <GitBranch className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="recurring">
            <RefreshCw className="mr-2 h-4 w-4" />
            Recurring Work
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <Suspense fallback={<div className="text-center py-8">Loading templates...</div>}>
            <WorkflowTemplatesTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="recurring">
          <Suspense fallback={<div className="text-center py-8">Loading recurring work...</div>}>
            <RecurringWorkTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
