import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authClientForRoute } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/app-url";

const ResendSchema = z.object({ email: z.string().trim().email() });

/**
 * Sends a new confirmation link. The answer is the same whether or not the address has
 * an unconfirmed account, so this cannot be used to find out who is registered.
 */
export async function POST(req: NextRequest) {
  const parsed = ResendSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const supabase = authClientForRoute(req, NextResponse.json({}));
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email.toLowerCase(),
    options: { emailRedirectTo: `${appOrigin(req.nextUrl.origin)}/auth/confirmed` },
  });

  if (error && (error.status === 429 || error.code === "over_email_send_rate_limit" || /rate limit|security purposes/i.test(error.message))) {
    return NextResponse.json({ error: "Please wait a minute before asking for another email." }, { status: 429 });
  }
  return NextResponse.json({ success: true });
}
