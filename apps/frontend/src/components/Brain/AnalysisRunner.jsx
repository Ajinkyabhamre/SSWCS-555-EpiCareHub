import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

/**
 * AnalysisRunner Component
 *
 * Provides UI for triggering the HUMAN_MTL pipeline from the frontend.
 *
 * Features:
 * - Lists available demo datasets
 * - "Run Analysis" button
 * - Shows loading state while pipeline runs
 * - Polls for completion
 * - Notifies parent when complete
 *
 * Usage:
 * <AnalysisRunner
 *   patientId="64a1b2c3..."
 *   onAnalysisComplete={() => window.location.reload()}
 * />
 */
const AnalysisRunner = ({ patientId, onAnalysisComplete }) => {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch available datasets on mount
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/analysis/datasets`);
        if (response.data.success) {
          setDatasets(response.data.datasets);
          // Auto-select the first validated dataset
          const validatedDataset = response.data.datasets.find(d => d.validated);
          if (validatedDataset) {
            setSelectedDataset(validatedDataset.sessionKey);
          }
        }
      } catch (err) {
        console.error("[AnalysisRunner] Error fetching datasets:", err);
        setError("Failed to load available datasets");
      }
    };

    fetchDatasets();
  }, [API_BASE_URL]);

  // Cleanup poll interval on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  /**
   * Generate a unique uploadId for this analysis run
   */
  const generateUploadId = (sessionKey) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const shortKey = sessionKey.replace("Data_Subject_", "S").replace("_Session_", "_");
    return `human-mtl-${shortKey}-${timestamp}`;
  };

  /**
   * Start the HUMAN_MTL pipeline
   */
  const handleRunAnalysis = async () => {
    if (!selectedDataset) {
      setError("Please select a dataset");
      return;
    }

    setError(null);
    setLoading(true);
    setProgress("Starting HUMAN_MTL pipeline...");

    const uploadId = generateUploadId(selectedDataset);

    try {
      // Step 1: Call backend to start Python pipeline
      const response = await axios.post(`${API_BASE_URL}/api/analysis/run-human-mtl`, {
        patientId,
        uploadId,
        sessionKey: selectedDataset
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to start pipeline");
      }

      console.log("[AnalysisRunner] Pipeline started:", response.data);
      setProgress("Pipeline running in background... Waiting for completion...");

      // Step 2: Poll for completion
      startPolling(patientId, uploadId);

    } catch (err) {
      console.error("[AnalysisRunner] Error starting pipeline:", err);
      setError(err.response?.data?.error || err.message);
      setLoading(false);
      setProgress(null);
    }
  };

  /**
   * Poll /patients/:patientId/studies to check if study is complete
   */
  const startPolling = (patientId, uploadId) => {
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts * 5s = 5 minutes max
    const pollIntervalMs = 5000; // Poll every 5 seconds

    const interval = setInterval(async () => {
      attempts++;

      try {
        // Fetch all studies for this patient
        const response = await axios.get(`${API_BASE_URL}/patients/${patientId}/studies`);

        if (!response.data.success) {
          throw new Error("Failed to fetch studies");
        }

        const studies = response.data.studies || [];

        // Find our study by uploadId
        const study = studies.find(s => s.uploadId === uploadId);

        if (study) {
          console.log(`[AnalysisRunner] Poll attempt ${attempts}: study found with status ${study.status}`);

          if (study.status === "COMPLETED") {
            // Success!
            clearInterval(interval);
            setPollInterval(null);
            setProgress("Analysis complete! 🎉");
            setLoading(false);

            // Notify parent after a short delay to show success message
            setTimeout(() => {
              onAnalysisComplete(study);
            }, 1500);

            return;
          } else if (study.status === "FAILED") {
            // Failed
            clearInterval(interval);
            setPollInterval(null);
            setError(study.errorMessage || "Pipeline failed");
            setLoading(false);
            setProgress(null);
            return;
          } else {
            // Still processing
            setProgress(`Pipeline ${study.status.toLowerCase()}... (${attempts}/${maxAttempts})`);
          }
        } else {
          console.log(`[AnalysisRunner] Poll attempt ${attempts}: study not found yet`);
          setProgress(`Waiting for pipeline to start... (${attempts}/${maxAttempts})`);
        }

        // Timeout after max attempts
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPollInterval(null);
          setError("Timeout: Pipeline did not complete within 5 minutes");
          setLoading(false);
          setProgress(null);
        }

      } catch (err) {
        console.error("[AnalysisRunner] Poll error:", err);
        // Don't stop polling on network errors - retry
        setProgress(`Polling... (${attempts}/${maxAttempts})`);
      }
    }, pollIntervalMs);

    setPollInterval(interval);
  };

  /**
   * Cancel the current analysis
   */
  const handleCancel = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    setLoading(false);
    setProgress(null);
    setError(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
          Run Demo Analysis
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Trigger the HUMAN_MTL pipeline on a demo dataset. Results will appear in the tabs above.
        </p>
      </div>

      {/* Dataset Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Select Demo Dataset
        </label>
        <select
          value={selectedDataset}
          onChange={(e) => setSelectedDataset(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600"
        >
          {datasets.length === 0 && (
            <option>Loading datasets...</option>
          )}
          {datasets.map((dataset) => (
            <option key={dataset.sessionKey} value={dataset.sessionKey}>
              {dataset.displayName} {dataset.validated ? "✓" : ""}
            </option>
          ))}
        </select>
        {selectedDataset && datasets.length > 0 && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {datasets.find(d => d.sessionKey === selectedDataset)?.description}
          </p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-300 font-semibold mb-1">Error</p>
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Progress Display */}
      {loading && progress && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-sm text-blue-800 dark:text-blue-300">{progress}</p>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            This may take 1-3 minutes depending on system performance.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleRunAnalysis}
          disabled={loading || !selectedDataset}
          className="flex-1 px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white font-medium rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Running..." : "Run Analysis"}
        </button>

        {loading && (
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Help Text */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <strong>How it works:</strong> This triggers the Python pipeline in the backend, which processes the
          .h5 file, computes electrode activity, generates MNE brain snapshots, and creates the WebGL overlay JSON.
          Results will be POSTed to the backend and appear in the tabs above once complete.
        </p>
      </div>
    </div>
  );
};

AnalysisRunner.propTypes = {
  patientId: PropTypes.string.isRequired,
  onAnalysisComplete: PropTypes.func.isRequired,
};

export default AnalysisRunner;
