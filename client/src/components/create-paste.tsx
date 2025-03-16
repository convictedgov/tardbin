import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPasteSchema, type InsertPaste } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function CreatePaste() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const form = useForm<InsertPaste>({
    resolver: zodResolver(insertPasteSchema),
    defaultValues: {
      isPrivate: false,
    },
  });

  const createPasteMutation = useMutation({
    mutationFn: async (data: InsertPaste) => {
      const res = await apiRequest("POST", "/api/pastes", data);
      return await res.json();
    },
    onSuccess: (paste) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pastes/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pastes/pinned"] });
      setLocation(`/p/${paste.urlId}`);
      navigator.clipboard.writeText(`${window.location.origin}/p/${paste.urlId}`);
      toast({
        title: "Paste created",
        description: "URL copied to clipboard",
      });
    },
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create New Paste</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(data => createPasteMutation.mutate(data))} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Textarea rows={10} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPrivate"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Private Paste</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch("isPrivate") && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" className="w-full" disabled={createPasteMutation.isPending}>
            Create Paste
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
}
