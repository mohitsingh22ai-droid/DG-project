import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authClientForRoute } from "@/lib/supabase/server";
import { validatePasswordStrength, getUserById } from "@/modules/auth/users-store";
import { toSafeUser } from "@/lib/server-auth";
import { appOrigin } from "@/lib/app-url";

const RegisterSchema = z.object({
  email: z.string().trim().email("A valid email address is required."),
  password: z.string(),
  fullName: z.string().trim().min(1, "Full name is required.").max(120),
  companyName: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(32).optional(),
});

/**
 * Public signup. Supabase Auth creates the account and, when "Confirm email" is on in
 * the Supabase dashboard, emails a confirmation link: the customer cannot sign in until
 * they click it. If confirmation is switched off, Supabase returns a session and the
 * customer is signed in straight away (same response as before).
 * The role is always 'customer' (set by the on_auth_user_created trigger).
 */
export async function POST(req: NextRequest) {
  const parsed = RegisterSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Email, password, and full name are required.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { email, password, fullName, companyName, phone } = parsed.data;
  const passwordProblem = validatePasswordStrength(password);
  if (passwordProblem) {
    return NextResponse.json({ error: passwordProblem }, { status: 400 });
  }

  const normalisedEmail = email.toLowerCase();
  const response = NextResponse.json({});
  const supabase = authClientForRoute(req, response);
  const { data, error } = await supabase.auth.signUp({
    email: normalisedEmail,
    password,
    options: {
      data: { full_name: fullName, company_name: companyName || "", phone: phone || "" },
      emailRedirectTo: `${appOrigin(req.nextUrl.origin)}/auth/confirmed`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || /already (been )?registered|already exists/i.test(error.message)) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    if (error.status === 429 || error.code === "over_email_send_rate_limit" || /rate limit/i.test(error.message)) {
      return NextResponse.json(
        { error: "We can't send another email right now. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: error.message || "Registration failed." }, { status: 400 });
  }

  // With confirmation on, Supabase hides existing accounts: it returns a user with no identities.
  if (!data.user || (data.user.identities && data.user.identities.length === 0)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  // Confirmation required: the account exists but cannot sign in until the link is used.
  if (!data.session) {
    return NextResponse.json({ success: true, needsConfirmation: true, email: normalisedEmail }, { status: 201 });
  }

  // Confirmation switched off: the customer is already signed in.
  const user = await getUserById(data.user.id);
  if (!user) {
    return NextResponse.json({ error: "Account created but profile is missing. Has the database migration been applied?" }, { status: 500 });
  }
  return NextResponse.json(
    { success: true, user: toSafeUser(user), token: data.session.access_token },
    { status: 201, headers: response.headers }
  );
}
