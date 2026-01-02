"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Github, Loader2, ShieldCheck, Terminal } from "lucide-react";

import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { authClient } from "@/lib/auth-client";

export const LoginForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="flex flex-col gap-8 py-8">
          {/* Product Intro */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Terminal className="h-6 w-6" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              CLI-Based AI Agent
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              Build, automate, and interact with intelligent agents directly
              from your terminal using modern AI workflows.
            </p>
          </div>

          {/* Auth Section */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 text-center">
              {/* Heading with Icon */}
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Sign in with GitHub</h2>
              </div>

              <p className="text-sm text-muted-foreground max-w-sm">
                Use your GitHub account to securely authenticate and continue to
                your AI CLI Agent workspace.
              </p>
            </div>

            <Button
              onClick={() =>
                authClient.signIn.social({
                  provider: "github",
                  callbackURL: "http://localhost:3000",
                })
              }
              disabled={isLoading}
              variant="outline"
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to GitHub...
                </>
              ) : (
                <>
                  <Github className="h-4 w-4" />
                  Continue with GitHub
                </>
              )}
            </Button>
          </div>

          {/* Trust / Security */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>
              We never access your private repositories or store your password
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
