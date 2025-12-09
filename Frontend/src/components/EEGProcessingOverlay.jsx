import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ErrorIcon from "@mui/icons-material/Error";

/**
 * EEGProcessingOverlay - Modern AI-agent-style progress overlay for EEG upload
 *
 * Shows a full-screen terminal-style progress indicator with staged messages,
 * animations, and automatic transitions as the EEG analysis pipeline progresses.
 */

const DEFAULT_STEPS = [
  {
    id: "upload",
    label: "Uploading EEG file",
    detail: "Securely transferring your .fif file to EpiCareHub servers",
  },
  {
    id: "preprocess",
    label: "Preprocessing EEG signal",
    detail: "Filtering 1–30 Hz, rejecting ocular and magnetic artifacts",
  },
  {
    id: "localize",
    label: "Running ConvDip neural network",
    detail: "Deep learning model analyzing 1984 cortical source locations",
  },
  {
    id: "visualize",
    label: "Reconstructing 3D brain activity",
    detail: "Generating 11 anatomical views with source estimates",
  },
  {
    id: "save",
    label: "Saving study to EpiCareHub",
    detail: "Uploading visualizations and metadata to secure cloud storage",
  },
  {
    id: "summarize",
    label: "Generating seizure localization summary",
    detail: "Computing hotspot analysis and clinical summary text",
  },
];

const EEGProcessingOverlay = ({
  open = false,
  steps = DEFAULT_STEPS,
  currentStepId = null,
  status = "PROCESSING", // "PROCESSING" | "COMPLETED" | "FAILED"
  onCancel = null,
  patientName = null,
  studyTitle = null,
  devMode = false,
}) => {
  const [visibleSteps, setVisibleSteps] = useState([]);

  // Progressively reveal steps as they become active
  useEffect(() => {
    if (!open) {
      setVisibleSteps([]);
      return;
    }

    const currentIndex = steps.findIndex((s) => s.id === currentStepId);
    if (currentIndex === -1) {
      setVisibleSteps(steps.slice(0, 1)); // Show at least first step
      return;
    }

    // Show all steps up to and including current
    const newVisibleSteps = steps.slice(0, currentIndex + 2);
    setVisibleSteps(newVisibleSteps);
  }, [open, currentStepId, steps]);

  // Compute step statuses
  const getStepStatus = (step, index) => {
    const currentIndex = steps.findIndex((s) => s.id === currentStepId);

    if (status === "COMPLETED") {
      return "done";
    }

    if (status === "FAILED") {
      if (index < currentIndex) return "done";
      if (index === currentIndex) return "error";
      return "pending";
    }

    if (index < currentIndex) return "done";
    if (index === currentIndex) return "active";
    return "pending";
  };

  // Calculate overall progress
  const calculateProgress = () => {
    if (status === "COMPLETED") return 100;
    if (status === "FAILED") return 0;

    const currentIndex = steps.findIndex((s) => s.id === currentStepId);
    if (currentIndex === -1) return 0;

    const doneSteps = currentIndex;
    const activeProgress = 0.5; // Active step is half done
    return Math.round(((doneSteps + activeProgress) / steps.length) * 100);
  };

  const progress = calculateProgress();

  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="processing-title"
        className="fixed inset-0 z-[1000] bg-emerald-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white rounded-2xl shadow-[0_24px_60px_rgba(15,118,110,0.25)] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2
                id="processing-title"
                className="text-2xl font-bold text-slate-900"
              >
                {status === "COMPLETED"
                  ? "Analysis Complete"
                  : status === "FAILED"
                  ? "Analysis Failed"
                  : "Analyzing EEG Data"}
              </h2>
              {devMode && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  DEV MODE
                </span>
              )}
            </div>

            {patientName && (
              <p className="text-sm text-slate-600">
                Patient: <span className="font-semibold">{patientName}</span>
                {studyTitle && ` • ${studyTitle}`}
              </p>
            )}

            <p className="text-sm text-slate-500 mt-2">
              {status === "COMPLETED"
                ? "Your EEG study has been successfully processed and saved."
                : status === "FAILED"
                ? "We encountered an error during processing. Please try again."
                : devMode
                ? "Using simulated EEG pipeline for rapid testing."
                : "We're analyzing the EEG recording. This typically takes 1–2 minutes."}
            </p>
          </div>

          {/* Terminal-style Progress Log */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6 min-h-[320px] max-h-[400px] overflow-y-auto font-mono text-sm">
            <div className="space-y-3">
              <AnimatePresence>
                {visibleSteps.map((step, index) => {
                  const stepStatus = getStepStatus(step, index);
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      {/* Status Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {stepStatus === "done" && (
                          <CheckCircleIcon className="text-emerald-600" style={{ fontSize: "1.25rem" }} />
                        )}
                        {stepStatus === "active" && (
                          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        )}
                        {stepStatus === "pending" && (
                          <RadioButtonUncheckedIcon className="text-slate-300" style={{ fontSize: "1.25rem" }} />
                        )}
                        {stepStatus === "error" && (
                          <ErrorIcon className="text-rose-600" style={{ fontSize: "1.25rem" }} />
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-semibold ${
                              stepStatus === "done"
                                ? "text-emerald-700"
                                : stepStatus === "active"
                                ? "text-slate-900"
                                : stepStatus === "error"
                                ? "text-rose-700"
                                : "text-slate-400"
                            }`}
                          >
                            {step.label}
                            {stepStatus === "active" && (
                              <span className="inline-block w-1.5 h-4 bg-emerald-600 ml-1 animate-pulse" />
                            )}
                          </p>
                        </div>
                        {stepStatus !== "pending" && step.detail && (
                          <p className="text-xs text-slate-500 mt-1">
                            {step.detail}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Success Message */}
              {status === "COMPLETED" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
                >
                  <p className="text-sm font-semibold text-emerald-800">
                    Study successfully saved to EpiCareHub! Redirecting...
                  </p>
                </motion.div>
              )}

              {/* Error Message */}
              {status === "FAILED" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-lg"
                >
                  <p className="text-sm font-semibold text-rose-800 mb-2">
                    Analysis failed
                  </p>
                  <p className="text-xs text-rose-600">
                    We couldn't complete this EEG analysis. Please check that the
                    ML service is running and try again.
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {status === "PROCESSING" && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                <span>Overall Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-emerald-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          {status === "FAILED" && onCancel && (
            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="rounded-full bg-slate-600 hover:bg-slate-700 text-white font-semibold px-6 py-2.5 transition-all duration-200"
              >
                Close
              </button>
            </div>
          )}

          {/* Processing Note */}
          {status === "PROCESSING" && (
            <p className="text-xs text-center text-slate-500">
              Please keep this window open. Do not refresh or navigate away.
            </p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EEGProcessingOverlay;
