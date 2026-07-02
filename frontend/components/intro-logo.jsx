"use client";

import { motion } from "framer-motion";
import AnimatedSusLogo, { logoSpring } from "@/components/animated-sus-logo";

export default function IntroLogo() {
  return (
    <motion.div
      className="intro-logo-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      <motion.div
        className="intro-glow intro-glow-left"
        initial={{ opacity: 0, scale: 0.84 }}
        animate={{ opacity: 0.7, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      <motion.div
        className="intro-glow intro-glow-right"
        initial={{ opacity: 0, scale: 0.84 }}
        animate={{ opacity: 0.7, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7, delay: 0.08, ease: "easeInOut" }}
      />
      <motion.div
        className="intro-scan intro-scan-a"
        initial={{ x: "-120%", opacity: 0 }}
        animate={{ x: "120%", opacity: [0, 0.22, 0] }}
        transition={{ duration: 1.05, delay: 0.22, ease: "easeInOut" }}
      />
      <motion.div
        className="intro-scan intro-scan-b"
        initial={{ x: "120%", opacity: 0 }}
        animate={{ x: "-120%", opacity: [0, 0.18, 0] }}
        transition={{ duration: 1.12, delay: 0.54, ease: "easeInOut" }}
      />
      <motion.div
        className="intro-logo-shell"
        layoutId="logo"
        transition={logoSpring}
      >
        <AnimatedSusLogo animateIntro className="intro-logo-image" />
      </motion.div>
      <motion.div
        className="intro-logo-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
