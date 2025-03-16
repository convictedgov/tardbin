import { useQuery, useMutation } from "@tanstack/react-query";
import { type User, type Paste } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted",
        description: "User has been successfully deleted",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, isAdmin, password }: { userId: number; isAdmin?: boolean; password?: string }) => {
      await apiRequest("PATCH", `/api/users/${userId}`, { isAdmin, password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User updated",
        description: "User has been successfully updated",
      });
      setNewPassword("");
    },
  });

  if (!users) return null;

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isProtectedUser = (username: string) => ["victim", "convicted"].includes(username);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-6"
          />
          <div className="space-y-6">
            {filteredUsers.map((u) => (
              <div key={u.id} className="bg-card p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-mono text-lg">{u.username}</h3>
                    <p className="text-xs text-muted-foreground">
                      {u.isAdmin ? "Administrator" : "User"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {!isProtectedUser(u.username) && (
                      <>
                        <Input
                          type="password"
                          placeholder="New password"
                          className="w-48"
                          value={u.id === parseInt(newPassword.split(":")[0]) ? newPassword.split(":")[1] : ""}
                          onChange={(e) => setNewPassword(`${u.id}:${e.target.value}`)}
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (newPassword.startsWith(`${u.id}:`)) {
                              updateUserMutation.mutate({
                                userId: u.id,
                                password: newPassword.split(":")[1],
                              });
                            }
                          }}
                          disabled={!newPassword.startsWith(`${u.id}:`)}
                        >
                          Change Password
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => updateUserMutation.mutate({ userId: u.id, isAdmin: !u.isAdmin })}
                        >
                          {u.isAdmin ? "Remove Admin" : "Make Admin"}
                        </Button>
                        {u.id !== user.id && (
                          <Button
                            variant="destructive"
                            onClick={() => deleteUserMutation.mutate(u.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}