export const dynamic = "force-dynamic";

import { getUserTasks, getTaskFilters } from "@/app/actions/tasks";
import { TasksPageClient } from "@/components/tasks/TasksPageClient";

export default async function TasksPage() {
  const [tasks, filters] = await Promise.all([
    getUserTasks(),
    getTaskFilters(),
  ]);

  return <TasksPageClient initialTasks={tasks} filters={filters} />;
}
