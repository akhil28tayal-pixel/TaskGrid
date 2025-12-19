import { notFound } from "next/navigation";
import { getProjectById } from "@/app/actions/projects";
import { ProjectEditor } from "@/components/projects/ProjectEditor";

interface ProjectPageProps {
  params: { id: string };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const result = await getProjectById(params.id);

  if (!result.success || !result.project) {
    notFound();
  }

  return <ProjectEditor project={result.project} />;
}
