import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BrainWebGLViewer from "./BrainWebGLViewer";
import AnalysisRunner from "./Brain/AnalysisRunner";

const Brain = () => {
  const { patientId, uploadId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState(null);
  const [activeTab, setActiveTab] = useState("static"); // "static" or "interactive"

  // Feature flag for WebGL brain viewer
  const ENABLE_WEBGL_BRAIN = import.meta.env.VITE_ENABLE_WEBGL_BRAIN === "true";

  // Determine if WebGL tab should be shown
  const isHumanMtlStudy = study?.metadata?.modelVersion?.includes("Human-MTL") ||
                          study?.mode === "HUMAN_MTL" ||
                          study?.pipelineMode === "HUMAN_MTL";
  const hasOverlayHint = !!study?.webglOverlayUrl;
  const showWebglTab = ENABLE_WEBGL_BRAIN && (isHumanMtlStudy || hasOverlayHint);

  // Fetch patient and study data
  useEffect(() => {
    const fetchData = async () => {
      if (!patientId || !uploadId) {
        // Demo mode - no params provided
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

        // Fetch patient data
        const patientResponse = await axios.get(`${apiUrl}/patients/${patientId}`);
        setPatient(patientResponse.data);

        // Fetch studies to find the matching one
        const studiesResponse = await axios.get(`${apiUrl}/patients/${patientId}/studies`);
        if (studiesResponse.data.success && studiesResponse.data.studies) {
          const matchingStudy = studiesResponse.data.studies.find(
            (s) => s.uploadId === uploadId
          );
          if (matchingStudy) {
            setStudy(matchingStudy);
            // Auto-select first available view (prefer left_lateral if available)
            if (matchingStudy.brainViews && Object.keys(matchingStudy.brainViews).length > 0) {
              const views = Object.keys(matchingStudy.brainViews);
              setSelectedView(views.includes('left_lateral') ? 'left_lateral' : views[0]);
            }
          } else {
            setError("No study found for this upload ID");
          }
        }
      } catch (err) {
        console.error("Error fetching brain view data:", err);
        setError(err.response?.data?.error || err.message || "Failed to load study data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId, uploadId]);

  // Handler for analysis completion - refresh page to show new results
  const handleAnalysisComplete = () => {
    console.log("[Brain] Analysis complete, reloading page...");
    window.location.reload();
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Fallback hotspots if study doesn't have them
  const hotspots = study?.hotspots?.length
    ? study.hotspots
    : [
        { region: "Left temporal lobe", confidence: 0.82 },
        { region: "Right frontal lobe", confidence: 0.65 },
      ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="rounded-3xl border border-emerald-50 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading brain view...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-emerald-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-rose-100 dark:border-rose-900 bg-white dark:bg-slate-900 p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">Unable to Load Study</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full rounded-full bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold px-6 py-3 transition-all duration-200"
          >
            Back to Patient
          </button>
        </div>
      </div>
    );
  }

  // Demo mode (no params)
  const isDemoMode = !patientId || !uploadId;
  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "Demo Patient";
  const shortUploadId = uploadId ? uploadId.slice(-8) : "demo";
  const formattedDate = study?.createdAt ? formatDate(study.createdAt) : "N/A";

  // Get brain views
  const brainViews = study?.brainViews || {};

  // Sort views in preferred order
  const preferredOrder = ['left_lateral', 'right_lateral', 'top', 'anterior'];
  const viewEntries = Object.entries(brainViews).sort(([keyA], [keyB]) => {
    const indexA = preferredOrder.indexOf(keyA);
    const indexB = preferredOrder.indexOf(keyB);

    // If both are in preferred order, sort by that order
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // If only A is in preferred order, it comes first
    if (indexA !== -1) return -1;
    // If only B is in preferred order, it comes first
    if (indexB !== -1) return 1;
    // Otherwise, sort alphabetically
    return keyA.localeCompare(keyB);
  });

  const hasBrainViews = viewEntries.length > 0;

  // Format view names
  const formatViewName = (viewName) => {
    // Handle standard view names
    if (viewName === 'left_lateral') return 'Left Lateral View';
    if (viewName === 'right_lateral') return 'Right Lateral View';
    if (viewName === 'top') return 'Superior (Top) View';
    if (viewName === 'anterior') return 'Anterior View';

    // Legacy support for old naming
    if (viewName === 'left') return 'Left Lateral View';
    if (viewName === 'right') return 'Right Lateral View';

    // Generic fallback: replace underscores with spaces and capitalize
    return viewName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + ' View';
  };

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-slate-950 px-8 py-6 flex flex-col gap-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1 uppercase tracking-wider">
            {isDemoMode ? "Brain Visualization Demo" : "ECoG Seizure Localization"}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {patientName} {!isDemoMode && `• Study ${shortUploadId}`}
          </h1>
          {!isDemoMode && (
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span>Uploaded {formattedDate}</span>
              {study?.status && (
                <>
                  <span>•</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      study.status === "COMPLETED"
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                        : study.status === "PROCESSING"
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                        : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {study.status}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => (patientId ? navigate(`/patient/${patientId}`) : navigate(-1))}
          className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-5 py-2 transition-all duration-200"
        >
          <ArrowBackIcon style={{ fontSize: "1.2rem" }} />
          Back to Patient
        </button>
      </motion.div>

      {/* Main Content Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr),minmax(0,1.1fr)] gap-6 items-start"
      >
        {/* Left: Brain Visualization */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-[0_18px_45px_rgba(15,118,110,0.08)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.5)] border border-transparent dark:border-slate-800 p-6">
          <div className="mb-4 pb-4 border-b border-emerald-50 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
              3D Brain Visualization
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {hasBrainViews
                ? "MNE-generated brain views showing electrode positions and hotspots"
                : "No 3D brain images available for this study yet"}
            </p>
          </div>

          {/* Tab UI - show for HUMAN_MTL studies or if overlay URL exists */}
          {showWebglTab && (
            <div className="mb-4 flex gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("static")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === "static"
                    ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                Static Views (MNE)
              </button>
              <button
                onClick={() => setActiveTab("interactive")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === "interactive"
                    ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                Interactive 3D (beta)
              </button>
            </div>
          )}

          {/* Static MNE Views Tab */}
          {activeTab === "static" && hasBrainViews ? (
            <div className="space-y-4">
              {/* View selector tabs */}
              {viewEntries.length > 1 && (
                <div className="flex gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
                  {viewEntries.map(([viewName]) => (
                    <button
                      key={viewName}
                      onClick={() => setSelectedView(viewName)}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        selectedView === viewName
                          ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      {formatViewName(viewName)}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected brain view image */}
              {selectedView && brainViews[selectedView] && (
                <div className="rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <img
                    src={brainViews[selectedView]}
                    alt={`${formatViewName(selectedView)}`}
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* All views grid (if only 1-2 views, show them all) */}
              {viewEntries.length <= 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewEntries.map(([viewName, url]) => (
                    <div key={viewName} className="rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {formatViewName(viewName)}
                        </h3>
                      </div>
                      <img
                        src={url}
                        alt={`${formatViewName(viewName)}`}
                        className="w-full h-auto"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "static" ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <div className="text-6xl mb-4">🧠</div>
              <p className="text-lg font-medium mb-2 text-slate-700 dark:text-slate-300">No 3D Brain Images Available</p>
              <p className="text-sm">
                {isDemoMode
                  ? "This is a demo mode. Upload a ds003029 ECoG recording to see brain visualizations."
                  : "Brain snapshots were not generated for this study. This may occur if electrode position data is unavailable."}
              </p>
            </div>
          ) : null}

          {/* Interactive WebGL Tab */}
          {activeTab === "interactive" && (
            <BrainWebGLViewer uploadId={uploadId} study={study} />
          )}
        </div>

        {/* Right: Info Panel */}
        <div className="space-y-4">
          {/* Localization Summary Card */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-[0_18px_45px_rgba(15,118,110,0.08)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.5)] border border-transparent dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Localization Summary
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {study?.summary ||
                "EEG analysis reveals potential seizure focus regions. The visualization shows areas of abnormal brain activity that may indicate epileptogenic zones. Further clinical correlation is recommended."}
            </p>
          </div>

          {/* Hotspots Card */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-[0_18px_45px_rgba(15,118,110,0.08)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.5)] border border-transparent dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Detected Hotspots
            </h3>
            <div className="space-y-3">
              {hotspots.map((hotspot, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {hotspot.channel || hotspot.region}
                    </span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {(hotspot.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 dark:bg-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${hotspot.confidence * 100}%` }}
                    />
                  </div>
                  {hotspot.coordinates && hotspot.coordinates.some(c => c !== 0) && (
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      Coords: ({hotspot.coordinates[0].toFixed(1)}, {hotspot.coordinates[1].toFixed(1)}, {hotspot.coordinates[2].toFixed(1)}) mm
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Runner - Run demo pipeline from frontend */}
          {patientId && !isDemoMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <AnalysisRunner
                patientId={patientId}
                onAnalysisComplete={handleAnalysisComplete}
              />
            </motion.div>
          )}

          {/* Metadata Card */}
          {!isDemoMode && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-[0_18px_45px_rgba(15,118,110,0.08)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.5)] border border-transparent dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Analysis Metadata
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Model Version</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {study?.metadata?.modelVersion || "ECoG-Activity-1.0"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">MNE Version</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {study?.metadata?.mneVersion || "1.x.x"}
                  </span>
                </div>
                {study?.processingTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Processing Time</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {study.processingTime}s
                    </span>
                  </div>
                )}
                {hasBrainViews && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Brain Views</span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {viewEntries.length} available
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Brain;
