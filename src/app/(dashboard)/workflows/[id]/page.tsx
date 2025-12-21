import { notFound } from "next/navigation";
import { getWorkflowTemplateById } from "@/app/actions/templates";
import { TemplateEditor } from "@/components/workflows/TemplateEditor";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

interface TemplatePageProps {
  params: { id: string };
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  try {
    const template = await getWorkflowTemplateById(params.id);

    if (!template) {
      console.error('Template not found:', params.id);
      notFound();
    }

    return <TemplateEditor template={template} />;
  } catch (error) {
    console.error('Error loading template:', error);
    notFound();
  }
}
