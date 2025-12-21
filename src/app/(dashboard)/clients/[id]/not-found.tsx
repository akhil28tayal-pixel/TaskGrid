export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-2xl font-bold mb-4">Client Not Found</h2>
      <p className="text-gray-600 mb-4">The client you're looking for doesn't exist.</p>
      <a href="/clients" className="text-blue-600 hover:underline">
        Back to Clients
      </a>
    </div>
  );
}
