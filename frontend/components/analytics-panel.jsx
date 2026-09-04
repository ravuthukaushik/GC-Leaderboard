"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import BorderGlow from "@/components/BorderGlow";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const BASKET_LABELS = {
  resources: "Resources",
  waste: "Waste",
  community: "Community"
};

const BASKET_SWATCH_COLORS = {
  resources: "var(--color-electricity)",
  waste: "var(--color-waste)",
  community: "var(--color-events)"
};

function AnalyticsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <div className="chart-tooltip-values">
        {payload.map((item) => (
          <div key={item.dataKey} className="chart-tooltip-row">
            <span className="chart-tooltip-key">
              <i style={{ background: BASKET_SWATCH_COLORS[item.dataKey] || item.color || item.fill }} />
              {BASKET_LABELS[item.dataKey] || item.name || item.dataKey}
            </span>
            <strong>{Number(item.value).toFixed(1)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPanel({ payload }) {
  const [leftHostel, setLeftHostel] = useState(payload.leaderboard[0]?.hostelId || "");
  const [rightHostel, setRightHostel] = useState(payload.leaderboard[1]?.hostelId || "");

  // Hostels ordered numerically (1, 2, … 19, 21) for the compare dropdowns.
  const hostelsByNumber = useMemo(
    () =>
      [...payload.leaderboard].sort((a, b) => {
        const na = Number.parseInt(String(a.name).replace(/\D+/g, ""), 10);
        const nb = Number.parseInt(String(b.name).replace(/\D+/g, ""), 10);
        if (Number.isNaN(na) || Number.isNaN(nb)) {
          return String(a.name).localeCompare(String(b.name), "en", { numeric: true });
        }
        return na - nb;
      }),
    [payload.leaderboard],
  );

  const comparison = useMemo(() => {
    const left = payload.leaderboard.find((item) => item.hostelId === leftHostel);
    const right = payload.leaderboard.find((item) => item.hostelId === rightHostel);

    if (!left || !right) return [];

    return [
      { metric: "Total", [left.name]: left.totalScore, [right.name]: right.totalScore },
      { metric: "Resources", [left.name]: left.resourcesScore, [right.name]: right.resourcesScore },
      { metric: "Waste", [left.name]: left.wasteScore, [right.name]: right.wasteScore },
      { metric: "Community", [left.name]: left.communityScore, [right.name]: right.communityScore }
    ];
  }, [leftHostel, payload.leaderboard, rightHostel]);

  return (
    <section className="panel-stack">
      {/* ─── CHARTS ─── */}
      <div className="chart-grid">
        <BorderGlow
          className="glow-surface"
          edgeSensitivity={24}
          glowColor="205 62 72"
          backgroundColor="var(--glass-bg)"
          borderRadius={22}
          glowRadius={14}
          glowIntensity={0.26}
          coneSpread={22}
          colors={["#2A78D6", "#3D6B4F", "#1BAF7A"]}
          fillOpacity={0.08}
        >
          <motion.article
            className="chart-card lifetime-chart-card"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="panel-heading">
              <div>
                <h3>Lifetime Average Points Trend</h3>
              </div>
            </div>
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={payload.trends}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--chart-axis)" tick={{ fill: "var(--chart-axis)" }} />
                  <YAxis
                    stroke="var(--chart-axis)"
                    tick={{ fill: "var(--chart-axis)" }}
                    allowDecimals={false}
                    domain={[0, (dataMax) => Math.max(100, Math.ceil((dataMax || 0) / 10) * 10)]}
                  />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Legend />
                  {payload.trendSeries.map((series) => (
                    <Line
                      key={series.key}
                      type="monotone"
                      dataKey={series.key}
                      stroke={series.color}
                      strokeWidth={3.5}
                      dot={{ r: 4 }}
                      isAnimationActive
                      animationDuration={420}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.article>
        </BorderGlow>

        <BorderGlow
          className="glow-surface"
          edgeSensitivity={24}
          glowColor="37 78 70"
          backgroundColor="var(--glass-bg)"
          borderRadius={22}
          glowRadius={14}
          glowIntensity={0.26}
          coneSpread={22}
          colors={["#3D6B4F", "#2A78D6", "#1BAF7A"]}
          fillOpacity={0.08}
        >
          <motion.article
            className="chart-card snapshot-chart-card"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: "easeInOut" }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="panel-heading">
              <div>
                <h3>Current month basket contribution of each Hostel</h3>
              </div>
            </div>
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={payload.breakdown}>
                  <defs>
                    <linearGradient id="barElectricity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F92E6" />
                      <stop offset="100%" stopColor="#2A78D6" />
                    </linearGradient>
                    <linearGradient id="barWaste" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#37C793" />
                      <stop offset="100%" stopColor="#1BAF7A" />
                    </linearGradient>
                    <linearGradient id="barEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A971DA" />
                      <stop offset="100%" stopColor="#8E4EC6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--chart-axis)" tick={{ fill: "var(--chart-axis)" }} />
                  <YAxis stroke="var(--chart-axis)" tick={{ fill: "var(--chart-axis)" }} allowDecimals={false} domain={[0, 100]} />
                  <Tooltip content={<AnalyticsTooltip />} cursor={false} />
                  <Legend />
                  <Bar dataKey="resources" stackId="a" fill="url(#barElectricity)" isAnimationActive animationDuration={380} name="Resources" />
                  <Bar dataKey="waste" stackId="a" fill="url(#barWaste)" isAnimationActive animationDuration={420} name="Waste" />
                  <Bar dataKey="community" stackId="a" fill="url(#barEvents)" isAnimationActive animationDuration={460} name="Community" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.article>
        </BorderGlow>
      </div>

      {/* ─── BATTLE MODE ─── */}
      <BorderGlow
        className="glow-surface"
        edgeSensitivity={26}
        glowColor="190 55 70"
        backgroundColor="var(--glass-bg)"
        borderRadius={24}
        glowRadius={14}
        glowIntensity={0.28}
        coneSpread={24}
        colors={["#2A78D6", "#1BAF7A", "#3D6B4F"]}
        fillOpacity={0.08}
      >
        <motion.section
          className="compare-card battle-mode-card"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: "easeInOut" }}
          whileHover={{ y: -4, scale: 1.01 }}
        >
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Battle Mode</p>
              <h3>Compare any two hostels</h3>
            </div>
          </div>

          <div className="compare-controls">
            <label>
              <span>Hostel A</span>
              <select value={leftHostel} onChange={(event) => setLeftHostel(event.target.value)}>
                {hostelsByNumber.map((hostel) => (
                  <option key={hostel.hostelId} value={hostel.hostelId}>
                    {hostel.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Hostel B</span>
              <select value={rightHostel} onChange={(event) => setRightHostel(event.target.value)}>
                {hostelsByNumber.map((hostel) => (
                  <option key={hostel.hostelId} value={hostel.hostelId}>
                    {hostel.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="chart-shell">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={comparison}>
                <defs>
                  <linearGradient id="compareLeft" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4E8A66" />
                    <stop offset="100%" stopColor="#3D6B4F" />
                  </linearGradient>
                  <linearGradient id="compareRight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F92E6" />
                    <stop offset="100%" stopColor="#2A78D6" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="metric" stroke="var(--chart-axis)" tick={{ fill: "var(--chart-axis)" }} />
                <YAxis stroke="var(--chart-axis)" tick={{ fill: "var(--chart-axis)" }} allowDecimals={false} domain={[0, 100]} />
                <Tooltip content={<AnalyticsTooltip />} cursor={false} />
                <Legend />
                {comparison[0]
                  ? Object.keys(comparison[0])
                      .filter((key) => key !== "metric")
                      .map((key, index) => (
                        <Bar
                          key={key}
                          dataKey={key}
                          fill={index === 0 ? "url(#compareLeft)" : "url(#compareRight)"}
                          radius={[8, 8, 0, 0]}
                          isAnimationActive
                          animationDuration={400 + index * 60}
                        />
                      ))
                  : null}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      </BorderGlow>
    </section>
  );
}
