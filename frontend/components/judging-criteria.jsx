"use client";

import { motion } from "framer-motion";
import BorderGlow from "@/components/BorderGlow";

const criteria = [
  {
    parameter: "Wasted Food in Mess",
    source: "PHO",
    scoring: "Rank-based scoring",
    weight: "20%"
  },
  {
    parameter: "Mess Waste Segregation",
    source: "PHO and Biogas plant",
    scoring:
      "100 - Well segregated\n50 - Partially segregated\n0 - Not segregated\nWill be decided by PHO at the time of waste collection",
    weight: "15%"
  },
  {
    parameter: "Hostel Waste",
    source: "PHO",
    scoring: "Rank-based scoring",
    weight: "10%"
  },
  {
    parameter: "Electricity Usage",
    source: "EMD",
    scoring: "Rank-based scoring",
    weight: "30%"
  },
  {
    parameter: "Events / ZWDs",
    source: "Hostel Council",
    scoring:
      "100 - Conducted >= 2 events in the month\n50 - Conducted >= 1 event in the month\n0 - No events conducted\nWill be decided by Sustainability Cell based on a report submitted by the Hostel Councils",
    weight: "20%"
  },
  {
    parameter: "Attendance in Green Cup orientation",
    source: "Sustainability Cell",
    scoring:
      "100 - Highest attendance\n75 - 2nd highest attendance\n50 - 3rd highest attendance",
    weight: "5%"
  }
];

export default function JudgingCriteria() {
  return (
    <motion.section
      className="judging-section"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
    >
      <div className="judging-header">
        <p className="eyebrow">Scoring Framework</p>
        <h2>Green Cup Judging Criteria</h2>
        <p className="judging-subtitle">
          Scoring methodology used to evaluate hostel sustainability performance
        </p>
      </div>

      <BorderGlow
        className="glow-surface"
        edgeSensitivity={22}
        glowColor="150 40 62"
        backgroundColor="rgba(255,255,255,0.9)"
        borderRadius={28}
        glowRadius={22}
        glowIntensity={0.5}
        coneSpread={20}
        colors={["#79b5e8", "#9bcc56", "#5ec1a4"]}
        fillOpacity={0.16}
      >
        <div className="judging-table-shell">
          <div className="judging-table-scroll">
            <table className="judging-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Source</th>
                  <th>Scoring</th>
                  <th>Weightage</th>
                </tr>
              </thead>
              <tbody>
                {criteria.map((item, index) => (
                  <motion.tr
                    key={item.parameter}
                    className={index % 2 === 1 ? "judging-row-alt" : ""}
                    whileHover={{ scale: 1.005 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <td className="judging-parameter">{item.parameter}</td>
                    <td>{item.source}</td>
                    <td className="judging-scoring">{item.scoring}</td>
                    <td className="judging-weight">{item.weight}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </BorderGlow>
    </motion.section>
  );
}
