"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import BorderGlow from "@/components/BorderGlow";

const criteria = [
  {
    parameter: "Electricity",
    source: "EMD",
    scoring:
      "Consumption (10): relative - lowest per-capita monthly consumption scores highest",
    weight: "10"
  },
  {
    parameter: "Water",
    source: "Hostel / Sustainability Cell",
    scoring:
      "Overflow sensors (5): ratio of working sensors to tanks; penalty when none installed",
    weight: "5"
  },
  {
    parameter: "Waste",
    source: "PHO",
    scoring:
      "Mess waste (10): relative - lowest per-capita mess waste scores highest\nFood Waste App + staff training (5): 5 if app used regularly, else 0\nFour-bin mess segregation (5): 5 if implemented, else 0\nSegregation signage (5): share of dustbins with proper signage\nWaste-reduction initiative (5): 5 if at least one, else 0",
    weight: "30"
  },
  {
    parameter: "Representation",
    source: "Sustainability Cell",
    scoring:
      "Sustainability secretary (5): 5 if appointed, else 0\nRegular meets (10): attendance ratio in monthly meets\nPilot involvement (5): 5 if a pilot/suggestion held per sem, else 0",
    weight: "20"
  },
  {
    parameter: "Events (Individual Participation)",
    source: "Sustainability Cell",
    scoring:
      "Individual participation (25): performance (Winner 100, -10 per placement) + participation % , weighted to 25\nGreen Score Calculator (5): residents who used it / total residents × 5",
    weight: "30"
  },
  {
    parameter: "Attendance (GC Opening Ceremony)",
    source: "Sustainability Cell",
    scoring: "Representatives attending / total hostel students, scaled to 5 points",
    weight: "5"
  },
  {
    parameter: "Extras",
    source: "Impact reports + valid proofs",
    scoring:
      "SOP-listed initiatives: 3 points each\nNew/unique initiatives: up to 5 points each (subjective)",
    weight: "Bonus"
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
