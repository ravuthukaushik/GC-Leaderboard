"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import BorderGlow from "@/components/BorderGlow";
import TrophyMark from "@/components/trophy-mark";

// Green Cup roll of honour, newest year first.
const pastWinners = [
  { year: "2025-26", hostel: "Hostel 18" },
  { year: "2024-25", hostel: "Hostel 5" },
  { year: "2023-24", hostel: "Hostel 1" }
];

export default function PastWinners() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <BorderGlow
      className="glow-surface judging-glow-wrap"
      borderRadius={28}
      colors={["#B8904A", "#22C55E"]}
      backgroundColor="var(--glass-bg)"
    >
      <motion.section
        className="judging-section winners-section"
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
          <div className="judging-trigger-left winners-trigger-left">
            <TrophyMark size={26} className="winners-trophy" />
            <h3>Previous Years&rsquo; Winners</h3>
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
                <ol className="winners-list">
                  {pastWinners.map((item, index) => (
                    <motion.li
                      key={item.year}
                      className="winners-row"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                    >
                      <span className="winners-year">{item.year}</span>
                      <span className="winners-rule" aria-hidden="true" />
                      <span className="winners-hostel">
                        <TrophyMark size={17} className="winners-row-trophy" />
                        {item.hostel}
                      </span>
                    </motion.li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </BorderGlow>
  );
}
