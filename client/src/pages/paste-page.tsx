import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Paste } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useParams } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PastePage() {
  const { urlId } = useParams<{ urlId: string }>();
  const [password, setPassword] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const { data: paste, error } = useQuery<Paste>({
    queryKey: [`/api/pastes/${urlId}`, password],
    queryFn: async ({ queryKey }) => {
      const [url, pass] = queryKey;
      const res = await fetch(`${url}${pass ? `?password=${pass}` : ''}`);
      if (res.status === 403) {
        setShowPasswordDialog(true);
        throw new Error("Password required");
      }
      if (!res.ok) throw new Error("Failed to load paste");
      return res.json();
    },
  });

  if (showPasswordDialog) {
    return (
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Protected Paste</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={() => setShowPasswordDialog(false)} className="w-full">
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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