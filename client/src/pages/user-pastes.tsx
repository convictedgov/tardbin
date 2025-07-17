import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

export default function UserPastesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: pastes, isLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "pastes"],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/users/${user.id}/pastes`);
      if (!res.ok) throw new Error("Failed to load user pastes");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (pasteId: number) => {
      const res = await fetch(`/api/pastes/${pasteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete paste");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "pastes"] });
    },
  });

  if (!user) return <div className="text-center mt-8">Please log in to view your pastes.</div>;
  if (isLoading) return <div className="text-center mt-8">Loading...</div>;
  if (!pastes?.length) return <div className="text-center mt-8">You have no pastes yet.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold font-mono mb-4">Your Pastes</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pastes.map((paste: any) => (
          <Card key={paste.id} className="bg-card border-border p-4">
            <Link href={`/p/${paste.urlId}`}>
              <a className="font-mono text-lg hover:underline">{paste.title}</a>
            </Link>
            <pre className="bg-background p-2 border rounded text-sm font-mono overflow-x-auto max-h-32 mt-2">{paste.content}</pre>
            <div className="text-xs text-muted-foreground mt-2">Created: {new Date(paste.createdAt).toLocaleString()}</div>
            {user?.isAdmin && (
              <button
                className="mt-2 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                onClick={() => deleteMutation.mutate(paste.id)}
                disabled={deleteMutation.status === "pending"}
              >
                {deleteMutation.status === "pending" ? "Deleting..." : "Delete"}
              </button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
