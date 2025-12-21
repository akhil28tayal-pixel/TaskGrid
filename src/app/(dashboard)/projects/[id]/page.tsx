import { notFound } from "next/navigation";
import { getProjectById } from "@/app/actions/projects";
import { ProjectEditor } from "@/components/projects/ProjectEditor";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

interface ProjectPageProps {
  params: { id: string };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  try {
    const result = await getProjectById(params.id);

    if (!result.success || !result.project) {
      console.error('Project not found:', params.id, result.error);
      notFound();
    }

    return <ProjectEditor project={result.project} userRole={result.userRole} />;
  } catch (error) {
    console.error('Error loading project:', error);
    notFound();
  }
}
