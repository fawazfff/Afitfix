import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const expectedUsername = process.env.ADMIN_LOGIN_USERNAME;
    const expectedPassword = process.env.ADMIN_LOGIN_PASSWORD;
    const adminEmail = process.env.ADMIN_LOGIN_EMAIL;

    if (!expectedUsername || !expectedPassword || !adminEmail) {
      return NextResponse.json({ error: "Admin login is not configured yet." }, { status: 503 });
    }

    if (username !== expectedUsername || password !== expectedPassword) {
      return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: expectedPassword,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: "Admin account authentication failed. The Supabase password for the admin account must match the portal password." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role").eq("id", data.user.id).maybeSingle();

    if (profileError || profile?.role !== "admin") {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "This account is not authorised for the admin portal." }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to sign in. Please try again." }, { status: 400 });
  }
}
