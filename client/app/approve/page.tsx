"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Smartphone } from "lucide-react";
import { toast, Toaster } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

const DeviceApprovalPage = () => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userCode = searchParams.get("user_code");

  const [isProcessing, setIsProcessing] = useState({
    approve: false,
    deny: false,
  });

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data?.session || !data?.user) {
    router.push("/sign-in");
    return null;
  }

  const handleApprove = async () => {
    try {
      setIsProcessing({ approve: true, deny: false });
      try{
        toast.loading("Approving device..." , {id:"loading"})
        await authClient.device.approve({
          userCode : userCode!
        })

        toast.dismiss("loading")
        toast.success("Device approved successfully")
        router.push("/")
      }catch {
        toast.error("Failed to approved")
      }
      finally{
        setIsProcessing({
          approve:false,
          deny:false,
        })
      }
      
    } catch {
      toast.error("Failed to approve device");
    } finally {
      setIsProcessing({ approve: false, deny: false });
    }
  };

  const handleDeny = async () => {
    try {
      setIsProcessing({ approve: false, deny: true });
      try{
        toast.loading("Denying device..." , {id:"deny"})
        await authClient.device.deny({
          userCode : userCode!,
        })

        toast.dismiss("deny")
        toast.success("Opps!! Device denied to approve!")
        router.push("/")
      }catch {
        toast.error("Failed to deny device")
      }
      finally{
        setIsProcessing({
          approve:false,
          deny:false,
        })
      }
      
    } catch {
      toast.error("Failed to approve device");
    } finally {
      setIsProcessing({ approve: false, deny: false });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="flex flex-col items-center text-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
            <Smartphone className="h-8 w-8 text-blue-500" />
            <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white border-2 border-background">
              !
            </div>
          </div>

          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold">
              New Device Request
            </CardTitle>
            <CardDescription>
              A device is requesting access to your account
            </CardDescription>
          </div>
        </CardHeader>

        <div className="px-6">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">
              Authorization details
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>

        <CardContent className="space-y-4 pt-6">
          <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm">
            <div className="flex flex-col items-center gap-1">
              <span className="text-md text-muted-foreground">Device Code</span>
              <span className="font-mono text-lg font-semibold tracking-widest">
                {userCode || "---"}
              </span>
            </div>
          </div>

          {/* Security Info Card */}
          <div className="rounded-md border bg-yellow-500/10 px-4 py-3 text-xs text-yellow-700 dark:text-yellow-400">
            <p className="font-medium mb-1">Security notice</p>
            <p>
              Only approve this request if you started the login on another
              device. If you don’t recognize this request, deny it immediately.
            </p>
          </div>
        </CardContent>

        {/* ===== Actions ===== */}
        <CardFooter className="flex gap-3">
          <Button
            variant="destructive"
            className="flex-1 gap-2"
            onClick={handleDeny}
            disabled={isProcessing.approve || isProcessing.deny}
          >
            {isProcessing.deny ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Deny
          </Button>

          <Button
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleApprove}
            disabled={isProcessing.approve || isProcessing.deny}
          >
            {isProcessing.approve ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Approve
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DeviceApprovalPage;
