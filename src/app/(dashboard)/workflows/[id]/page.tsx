import { notFound } from "next/navigation";
import { getWorkflowTemplateById } from "@/app/actions/templates";
import { TemplateEditor } from "@/components/workflows/TemplateEditor";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TemplatePageProps {
  params: { id: string };
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  const template = await getWorkflowTemplateById(params.id);

  if (!template) {
    notFound();
  }

  return <TemplateEditor template={template} />;
}
