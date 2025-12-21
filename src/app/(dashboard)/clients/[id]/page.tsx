import { getClientById } from "@/app/actions/clients";
import { notFound } from "next/navigation";
import ClientDetailContent from "@/components/clients/ClientDetailContent";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  try {
    const { id } = await params;
    const result = await getClientById(id);

    if (!result.success || !result.client) {
      console.error('Client not found:', id, result.error);
      notFound();
    }

    return <ClientDetailContent client={result.client} />;
  } catch (error) {
    console.error('Error loading client:', error);
    notFound();
  }
}
