/**
 * Home.jsx
 *
 * Clean, modern health-tech landing page for EpiCareHub
 * - White + light mint color scheme
 * - Static EEG brain localization illustration
 * - Feature cards, how-it-works section, footer
 * - Fully responsive, accessible design
 * - Framer Motion animations for smooth entrance and interactions
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * FeatureCard
 * Reusable feature showcase card with motion animations
 */
const FeatureCard = ({ emoji, title, description, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    viewport={{ once: true, margin: "-100px" }}
    whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(16, 185, 129, 0.15)" }}
    className="group rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all duration-200"
  >
    <motion.div
      className="text-4xl mb-4"
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {emoji}
    </motion.div>
    <h3 className="text-base font-semibold text-slate-900 mb-3">{title}</h3>
    <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
  </motion.div>
);

/**
 * StepCard
 * Workflow step in "How It Works" with motion animations
 */
const StepCard = ({ number, title, description, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.15 }}
    viewport={{ once: true, margin: "-100px" }}
    className="flex flex-col items-center text-center"
  >
    <motion.div
      className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-bold text-white shadow-md shadow-emerald-500/30"
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {number}
    </motion.div>
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    <p className="mt-2 text-xs text-slate-600 max-w-xs">{description}</p>
  </motion.div>
);

/**
 * Home Component
 * Modern health-tech landing page: white + emerald green, responsive, accessible
 */
export default function Home() {
  const currentYear = new Date().getFullYear();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-slate-900">
      {/* ============= HERO SECTION ============= */}
      <section className="bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            {/* Left Column: Text & CTAs */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="flex flex-col justify-center"
            >
              {/* Badge */}
              <motion.div
                variants={itemVariants}
                className="mb-6 inline-flex w-fit"
              >
                <motion.span
                  className="inline-flex items-center rounded-full bg-white bg-opacity-80 px-4 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  ✓ Presurgical Epilepsy Evaluation
                </motion.span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                variants={itemVariants}
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-slate-900 mb-6"
              >
                Pinpoint seizure sources with confidence.
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={itemVariants}
                className="text-lg text-slate-700 leading-relaxed mb-8 max-w-xl"
              >
                EpiCareHub empowers neurologists and neurosurgeons with interactive 3D brain visualization and AI-driven analysis to make confident surgical decisions for epilepsy patients.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Link
                    to="/signin"
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 shadow-md shadow-emerald-600/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                  >
                    Launch EpiCareHub →
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center rounded-full border-2 border-white bg-white bg-opacity-80 hover:bg-opacity-100 text-emerald-700 font-semibold px-8 py-3 shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                  >
                    Explore Dashboard
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right Column: Brain Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="hidden md:flex md:justify-center items-center"
            >
              <img
                src="/assets/homePhoto.svg"
                alt="EEG-based 3D brain localization illustration"
                className="w-full h-full object-cover drop-shadow-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============= FEATURES SECTION ============= */}
      <section className="py-16 md:py-20 bg-white border-y border-emerald-50">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              What EpiCareHub helps you do
            </h2>
            <p className="text-lg text-slate-600">
              From EEG upload to surgical planning in a single workflow.
            </p>
          </motion.div>

          {/* Feature Cards Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              emoji="🧠"
              title="3D Brain Localization"
              description="Interactive visualization of seizure sources from EEG data with multiple anatomical views."
              index={0}
            />
            <FeatureCard
              emoji="📊"
              title="Patient Management"
              description="Centralized dashboard for patient profiles, seizure history, and clinical assessments."
              index={1}
            />
            <FeatureCard
              emoji="🤖"
              title="ML-Powered Analysis"
              description="Deep learning pipeline for automated seizure source mapping from EEG signals."
              index={2}
            />
            <FeatureCard
              emoji="📄"
              title="Clinical Reports"
              description="Professional PDF reports with 3D visualizations and surgical recommendations."
              index={3}
            />
          </div>
        </div>
      </section>

      {/* ============= HOW IT WORKS ============= */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              How it works
            </h2>
          </motion.div>

          {/* Steps Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white px-8 py-12 md:px-12 md:py-16"
          >
            <div className="grid gap-8 md:gap-12 md:grid-cols-3">
              <StepCard
                number="1"
                title="Upload EEG Data"
                description="Import patient EEG recordings and neuroimaging data into the platform."
                index={0}
              />
              <StepCard
                number="2"
                title="Run Localization"
                description="Our algorithm analyzes the data and identifies potential seizure sources."
                index={1}
              />
              <StepCard
                number="3"
                title="Review & Plan"
                description="Examine 3D visualizations and generate comprehensive clinical reports."
                index={2}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============= FOOTER ============= */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="border-t border-emerald-50 bg-gradient-to-b from-white to-emerald-50 py-8 md:py-12"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0">
            {/* Left: Copyright */}
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-sm text-slate-600"
            >
              © {currentYear} EpiCareHub. All rights reserved.
            </motion.p>

            {/* Right: Links */}
            <div className="flex items-center gap-8 text-sm text-slate-600">
              <motion.a
                href="#"
                className="hover:text-emerald-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded px-2 py-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Documentation
              </motion.a>
              <motion.a
                href="#"
                className="hover:text-emerald-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded px-2 py-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Privacy
              </motion.a>
              <motion.a
                href="#"
                className="hover:text-emerald-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded px-2 py-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Contact
              </motion.a>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
