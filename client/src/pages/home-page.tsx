import { PinnedPastes, RecentPastes } from "@/components/paste-list";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center mb-12">
        <pre className="font-mono text-sm md:text-base whitespace-pre overflow-x-auto text-primary inline-block">
{`
██████╗  █████╗ ███████╗████████╗███████╗
██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██╔════╝
██████╔╝███████║███████╗   ██║   █████╗  
██╔═══╝ ██╔══██║╚════██║   ██║   ██╔══╝  
██║     ██║  ██║███████║   ██║   ███████╗
╚═╝     ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝
`}
        </pre>
        <p className="text-muted-foreground mt-4 font-mono">Share code snippets securely</p>
      </div>

      <PinnedPastes />
      <RecentPastes />
    </div>
  );
}