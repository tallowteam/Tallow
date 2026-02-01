export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Tallow</h1>
      <p className="text-neutral-400 text-lg mb-8">
        UI removed - rebuild in progress
      </p>
      <div className="text-neutral-500 text-sm space-y-2">
        <p>Core systems intact:</p>
        <ul className="list-disc list-inside text-neutral-600">
          <li>Post-quantum cryptography (lib/crypto)</li>
          <li>File transfer engine (lib/transfer)</li>
          <li>Onion routing (lib/transport)</li>
          <li>WebRTC connections (lib/webrtc)</li>
          <li>Device discovery (lib/discovery)</li>
          <li>API routes (app/api)</li>
        </ul>
      </div>
    </main>
  );
}
