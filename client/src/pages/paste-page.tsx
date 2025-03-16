import { useQuery } from "@tanstack/react-query";
import { type Paste } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useParams } from "wouter";

export default function PastePage() {
  const { urlId } = useParams<{ urlId: string }>();

  const { data: paste } = useQuery<Paste>({
    queryKey: [`/api/pastes/${urlId}`],
  });

  if (!paste) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-mono">{paste.title}</h1>
            <time className="text-xs text-muted-foreground font-mono">
              {new Date(paste.createdAt).toLocaleString()}
            </time>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-background p-4 border border-border rounded-none overflow-x-auto text-sm font-mono">
            {paste.content}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}