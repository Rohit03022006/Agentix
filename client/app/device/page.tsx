"use client";

import { authClient } from "@/lib/auth-client";
import type React from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DeviceAutherizationPage = () => {
  const [userCode, setUserCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // ✅ FIXED

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formattedCode = userCode
        .trim()
        .replace(/-/g, "")
        .toUpperCase();

      const response = await authClient.device({
        query: { user_code: formattedCode },
      });

      if (response.data) {
        router.push(`/approve?user_code=${formattedCode}`);
      }
    } catch {
      setError("Invalid or expired code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (value.length > 4) {
      value = value.slice(0, 4) + "-" + value.slice(4, 8);
    }

    setError(null);
    setUserCode(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10">
            <ShieldAlert className="h-8 w-8 text-yellow-500" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-semibold">Device Authorization</h1>
            <p className="text-sm text-muted-foreground">
              Enter your device code to continue
            </p>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-4 rounded-lg border bg-card p-6 shadow-sm" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="code" className="text-lg font-medium">
              Device Code
            </label>

            <input
              id="code"
              type="text"
              value={userCode}
              onChange={handleCodeChange}
              placeholder="XXXX-XXXX"
              maxLength={9}
              className="h-10 w-full rounded-md border bg-background px-3 text-center text-lg uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <p className="text-xs text-muted-foreground">
              Find this code on the device you want to authorize.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || userCode.length < 9}
            className={cn(
              "w-full text-white",
              error
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            )}
          >
            {isLoading ? "Verifying..." : "Continue"}
          </Button>
        </form>

        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          This code is unique to your device and will expire shortly. Keep it
          confidential and never share it with anyone.
        </div>
      </div>
    </div>
  );
};

export default DeviceAutherizationPage;
