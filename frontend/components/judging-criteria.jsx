"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <BorderGlow
      className="glow-surface judging-glow-wrap"
      borderRadius={28}
      colors={["#22C55E", "#3B82F6"]}
      backgroundColor="var(--glass-bg)"
    >
    <motion.section
      className="judging-section"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
    >
      <button
        type="button"
        className="judging-collapsible-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className="judging-trigger-left">
          <h3>Green Cup Judging Criteria</h3>
        </div>
        <ChevronDown
          size={22}
          className={`judging-chevron ${isOpen ? "judging-chevron-open" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="judging-content-wrapper"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
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
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.04 }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
    </BorderGlow>
  );
}
