"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import AppLogo from "@/components/app-logo";
import ThemeToggle from "@/components/theme-toggle";
import BorderGlow from "@/components/BorderGlow";

export default function Navbar({ viewer, onSignOut }) {
  const isDepartmentUser = viewer?.isAdmin;

  return (
    <div className="masthead-top">
      <AppLogo compact />

      <div className="masthead-meta">
        <ThemeToggle />
        {isDepartmentUser ? (
          <>
            <span className="meta-chip">{viewer.permissions?.label}</span>
            <button type="button" className="text-button masthead-signout" onClick={onSignOut}>
              Sign out
            </button>
          </>
        ) : (
          <BorderGlow
            className="admin-login-glow"
            borderRadius={999}
            colors={["#3B82F6", "#06B6D4"]}
            backgroundColor="var(--tab-bg)"
          >
            <Link href="/auth" className="ghost-link meta-login">
              <ShieldCheck size={14} />
              Admin Login
            </Link>
          </BorderGlow>
        )}
      </div>
    </div>
  );
}
