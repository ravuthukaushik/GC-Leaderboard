"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Lock, UploadCloud } from "lucide-react";

const initialForm = {
  weekId: "",
  hostelId: "",
  electricityKwh: "",
  wastedFoodKg: "",
  hostelWasteKg: "",
  segregationStatus: "segregated",
  eventsCount: "0",
  orientationAttendance: "",
  notes: ""
};

export default function AdminPanel({ payload, viewer, onSubmitted }) {
  const [form, setForm] = useState({
    ...initialForm,
    weekId: payload.activeWeek.id
  });
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const departments = useMemo(
    () => [
      {
        name: "PHO",
        copy: "Can upload wasted food in mess, mess waste segregation, and hostel waste."
      },
      {
        name: "EMD",
        copy: "Can upload electricity usage for each hostel."
      },
      {
        name: "Admin",
        copy: "Can edit weekly fields flexibly and manage hostel-level student strength."
      }
    ],
    [],
  );

  const permissions = viewer?.permissions?.editableFields || [];
  const roleLabel = viewer?.permissions?.label || "Viewer";
  const isAdminUser = viewer?.role === "admin";

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const response = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          weekId: form.weekId,
          hostelId: form.hostelId,
          electricityKwh: form.electricityKwh === "" ? undefined : Number(form.electricityKwh),
          wastedFoodKg: form.wastedFoodKg === "" ? undefined : Number(form.wastedFoodKg),
          hostelWasteKg: form.hostelWasteKg === "" ? undefined : Number(form.hostelWasteKg),
          segregationStatus: form.segregationStatus,
          eventsCount: form.eventsCount === "" ? undefined : Number(form.eventsCount),
          orientationAttendance:
            form.orientationAttendance === "" ? undefined : Number(form.orientationAttendance),
          notes: form.notes
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Something went wrong.");
        return;
      }

      setMessage("Weekly data saved and leaderboard recalculated.");
      setForm((current) => ({
        ...initialForm,
        weekId: current.weekId
      }));
      onSubmitted();
    });
  };

  if (!viewer?.isAdmin) {
    return (
      <section className="locked-panel">
        <div className="feature-icon">
          <Lock size={18} />
        </div>
        <h3>Admin access required</h3>
        <p>
          The public leaderboard stays open, but weekly submissions require a PHO,
          EMD, or Admin account.
        </p>
        <Link href="/auth" className="primary-button">
          Open admin login
        </Link>
      </section>
    );
  }

  return (
    <section className="panel-stack">
      <div className="insight-grid">
        {departments.map((department) => (
          <article key={department.name} className="insight-card">
            <p className="eyebrow">Department feed</p>
            <h3>{department.name}</h3>
            <p>{department.copy}</p>
          </article>
        ))}
      </div>

      <section className="admin-form-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Submit Weekly Data</p>
            <h3>{roleLabel} upload console</h3>
          </div>
          <div className="live-pill">
            <UploadCloud size={14} />
            Your account can edit only assigned fields
          </div>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            <span>Reporting week</span>
            <select value={form.weekId} onChange={(event) => handleChange("weekId", event.target.value)} required>
              {payload.weeks.map((week) => (
                <option key={week.id} value={week.id}>
                  {week.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Hostel</span>
            <select value={form.hostelId} onChange={(event) => handleChange("hostelId", event.target.value)} required>
              <option value="">Select hostel</option>
              {payload.hostels.map((hostel) => (
                <option key={hostel.id} value={hostel.id}>
                  {hostel.name}
                </option>
              ))}
            </select>
          </label>

          {permissions.includes("electricityKwh") ? (
            <label>
              <span>Electricity usage (kWh)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.electricityKwh}
                onChange={(event) => handleChange("electricityKwh", event.target.value)}
                placeholder="e.g. 12600"
                required={!isAdminUser}
              />
            </label>
          ) : null}

          {permissions.includes("wastedFoodKg") ? (
            <label>
              <span>Wasted food in mess (kg)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.wastedFoodKg}
                onChange={(event) => handleChange("wastedFoodKg", event.target.value)}
                placeholder="e.g. 38"
                required={!isAdminUser}
              />
            </label>
          ) : null}

          {permissions.includes("hostelWasteKg") ? (
            <label>
              <span>Hostel waste (kg)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.hostelWasteKg}
                onChange={(event) => handleChange("hostelWasteKg", event.target.value)}
                placeholder="e.g. 84"
                required={!isAdminUser}
              />
            </label>
          ) : null}

          {permissions.includes("segregationStatus") ? (
            <label>
              <span>Mess waste segregation</span>
              <select
                value={form.segregationStatus}
                onChange={(event) => handleChange("segregationStatus", event.target.value)}
              >
                <option value="segregated">Well segregated</option>
                <option value="partial">Partially segregated</option>
                <option value="not_segregated">Not segregated</option>
              </select>
            </label>
          ) : null}

          {permissions.includes("eventsCount") ? (
            <label>
              <span>Events / ZWDs</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.eventsCount}
                onChange={(event) => handleChange("eventsCount", event.target.value)}
                placeholder="0, 1, 2..."
                required={!isAdminUser}
              />
            </label>
          ) : null}

          {permissions.includes("orientationAttendance") ? (
            <label>
              <span>Green Cup orientation attendance</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.orientationAttendance}
                onChange={(event) => handleChange("orientationAttendance", event.target.value)}
                placeholder="e.g. 74"
                required={!isAdminUser}
              />
            </label>
          ) : null}

          <label className="span-2">
            <span>Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => handleChange("notes", event.target.value)}
              placeholder="Optional notes from the department upload"
              rows={4}
            />
          </label>

          <div className="form-actions span-2">
            <button type="submit" className="primary-button" disabled={isPending}>
              {isPending ? "Saving..." : "Save weekly submission"}
            </button>
            {message ? <p className="status-note">{message}</p> : null}
          </div>
        </form>
      </section>
    </section>
  );
}
