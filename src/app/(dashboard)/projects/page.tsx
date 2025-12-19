import { Suspense } from "react";
import { getProjects } from "@/app/actions/projects";
import { ProjectsPageClient } from "@/components/projects/ProjectsPageClient";

// Force dynamic rendering to always fetch fresh data
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectsPageClient initialProjects={projects} />
    </Suspense>
  );
}
