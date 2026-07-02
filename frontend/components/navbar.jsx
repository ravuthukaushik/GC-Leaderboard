"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import AppLogo from "@/components/app-logo";

export default function Navbar({ viewer, onSignOut }) {
  const isDepartmentUser = viewer?.isAdmin;

  return (
    <div className="masthead-top">
      <AppLogo compact />

      <div className="masthead-meta">
        {isDepartmentUser ? (
          <>
            <span className="meta-chip">{viewer.permissions?.label}</span>
            <button type="button" className="text-button masthead-signout" onClick={onSignOut}>
              Sign out
            </button>
          </>
        ) : (
          <Link href="/auth" className="ghost-link meta-login">
            <ShieldCheck size={14} />
            Admin Login
          </Link>
        )}
      </div>
    </div>
  );
}
