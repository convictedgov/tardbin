import { PinnedPastes, RecentPastes } from "@/components/paste-list";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center mb-12">
        <pre className="font-mono text-sm md:text-base whitespace-pre overflow-x-auto">
{`
 ____           _       
|  _ \\ __ _ ___| |_ ___ 
| |_) / _\` / __| __/ _ \\
|  __/ (_| \\__ \\ ||  __/
|_|   \\__,_|___/\\__\\___|
`}
        </pre>
        <p className="text-muted-foreground mt-4">Share code snippets securely and easily</p>
      </div>

      <PinnedPastes />
      <RecentPastes />
    </div>
  );
}
