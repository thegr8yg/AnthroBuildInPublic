import { NextResponse } from "next/server";

// Scaffolded Supabase email list subscription endpoint.
// To connect:
// 1. npm install @supabase/supabase-js
// 2. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local
// 3. Uncomment the Supabase client block below.
// 4. Create a table: CREATE TABLE email_subscribers (id uuid default gen_random_uuid(), email text unique not null, created_at timestamp default now());
// 5. Enable Row Level Security and add an insert policy for anon users.

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let body: { email?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ ok: false, message: "Email is required." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, message: "Please enter a valid email address." }, { status: 400 });
  }

  // ── Supabase connection stub ──
  // Uncomment and configure the following to activate real storage:
  //
  // import { createClient } from "@supabase/supabase-js";
  // const supabase = createClient(
  //   process.env.SUPABASE_URL!,
  //   process.env.SUPABASE_ANON_KEY!
  // );
  // const { error } = await supabase
  //   .from("email_subscribers")
  //   .insert([{ email }]);
  // if (error) {
  //   if (error.message?.includes("duplicate")) {
  //     return NextResponse.json({ ok: false, message: "You are already subscribed." }, { status: 409 });
  //   }
  //   return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  // }

  return NextResponse.json({
    ok: true,
    message: "Subscribed successfully. (Scaffolded — Supabase not yet connected.)",
    email,
  });
}
