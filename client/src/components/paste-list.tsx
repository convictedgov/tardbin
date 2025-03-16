import { useQuery } from "@tanstack/react-query";
import { type Paste } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Pin, PinOff } from "lucide-react";
import { Link } from "wouter";

export function PasteCard({ paste }: { paste: Paste }) {
  const { user } = useAuth();

  const pinMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/pastes/${paste.id}/pin`, {
        isPinned: !paste.isPinned,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pastes/pinned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pastes/recent"] });
    },
  });

  return (
    <Link href={`/p/${paste.urlId}`}>
      <a className="block">
        <Card className="bg-card border-border hover:bg-secondary transition-colors p-4 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-mono text-lg">{paste.title}</h3>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {new Date(paste.createdAt).toLocaleString()}
              </p>
            </div>
            {user?.isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  pinMutation.mutate();
                }}
                disabled={pinMutation.isPending}
                className="hover:bg-background"
              >
                {paste.isPinned ? (
                  <PinOff className="h-4 w-4" />
                ) : (
                  <Pin className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </Card>
      </a>
    </Link>
  );
}

export function PinnedPastes() {
  const { data: pastes } = useQuery<Paste[]>({
    queryKey: ["/api/pastes/pinned"],
  });

  if (!pastes?.length) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold font-mono border-b border-border pb-2">Pinned Pastes</h2>
      <div className="space-y-2">
        {pastes.map((paste) => (
          <PasteCard key={paste.id} paste={paste} />
        ))}
      </div>
    </div>
  );
}

export function RecentPastes() {
  const { data: pastes } = useQuery<Paste[]>({
    queryKey: ["/api/pastes/recent"],
  });

  if (!pastes?.length) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold font-mono border-b border-border pb-2">Recent Pastes</h2>
      <div className="space-y-2">
        {pastes.map((paste) => (
          <PasteCard key={paste.id} paste={paste} />
        ))}
      </div>
    </div>
  );
}