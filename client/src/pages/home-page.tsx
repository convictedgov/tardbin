import { useState } from "react";
import { PinnedPastes, RecentPastes } from "@/components/paste-list";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center mb-12">
        <pre className="font-mono text-sm md:text-base whitespace-pre overflow-x-auto text-primary inline-block">
{`
████████╗ █████╗ ██████╗ ██████╗ ██████╗ ██╗███╗   ██╗
╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║
   ██║   ███████║██████╔╝██║  ██║██████╔╝██║██╔██╗ ██║
   ██║   ██╔══██║██╔══██╗██║  ██║██╔══██╗██║██║╚██╗██║
   ██║   ██║  ██║██║  ██║██████╔╝██████╔╝██║██║ ╚████║
   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝
`}
        </pre>
        <p className="text-muted-foreground mt-4 font-mono">Share code snippets securely</p>
      </div>

      <div className="max-w-xl mx-auto mb-8">
        <Input
          type="text"
          placeholder="Search pastes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <PinnedPastes searchQuery={searchQuery} />
      <RecentPastes searchQuery={searchQuery} />
    </div>
  );
}