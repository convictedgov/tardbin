import { useQuery } from "@tanstack/react-query";
import { type Paste } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Pin, PinOff } from "lucide-react";

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{paste.title}</CardTitle>
        {user?.isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => pinMutation.mutate()}
            disabled={pinMutation.isPending}
          >
            {paste.isPinned ? (
              <PinOff className="h-4 w-4" />
            ) : (
              <Pin className="h-4 w-4" />
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <pre className="text-sm overflow-x-auto">
          {paste.content.slice(0, 200)}
          {paste.content.length > 200 && "..."}
        </pre>
      </CardContent>
    </Card>
  );
}

export function PinnedPastes() {
  const { data: pastes } = useQuery<Paste[]>({
    queryKey: ["/api/pastes/pinned"],
  });

  if (!pastes?.length) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Pinned Pastes</h2>
      <div className="grid gap-4 md:grid-cols-2">
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
      <h2 className="text-2xl font-bold">Recent Pastes</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {pastes.map((paste) => (
          <PasteCard key={paste.id} paste={paste} />
        ))}
      </div>
    </div>
  );
}
