"use client";

import AppLogo from "@/components/app-logo";

export default function Navbar({ viewer, onSignOut }) {
  const isDepartmentUser = viewer?.isAdmin;

  return (
    <div className="topbar">
      <AppLogo />

      {/* No "Admin Login" link for the public. Staff reach the sign-in page by
          navigating to /auth directly. This is presentation only - it hides the
          door, it does not lock it. The actual gate is server-side: getViewer()
          resolves role/approved from the database, the /api/admin/* routes return
          403 for non-admins, and Supabase RLS restricts writes to role='admin'.
          Once signed in, the controls below reappear for that session. */}
      <div className="masthead-meta">
        {isDepartmentUser ? (
          <>
            <span className="meta-chip">{viewer.permissions?.label}</span>
            <button type="button" className="text-button masthead-signout" onClick={onSignOut}>
              Sign out
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
