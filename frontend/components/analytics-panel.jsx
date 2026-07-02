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

function AnalyticsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <div className="chart-tooltip-values">
        {payload.map((item) => (
          <div key={item.dataKey} className="chart-tooltip-row">
            <span className="chart-tooltip-key">
              <i style={{ background: item.color || item.fill }} />
              {item.name || item.dataKey}
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
  const axisStroke = "#5f716d";
  const gridStroke = "rgba(22, 55, 47, 0.12)";
  const comparison = useMemo(() => {
    const left = payload.leaderboard.find((item) => item.hostelId === leftHostel);
    const right = payload.leaderboard.find((item) => item.hostelId === rightHostel);

    if (!left || !right) return [];

    return [
      { metric: "Total", [left.name]: left.totalScore, [right.name]: right.totalScore },
      { metric: "Electricity", [left.name]: left.electricityScore, [right.name]: right.electricityScore },
      { metric: "Waste", [left.name]: left.wasteScore, [right.name]: right.wasteScore },
      { metric: "Events", [left.name]: left.energyScore, [right.name]: right.energyScore }
    ];
  }, [leftHostel, payload.leaderboard, rightHostel]);

  return (
    <section className="panel-stack">
      <div className="chart-grid">
        <BorderGlow
          className="glow-surface"
          edgeSensitivity={24}
          glowColor="205 62 72"
          backgroundColor="rgba(255,255,255,0.82)"
          borderRadius={22}
          glowRadius={24}
          glowIntensity={0.56}
          coneSpread={22}
          colors={["#79b5e8", "#9bcc56", "#5ec1a4"]}
          fillOpacity={0.18}
        >
          <motion.article
            className="chart-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Lifetime Trend</p>
                <h3>Weekly movement across the full Green Cup timeline</h3>
              </div>
            </div>
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={payload.trends}>
                  <defs>
                    <linearGradient id="lineAverage" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#efe9dd" stopOpacity="0.98" />
                      <stop offset="100%" stopColor="#bfdcca" stopOpacity="0.98" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="label" stroke={axisStroke} tick={{ fill: axisStroke }} />
                  <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} domain={[0, 100]} />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="averageScore"
                    stroke="url(#lineAverage)"
                    strokeWidth={4}
                    strokeDasharray="8 6"
                    dot={{ r: 4 }}
                    name="Monthly average"
                    isAnimationActive
                    animationDuration={420}
                  />
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
          backgroundColor="rgba(255,255,255,0.82)"
          borderRadius={22}
          glowRadius={24}
          glowIntensity={0.56}
          coneSpread={22}
          colors={["#9bcc56", "#79b5e8", "#5ec1a4"]}
          fillOpacity={0.18}
        >
          <motion.article
            className="chart-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: "easeInOut" }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Current Snapshot</p>
                <h3>Latest week basket contribution by hostel</h3>
              </div>
            </div>
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={payload.breakdown}>
                  <defs>
                    <linearGradient id="barElectricity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4dc68a" />
                      <stop offset="100%" stopColor="#2c8f61" />
                    </linearGradient>
                    <linearGradient id="barWaste" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f0b351" />
                      <stop offset="100%" stopColor="#d8891a" />
                    </linearGradient>
                    <linearGradient id="barEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8bc4eb" />
                      <stop offset="100%" stopColor="#5a9dd0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="name" stroke={axisStroke} tick={{ fill: axisStroke }} />
                  <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} domain={[0, 100]} />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Legend />
                  <Bar dataKey="electricity" stackId="a" fill="url(#barElectricity)" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={380} />
                  <Bar dataKey="waste" stackId="a" fill="url(#barWaste)" isAnimationActive animationDuration={420} />
                  <Bar dataKey="energy" stackId="a" fill="url(#barEvents)" isAnimationActive animationDuration={460} name="Events" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.article>
        </BorderGlow>
      </div>

      <BorderGlow
        className="glow-surface"
        edgeSensitivity={26}
        glowColor="190 55 70"
        backgroundColor="rgba(255,255,255,0.82)"
        borderRadius={24}
        glowRadius={26}
        glowIntensity={0.62}
        coneSpread={24}
        colors={["#79b5e8", "#5ec1a4", "#9bcc56"]}
        fillOpacity={0.18}
      >
        <motion.section
          className="compare-card"
          initial={{ opacity: 0, y: 18 }}
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
                {payload.leaderboard.map((hostel) => (
                  <option key={hostel.hostelId} value={hostel.hostelId}>
                    {hostel.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Hostel B</span>
              <select value={rightHostel} onChange={(event) => setRightHostel(event.target.value)}>
                {payload.leaderboard.map((hostel) => (
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
                    <stop offset="0%" stopColor="#7dd7a4" />
                    <stop offset="100%" stopColor="#52ae7a" />
                  </linearGradient>
                  <linearGradient id="compareRight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#af95ef" />
                    <stop offset="100%" stopColor="#8164cf" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="metric" stroke={axisStroke} tick={{ fill: axisStroke }} />
                <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} domain={[0, 100]} />
                <Tooltip content={<AnalyticsTooltip />} />
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
