import { useQuery } from "@tanstack/react-query";
import { type Paste } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PublicPasteList() {
  const { data: pastes } = useQuery<Paste[]>({
    queryKey: ["/p"],
  });
  const [selectedPaste, setSelectedPaste] = useState<Paste | null>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<{ [id: number]: string[] }>({});

  if (!pastes?.length) return <div>No public pastes found.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold font-mono mb-4">Public Pastes</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pastes.map((paste) => (
          <Card key={paste.id} className="bg-card border-border p-4">
            <div className="flex flex-col gap-2">
              <Link href={`/p/${paste.urlId}`}>
                <a className="font-mono text-lg hover:underline">{paste.title}</a>
              </Link>
              <pre className="bg-background p-2 border rounded text-sm font-mono overflow-x-auto max-h-32">{paste.content}</pre>
              <Button size="sm" onClick={() => setSelectedPaste(paste)}>
                View & Comment
              </Button>
            </div>
            {selectedPaste?.id === paste.id && (
              <div className="mt-4 border-t pt-2">
                <h3 className="font-bold mb-2">Comments</h3>
                <div className="space-y-2 mb-2">
                  {(comments[paste.id] || []).map((c, i) => (
                    <div key={i} className="bg-background p-2 rounded text-sm">{c}</div>
                  ))}
                </div>
                <input
                  className="border p-2 w-full mb-2"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    setComments(prev => ({
                      ...prev,
                      [paste.id]: [...(prev[paste.id] || []), comment],
                    }));
                    setComment("");
                  }}
                  disabled={!comment.trim()}
                >
                  Submit
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
