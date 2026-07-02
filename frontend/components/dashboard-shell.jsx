"use client";

import { useEffect, useState } from "react";
import DashboardContent from "@/components/DashboardContent";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function DashboardShell({ initialPayload, viewer }) {
  const [payload, setPayload] = useState(initialPayload);
  const [activeTab, setActiveTab] = useState("leaderboard");

  const refreshDashboard = async () => {
    const response = await fetch("/api/dashboard", { cache: "no-store" });
    const nextPayload = await response.json();
    setPayload(nextPayload);
  };

  useEffect(() => {
    setPayload(initialPayload);
  }, [initialPayload]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    if (!supabase || !payload.activeWeek?.id) {
      return undefined;
    }

    const channel = supabase
      .channel(`green-cup-week-${payload.activeWeek.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "weekly_scores"
        },
        () => refreshDashboard(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [payload.activeWeek?.id]);

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <DashboardContent
      payload={payload}
      viewer={viewer}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onRefresh={refreshDashboard}
      onSignOut={handleSignOut}
    />
  );
}
