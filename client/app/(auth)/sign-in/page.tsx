"use client";

import { LoginForm } from "@/components/login-form";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation"; 
import React, { useEffect } from "react";

const Page = () => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    // user is already authenticated -> redirect to Home page
    if (!isPending && data?.user) {
      router.push("/");
    }
  }, [isPending, data, router]);

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Only show login form if user is not authenticated
  return (
    <>
      <LoginForm />
    </>
  );
};

export default Page;
