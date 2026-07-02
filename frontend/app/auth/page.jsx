"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const roleOptions = [
  { value: "pho", label: "PHO", description: "Food waste, segregation, and hostel waste" },
  { value: "emd", label: "EMD", description: "Electricity usage uploads" },
  { value: "admin", label: "Admin", description: "Events, attendance, and full dashboard control" }
];

export default function AuthPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentRole, setDepartmentRole] = useState("pho");
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

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              department_role: departmentRole
            }
          }
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        await supabase.auth.signOut();
        setMessage(
          "Account created. It is now pending Supabase approval. Approve the user in the profiles table before they can sign in.",
        );
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
        .select("role, requested_role, approved")
        .eq("id", user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        setMessage("We could not verify your department approval yet. Please try again.");
        return;
      }

      if (!profile?.approved) {
        await supabase.auth.signOut();
        const requestedRole = profile?.requested_role?.toUpperCase?.() || "department";
        setMessage(
          `${requestedRole} access is pending approval. Approve this user in Supabase before they can log in.`,
        );
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
        <h1>{mode === "signin" ? "Sign in" : "Create account"}</h1>
        <p className="auth-copy">
          Department accounts are split across PHO, EMD, and Admin. Sign-up only creates
          a pending request. Access is granted only after approval in Supabase.
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

          {mode === "signup" ? (
            <label>
              <span>Department access</span>
              <select
                value={departmentRole}
                onChange={(event) => setDepartmentRole(event.target.value)}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} · {option.description}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button type="submit" className="primary-button" disabled={isPending}>
            {isPending ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {message ? <p className="status-note">{message}</p> : null}

        <button
          type="button"
          className="toggle-link"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin"
            ? "Need a new department account? Switch to sign up"
            : "Already have an account? Switch to sign in"}
        </button>
      </div>
    </main>
  );
}
