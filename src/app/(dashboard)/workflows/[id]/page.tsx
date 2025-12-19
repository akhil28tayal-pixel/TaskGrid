import { notFound } from "next/navigation";
import { getWorkflowTemplateById } from "@/app/actions/templates";
import { TemplateEditor } from "@/components/workflows/TemplateEditor";

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
