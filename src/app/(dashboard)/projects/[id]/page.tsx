import { notFound } from "next/navigation";
import { getProjectById } from "@/app/actions/projects";
import { ProjectEditor } from "@/components/projects/ProjectEditor";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  try {
    const { id } = await params;
    const result = await getProjectById(id);

    if (!result.success || !result.project) {
      console.error('Project not found:', id, result.error);
      notFound();
    }

    return <ProjectEditor project={result.project} userRole={result.userRole} />;
  } catch (error) {
    console.error('Error loading project:', error);
    notFound();
  }
}
