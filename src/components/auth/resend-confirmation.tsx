"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * "Send the confirmation email again". Pass `email` when the address is already known
 * (after signing up or a refused sign-in); without it the customer types their address.
 * A 60-second pause between sends keeps people from hammering the button.
 */
export function ResendConfirmation({ email: knownEmail }: { email?: string }) {
  const [email, setEmail] = useState(knownEmail ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  useEffect(() => setEmail(knownEmail ?? ""), [knownEmail]);

  const send = async () => {
    if (!email.trim() || busy || wait > 0) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: "error", text: data.error || "The email could not be sent. Please try again." });
        if (res.status === 429) setWait(60);
      } else {
        setMessage({ kind: "ok", text: "If that address has an account waiting to be confirmed, we have sent a new link. Check your inbox and spam folder." });
        setWait(60);
      }
    } catch {
      setMessage({ kind: "error", text: "The email could not be sent. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {!knownEmail && (
        <div className="space-y-1.5">
          <Label htmlFor="resend-email">Your email address</Label>
          <Input id="resend-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="font-mono" />
        </div>
      )}
      <Button type="button" variant="outline" onClick={send} disabled={busy || wait > 0 || !email.trim()} data-testid="resend-confirmation">
        {busy ? "Sending…" : wait > 0 ? `Send again in ${wait}s` : "Send the email again"}
      </Button>
      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm ${message.kind === "error" ? "text-destructive" : "text-emerald-700 dark:text-emerald-400"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
