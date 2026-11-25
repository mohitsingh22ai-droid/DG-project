"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResendConfirmation } from "@/components/auth/resend-confirmation";

/**
 * Where the link in the confirmation email lands. Supabase has already confirmed the
 * address by the time the browser arrives here; this page only reports the result and
 * never uses the tokens Supabase appends to the address, so they are removed from it.
 */
type Result = "checking" | "confirmed" | "failed" | "unknown";

export default function EmailConfirmedPage() {
  const [result, setResult] = useState<Result>("checking");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    if (hash.get("error") || hash.get("error_code") || query.get("error")) setResult("failed");
    else if (hash.get("access_token") || hash.get("type") === "signup" || query.get("code")) setResult("confirmed");
    else setResult("unknown");
    // Do not leave tokens in the address bar or browser history.
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-16 w-full">
      <Card className="border-border shadow-elevation">
        {result === "confirmed" && (
          <>
            <CardHeader className="space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" aria-hidden="true" />
              <CardTitle className="text-2xl font-bold font-heading">Email confirmed</CardTitle>
              <CardDescription>Thank you. Your account is ready. Sign in to start designing and ordering.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full font-semibold">
                <Link href="/login">Sign in</Link>
              </Button>
            </CardContent>
          </>
        )}
        {result === "failed" && (
          <>
            <CardHeader className="space-y-2">
              <AlertCircle className="w-8 h-8 text-destructive" aria-hidden="true" />
              <CardTitle className="text-2xl font-bold font-heading">This link has expired</CardTitle>
              <CardDescription>The link is too old or has already been used. If you have already confirmed, just sign in. Otherwise we can send a new one.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResendConfirmation />
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Go to sign in</Link>
              </Button>
            </CardContent>
          </>
        )}
        {(result === "unknown" || result === "checking") && (
          <>
            <CardHeader className="space-y-2">
              <Mail className="w-8 h-8 text-brand-600" aria-hidden="true" />
              <CardTitle className="text-2xl font-bold font-heading">Confirm your email</CardTitle>
              <CardDescription>Open the link in the email we sent you. Already did that? Sign in. Can&apos;t find the email? We can send it again.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResendConfirmation />
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Go to sign in</Link>
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
