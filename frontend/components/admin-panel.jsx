"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Lock, UploadCloud } from "lucide-react";

// Every editable input, grouped by scoring basket. `type` drives the control.
const FIELD_GROUPS = [
  {
    title: "Electricity",
    weight: 15,
    fields: [
      { key: "electricityKwh", label: "Monthly electricity (kWh)", type: "number", step: "0.1", placeholder: "e.g. 12600" },
      { key: "electricityInitiative", label: "Hostel-wide electricity initiative held", type: "bool" }
    ]
  },
  {
    title: "Water",
    weight: 15,
    fields: [
      { key: "waterMeterInstalled", label: "Water meter installed", type: "bool" },
      { key: "overflowSensorInstalled", label: "Overflow sensors installed", type: "bool" },
      { key: "waterTanks", label: "Number of water tanks", type: "number", step: "1", placeholder: "e.g. 5" },
      { key: "workingOverflowSensors", label: "Working overflow sensors", type: "number", step: "1", placeholder: "e.g. 4" }
    ]
  },
  {
    title: "Waste",
    weight: 20,
    fields: [
      { key: "messWasteKg", label: "Daily mess waste (kg)", type: "number", step: "0.1", placeholder: "e.g. 38" },
      { key: "messEatingStudents", label: "Mess-eating students", type: "number", step: "1", placeholder: "e.g. 336" },
      { key: "dustbinsTotal", label: "Total food-waste dustbins", type: "number", step: "1", placeholder: "e.g. 6" },
      { key: "dustbinsWithSignage", label: "Dustbins with proper signage", type: "number", step: "1", placeholder: "e.g. 5" },
      { key: "wasteReductionInitiative", label: "Waste-reduction initiative held", type: "bool" }
    ]
  },
  {
    title: "Representation",
    weight: 20,
    fields: [
      { key: "sustainabilitySecretary", label: "Sustainability secretary appointed", type: "bool" },
      { key: "meetingsAttended", label: "Sustainability meets attended", type: "number", step: "1", placeholder: "e.g. 3" },
      { key: "meetingsTotal", label: "Total meets conducted", type: "number", step: "1", placeholder: "e.g. 4" },
      { key: "pilotInvolvement", label: "Pilot / suggestion held this sem", type: "bool" }
    ]
  },
  {
    title: "Events",
    weight: 20,
    fields: [
      { key: "eventPlacement", label: "Best placement (1 = winner, 0 = none)", type: "number", step: "1", placeholder: "1, 2, 3..." },
      { key: "participatingStudents", label: "Students who participated", type: "number", step: "1", placeholder: "e.g. 48" }
    ]
  },
  {
    title: "Attendance",
    weight: 5,
    fields: [
      { key: "ocRepresentatives", label: "Representatives at GC opening ceremony", type: "number", step: "1", placeholder: "e.g. 12" }
    ]
  },
  {
    title: "Extras (bonus)",
    weight: null,
    fields: [
      { key: "sopInitiatives", label: "Approved SOP-listed initiatives (3 pts each)", type: "number", step: "1", placeholder: "e.g. 2" },
      { key: "uniqueInitiativePoints", label: "New/unique initiative points (≤5 each)", type: "number", step: "0.5", placeholder: "e.g. 8" },
      { key: "ganeshaParticipants", label: "Ganesha workshop participants", type: "number", step: "1", placeholder: "e.g. 40" }
    ]
  }
];

const BOOL_KEYS = FIELD_GROUPS.flatMap((group) =>
  group.fields.filter((field) => field.type === "bool").map((field) => field.key),
);
const NUMBER_KEYS = FIELD_GROUPS.flatMap((group) =>
  group.fields.filter((field) => field.type === "number").map((field) => field.key),
);

const initialForm = {
  weekId: "",
  hostelId: "",
  notes: "",
  ...Object.fromEntries(NUMBER_KEYS.map((key) => [key, ""])),
  ...Object.fromEntries(BOOL_KEYS.map((key) => [key, false]))
};

export default function AdminPanel({ payload, viewer, onSubmitted }) {
  const [form, setForm] = useState({
    ...initialForm,
    weekId: payload.activeWeek.id
  });
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const permissions = viewer?.permissions?.editableFields || [];
  const roleLabel = viewer?.permissions?.label || "Viewer";

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("");

    const body = {
      weekId: form.weekId,
      hostelId: form.hostelId,
      notes: form.notes
    };
    NUMBER_KEYS.forEach((key) => {
      body[key] = form[key] === "" ? undefined : Number(form[key]);
    });
    BOOL_KEYS.forEach((key) => {
      body[key] = Boolean(form[key]);
    });

    startTransition(async () => {
      const response = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Something went wrong.");
        return;
      }

      setMessage("Data saved and leaderboard recalculated.");
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
          The public leaderboard stays open, but data submissions require an
          Admin account.
        </p>
        <Link href="/auth" className="primary-button">
          Open admin login
        </Link>
      </section>
    );
  }

  return (
    <section className="panel-stack">
      <section className="admin-form-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Submit Green Cup Data</p>
            <h3>{roleLabel} upload console</h3>
          </div>
          <div className="live-pill">
            <UploadCloud size={14} />
            Admin can edit every basket
          </div>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            <span>Reporting period</span>
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

          {FIELD_GROUPS.map((group) => {
            const visibleFields = group.fields.filter((field) => permissions.includes(field.key));
            if (!visibleFields.length) return null;

            return (
              <fieldset key={group.title} className="admin-basket span-2">
                <legend>
                  {group.title}
                  {group.weight != null ? <span className="basket-weight">{group.weight} pts</span> : null}
                </legend>
                <div className="admin-basket-grid">
                  {visibleFields.map((field) =>
                    field.type === "bool" ? (
                      <label key={field.key} className="admin-check">
                        <input
                          type="checkbox"
                          checked={Boolean(form[field.key])}
                          onChange={(event) => handleChange(field.key, event.target.checked)}
                        />
                        <span>{field.label}</span>
                      </label>
                    ) : (
                      <label key={field.key}>
                        <span>{field.label}</span>
                        <input
                          type="number"
                          min="0"
                          step={field.step}
                          value={form[field.key]}
                          onChange={(event) => handleChange(field.key, event.target.value)}
                          placeholder={field.placeholder}
                        />
                      </label>
                    ),
                  )}
                </div>
              </fieldset>
            );
          })}

          <label className="span-2">
            <span>Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => handleChange("notes", event.target.value)}
              placeholder="Optional notes from the department upload"
              rows={3}
            />
          </label>

          <div className="form-actions span-2">
            <button type="submit" className="primary-button" disabled={isPending}>
              {isPending ? "Saving..." : "Save submission"}
            </button>
            {message ? <p className="status-note">{message}</p> : null}
          </div>
        </form>
      </section>
    </section>
  );
}
