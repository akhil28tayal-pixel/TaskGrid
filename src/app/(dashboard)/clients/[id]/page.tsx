import { getClientById } from "@/app/actions/clients";
import { notFound } from "next/navigation";
import ClientDetailContent from "@/components/clients/ClientDetailContent";

interface ClientDetailPageProps {
  params: { id: string };
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const result = await getClientById(params.id);

  if (!result.success || !result.client) {
    notFound();
  }

  return <ClientDetailContent client={result.client} />;
}
