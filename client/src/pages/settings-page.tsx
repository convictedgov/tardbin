import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");

  const updateUserMutation = useMutation({
    mutationFn: async (data: { password?: string; avatarUrl?: string }) => {
      await apiRequest("PATCH", `/api/users/${user!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Settings updated",
        description: "Your settings have been successfully updated",
      });
      setNewPassword("");
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>User Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-mono text-lg">Change Password</h3>
            <div className="flex space-x-4">
              <Input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => updateUserMutation.mutate({ password: newPassword })}
                disabled={!newPassword}
              >
                Update Password
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-mono text-lg">Avatar URL</h3>
            <div className="flex space-x-4">
              <Input
                type="text"
                placeholder="Avatar URL"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => updateUserMutation.mutate({ avatarUrl })}
              >
                Update Avatar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
