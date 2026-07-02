"use client";

import { useEffect, useState, useTransition } from "react";
import { Building2, Save } from "lucide-react";

export default function HostelDataPanel({ payload, onSubmitted }) {
  const [rows, setRows] = useState(payload.hostels);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRows(payload.hostels);
  }, [payload.hostels]);

  const handleChange = (hostelId, population) => {
    setRows((current) =>
      current.map((row) =>
        row.id === hostelId ? { ...row, population } : row,
      ),
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const response = await fetch("/api/admin/hostels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          hostels: rows.map((row) => ({
            id: row.id,
            population: Number(row.population || 0)
          }))
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Could not save hostel data.");
        return;
      }

      setMessage("Hostel data updated. Future weekly calculations will use the saved student counts.");
      onSubmitted();
    });
  };

  return (
    <section className="panel-stack">
      <section className="admin-form-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Hostel Data</p>
            <h3>Base hostel information</h3>
            <p className="panel-copy">
              Save hostel student strength here once. Weekly calculations will keep using these values until you update them again.
            </p>
          </div>
          <div className="live-pill">
            <Building2 size={14} />
            Managing {rows.length} hostels
          </div>
        </div>

        <form className="hostel-data-grid" onSubmit={handleSubmit}>
          {rows.map((hostel) => (
            <article key={hostel.id} className="hostel-data-card">
              <p className="eyebrow">Hostel</p>
              <h4>{hostel.name}</h4>
              <label>
                <span>Students in hostel</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={hostel.population ?? ""}
                  onChange={(event) => handleChange(hostel.id, event.target.value)}
                  required
                />
              </label>
            </article>
          ))}

          <div className="form-actions span-2">
            <button type="submit" className="primary-button" disabled={isPending}>
              <Save size={16} />
              {isPending ? "Saving..." : "Save hostel data"}
            </button>
            {message ? <p className="status-note">{message}</p> : null}
          </div>
        </form>
      </section>
    </section>
  );
}
