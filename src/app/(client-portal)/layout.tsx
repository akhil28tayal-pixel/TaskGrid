import "@/app/globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ClientPortalSidebar } from "@/components/client-portal/ClientPortalSidebar";

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex h-screen bg-gray-50">
        <ClientPortalSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
