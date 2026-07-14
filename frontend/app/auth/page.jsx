"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      if (!supabase) {
        setMessage("Supabase is not configured yet. Add the env vars first.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message);
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Unable to load your user session. Please try again.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, approved")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.approved || profile?.role !== "admin") {
        await supabase.auth.signOut();
        setMessage("This account does not have admin access.");
        return;
      }

      setMessage("Signed in successfully. Redirecting...");
      router.push("/");
      router.refresh();
    });
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-spotlight" aria-hidden="true" />
        <Link href="/" className="ghost-link">
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
        <p className="eyebrow">Green Cup Admin Access</p>
        <h1>Admin sign in</h1>
        <p className="auth-copy">
          Access is restricted to the Green Cup admin account.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <div className="input-shell">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="input-shell">
              <LockKeyhole size={16} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </div>
          </label>

          <button type="submit" className="primary-button" disabled={isPending}>
            {isPending ? "Working..." : "Sign in"}
          </button>
        </form>

        {message ? <p className="status-note">{message}</p> : null}
      </div>
    </main>
  );
}
