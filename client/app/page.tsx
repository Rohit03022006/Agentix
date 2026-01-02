"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, LogOut, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && (!data?.session || !data?.user)) {
      router.push("/sign-in");
    }
  }, [isPending, data, router]);

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data?.user) return null;

  const { user } = data;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-5">
      <div className="flex flex-col w-full items-center max-w-md">
        <Card className="overflow-hidden shadow-xl w-full">
          {/* Header */}
          <CardHeader className="relative flex flex-col items-center gap-4 bg-gradient-to-b from-zinc-100 to-transparent dark:from-zinc-900 pt-8 pb-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage
                  src={user.image ?? undefined}
                  alt={user.name ?? "User"}
                />
                <AvatarFallback className="text-lg font-semibold bg-primary/10">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-blue-500 rounded-full border-2 border-background flex items-center justify-center">
                <BadgeCheck className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight">
                Welcome, {user.name ?? "Unnamed User"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Authenticated user
              </p>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="flex flex-col gap-6 py-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm">Email address</p>
                <p className="font-mono text-xs break-all text-muted-foreground mt-1">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
              <ShieldCheck className="h-4 w-4" />
              <span>Logged in securely via GitHub OAuth</span>
            </div>

            <Button
              className="w-full gap-2 mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
              onClick={() =>
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => router.push("/sign-in"),
                    onError: () => console.error("Sign out failed"),
                  },
                })
              }
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>

        <div className="mt-6 flex w-full items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          <span className="whitespace-nowrap">Session Active</span>
          <div className="flex-1 h-px bg-border" />
        </div>
      </div>
    </div>
  );
}
