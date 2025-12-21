import { notFound } from "next/navigation";
import { getWorkflowTemplateById } from "@/app/actions/templates";
import { TemplateEditor } from "@/components/workflows/TemplateEditor";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

interface TemplatePageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  try {
    const { id } = await params;
    const template = await getWorkflowTemplateById(id);

    if (!template) {
      console.error('Template not found:', id);
      notFound();
    }

    return <TemplateEditor template={template} />;
  } catch (error) {
    console.error('Error loading template:', error);
    notFound();
  }
}
