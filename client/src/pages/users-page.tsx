import { useQuery } from "@tanstack/react-query";
import { type User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, User as UserIcon } from "lucide-react";

export default function UsersPage() {
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  if (!users) return null;

  const admins = users.filter((user) => user.isAdmin);
  const regularUsers = users.filter((user) => !user.isAdmin);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Crown className="h-6 w-6 mr-2 text-yellow-500" />
          admins
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {admins.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle>{user.username}</CardTitle>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <UserIcon className="h-6 w-6 mr-2" />
          users
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {regularUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle>{user.username}</CardTitle>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
