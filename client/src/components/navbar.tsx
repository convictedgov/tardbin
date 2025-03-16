import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, User, LogOut } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import CreatePaste from "./create-paste";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <nav className="border-b border-border bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/">
            <a className="font-mono text-xl font-bold tracking-tighter">PASTE</a>
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link href="/terms">
              <a className="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            </Link>
            <Link href="/users">
              <a className="text-muted-foreground hover:text-foreground transition-colors">Users</a>
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-border">
                <Plus className="h-4 w-4 mr-2" />
                New Paste
              </Button>
            </DialogTrigger>
            <CreatePaste />
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-border">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}