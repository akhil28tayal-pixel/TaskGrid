import { ClientsPageContent } from "@/components/clients/ClientsPageContent";
import { getClients } from "@/app/actions/clients";

export default async function ClientsPage() {
  const clients = await getClients();

  return <ClientsPageContent initialClients={clients} />;
}
