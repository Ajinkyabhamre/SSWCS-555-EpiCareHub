import { useState } from "react";
import jsPDF from "jspdf";
import axios from "axios";

const PDFGenerator = ({ patient, currentReport, study }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper function to load image and convert to base64
  const loadImageAsBase64 = async (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Handle CORS
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        try {
          const dataURL = canvas.toDataURL("image/png");
          resolve(dataURL);
        } catch (error) {
          console.error("Error converting image to base64:", error);
          reject(error);
        }
      };
      img.onerror = (error) => {
        console.error("Error loading image:", url, error);
        reject(error);
      };
      img.src = url;
    });
  };

  // Helper to fetch and parse webglOverlay JSON
  const fetchOverlayData = async (overlayUrl) => {
    try {
      const response = await axios.get(overlayUrl);
      return response.data;
    } catch (error) {
      console.error("Error fetching overlay data:", error);
      return null;
    }
  };

  // Helper to wrap text in PDF
  const addWrappedText = (doc, text, x, y, maxWidth, lineHeight) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * lineHeight);
  };

  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // ========================================
      // PAGE 1: Patient Information
      // ========================================

      // Header
      doc
        .setFont("helvetica", "bold")
        .setFontSize(18)
        .setTextColor(16, 185, 129) // Emerald-500
        .text("EpiCareHub Clinical Report", pageWidth / 2, yPos, { align: "center" });

      yPos += 10;
      doc
        .setFontSize(10)
        .setFont("helvetica", "normal")
        .setTextColor(100, 116, 139) // Slate-500
        .text(
          `Generated on ${new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`,
          pageWidth / 2,
          yPos,
          { align: "center" }
        );

      yPos += 15;

      // Patient Information Section
      doc.setFontSize(14).setFont("helvetica", "bold").setTextColor(0, 0, 0);
      doc.text("Patient Information", 15, yPos);
      yPos += 8;

      doc.setFontSize(11).setFont("helvetica", "normal");
      doc.text(`Name: ${patient.firstName} ${patient.lastName}`, 15, yPos);
      yPos += 6;
      doc.text(`Date of Birth: ${patient.dob}`, 15, yPos);
      yPos += 6;
      doc.text(`Gender: ${patient.gender}`, 15, yPos);
      yPos += 6;
      doc.text(`Email: ${patient.email}`, 15, yPos);
      yPos += 6;
      doc.text(`Patient ID: ${patient._id?.slice(-12) || "N/A"}`, 15, yPos);
      yPos += 10;

      // Diagnosis Badge
      if (patient.isEpilepsy !== undefined) {
        doc.setFont("helvetica", "bold");
        if (patient.isEpilepsy) {
          doc.setTextColor(255, 255, 255);
          doc.setFillColor(244, 63, 94); // Rose-500
          doc.roundedRect(15, yPos - 4, 45, 8, 2, 2, "F");
          doc.text("Epilepsy Diagnosed", 17, yPos);
        } else {
          doc.setTextColor(255, 255, 255);
          doc.setFillColor(16, 185, 129); // Emerald-500
          doc.roundedRect(15, yPos - 4, 50, 8, 2, 2, "F");
          doc.text("No Epilepsy Diagnosis", 17, yPos);
        }
        doc.setTextColor(0, 0, 0);
        yPos += 12;
      }

      // Clinical Notes
      if (patient.comments) {
        doc.setFontSize(12).setFont("helvetica", "bold");
        doc.text("Clinical Notes:", 15, yPos);
        yPos += 6;
        doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(60, 60, 60);
        yPos = addWrappedText(doc, patient.comments, 15, yPos, pageWidth - 30, 5);
        yPos += 8;
      }

      // ========================================
      // Study Information (if available)
      // ========================================
      if (study) {
        yPos += 5;
        doc.setFontSize(14).setFont("helvetica", "bold").setTextColor(0, 0, 0);
        doc.text("Study Information", 15, yPos);
        yPos += 8;

        doc.setFontSize(11).setFont("helvetica", "normal");
        doc.text(`Study Title: ${study.title || "EEG Analysis"}`, 15, yPos);
        yPos += 6;
        doc.text(`Upload ID: ${study.uploadId?.slice(-12) || "N/A"}`, 15, yPos);
        yPos += 6;
        doc.text(
          `Date: ${
            study.createdAt
              ? new Date(study.createdAt).toLocaleDateString("en-US")
              : "N/A"
          }`,
          15,
          yPos
        );
        yPos += 6;
        doc.text(`Status: ${study.status || "N/A"}`, 15, yPos);
        yPos += 6;
        if (study.metadata?.processingTime) {
          doc.text(`Processing Time: ${study.metadata.processingTime}s`, 15, yPos);
          yPos += 6;
        }
        yPos += 5;

        // Localization Summary
        if (study.summary) {
          doc.setFontSize(12).setFont("helvetica", "bold");
          doc.text("Localization Summary:", 15, yPos);
          yPos += 6;
          doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(60, 60, 60);
          yPos = addWrappedText(doc, study.summary, 15, yPos, pageWidth - 30, 5);
          yPos += 8;
        }

        // Detected Hotspots
        if (study.hotspots && study.hotspots.length > 0) {
          if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(12).setFont("helvetica", "bold").setTextColor(0, 0, 0);
          doc.text("Detected Hotspots:", 15, yPos);
          yPos += 8;

          doc.setFontSize(10).setFont("helvetica", "normal");
          study.hotspots.slice(0, 10).forEach((hotspot, index) => {
            if (yPos > pageHeight - 20) {
              doc.addPage();
              yPos = 20;
            }

            const label = hotspot.channel || hotspot.region || `Hotspot ${index + 1}`;
            const confidence = (hotspot.confidence * 100).toFixed(0);

            doc.text(`${index + 1}. ${label}: ${confidence}%`, 20, yPos);
            yPos += 5;

            if (hotspot.coordinates && hotspot.coordinates.some((c) => c !== 0)) {
              doc.setTextColor(100, 100, 100);
              doc.text(
                `   Coordinates: (${hotspot.coordinates[0].toFixed(1)}, ${hotspot.coordinates[1].toFixed(1)}, ${hotspot.coordinates[2].toFixed(1)}) mm`,
                20,
                yPos
              );
              doc.setTextColor(0, 0, 0);
              yPos += 5;
            }
          });
          yPos += 5;
        }
      }

      // ========================================
      // PAGE 2+: Brain Visualizations
      // ========================================
      if (study?.brainViews && Object.keys(study.brainViews).length > 0) {
        doc.addPage();
        yPos = 20;

        doc.setFontSize(16).setFont("helvetica", "bold").setTextColor(16, 185, 129);
        doc.text("Brain Visualizations (MNE)", pageWidth / 2, yPos, { align: "center" });
        yPos += 15;

        // Sort views in preferred order
        const preferredOrder = ["left_lateral", "right_lateral", "top", "anterior"];
        const viewEntries = Object.entries(study.brainViews).sort(([keyA], [keyB]) => {
          const indexA = preferredOrder.indexOf(keyA);
          const indexB = preferredOrder.indexOf(keyB);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return keyA.localeCompare(keyB);
        });

        // Format view names
        const formatViewName = (viewName) => {
          if (viewName === "left_lateral") return "Left Lateral View";
          if (viewName === "right_lateral") return "Right Lateral View";
          if (viewName === "top") return "Superior (Top) View";
          if (viewName === "anterior") return "Anterior View";
          return (
            viewName
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ") + " View"
          );
        };

        console.log(`Loading ${viewEntries.length} brain view images for PDF...`);

        for (const [viewName, imageUrl] of viewEntries) {
          try {
            if (yPos > pageHeight - 140) {
              doc.addPage();
              yPos = 20;
            }

            // Load image
            const base64Image = await loadImageAsBase64(imageUrl);

            // Add border
            doc.setLineWidth(0.5);
            doc.setDrawColor(16, 185, 129); // Emerald-500
            doc.rect(15, yPos, pageWidth - 30, 120);

            // Add image
            doc.addImage(base64Image, "PNG", 20, yPos + 5, pageWidth - 40, 100);

            // Add caption
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(71, 85, 105); // Slate-600
            doc.text(formatViewName(viewName), pageWidth / 2, yPos + 112, {
              align: "center",
            });

            yPos += 130;
          } catch (error) {
            console.error(`Failed to load brain view ${viewName}:`, error);
            // Add placeholder text
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text(
              `Could not load ${formatViewName(viewName)}`,
              pageWidth / 2,
              yPos + 50,
              { align: "center" }
            );
            yPos += 70;
          }
        }
      }

      // ========================================
      // Electrode Data from WebGL Overlay
      // ========================================
      if (study?.webglOverlayUrl) {
        console.log("Fetching electrode data from overlay JSON...");
        const overlayData = await fetchOverlayData(study.webglOverlayUrl);

        if (overlayData && overlayData.electrodes && overlayData.electrodes.length > 0) {
          doc.addPage();
          yPos = 20;

          doc.setFontSize(16).setFont("helvetica", "bold").setTextColor(16, 185, 129);
          doc.text("Electrode Activity Data", pageWidth / 2, yPos, { align: "center" });
          yPos += 10;

          doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(100, 116, 139);
          doc.text(
            `Showing top ${Math.min(20, overlayData.electrodes.length)} electrodes by activity`,
            pageWidth / 2,
            yPos,
            { align: "center" }
          );
          yPos += 15;

          // Sort electrodes by activity (descending)
          const sortedElectrodes = [...overlayData.electrodes].sort(
            (a, b) => (b.activity || 0) - (a.activity || 0)
          );

          // Table headers
          doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(0, 0, 0);
          doc.text("#", 15, yPos);
          doc.text("Label", 25, yPos);
          doc.text("Activity %", 70, yPos);
          doc.text("Hotspot", 100, yPos);
          doc.text("MNI Coords (mm)", 125, yPos);
          yPos += 2;

          // Table header underline
          doc.setLineWidth(0.3);
          doc.setDrawColor(200, 200, 200);
          doc.line(15, yPos, pageWidth - 15, yPos);
          yPos += 5;

          // Table rows
          doc.setFont("helvetica", "normal");
          sortedElectrodes.slice(0, 20).forEach((electrode, index) => {
            if (yPos > pageHeight - 15) {
              doc.addPage();
              yPos = 20;
            }

            doc.text(`${index + 1}`, 15, yPos);
            doc.text(electrode.label || "N/A", 25, yPos);
            doc.text(`${(electrode.activity * 100).toFixed(1)}%`, 70, yPos);
            doc.text(electrode.isHotspot ? "Yes" : "No", 100, yPos);

            if (electrode.coord_mni_mm && electrode.coord_mni_mm.length === 3) {
              doc.text(
                `(${electrode.coord_mni_mm[0].toFixed(1)}, ${electrode.coord_mni_mm[1].toFixed(1)}, ${electrode.coord_mni_mm[2].toFixed(1)})`,
                125,
                yPos
              );
            } else {
              doc.text("N/A", 125, yPos);
            }

            yPos += 6;
          });

          yPos += 10;

          // Metadata from overlay
          if (overlayData.metadata) {
            doc.setFontSize(10).setFont("helvetica", "bold");
            doc.text("Analysis Metadata:", 15, yPos);
            yPos += 6;
            doc.setFont("helvetica", "normal").setFontSize(9);
            if (overlayData.metadata.total_electrodes) {
              doc.text(`Total Electrodes: ${overlayData.metadata.total_electrodes}`, 20, yPos);
              yPos += 5;
            }
            if (overlayData.metadata.total_shafts) {
              doc.text(`Total Shafts: ${overlayData.metadata.total_shafts}`, 20, yPos);
              yPos += 5;
            }
          }
        }
      }

      // ========================================
      // Legacy: Images from currentReport
      // ========================================
      if (currentReport?.images && currentReport.images.length > 0) {
        doc.addPage();
        yPos = 20;

        doc.setFontSize(14).setFont("helvetica", "bold").setTextColor(0, 0, 0);
        doc.text("Additional Brain Images", 15, yPos);
        yPos += 10;

        const views = [
          "medial",
          "rostral",
          "caudal",
          "dorsal",
          "ventral",
          "frontal",
          "parietal",
          "axial",
          "sagittal",
          "coronal",
          "lateral",
        ];

        console.log(`Loading ${currentReport.images.length} legacy images for PDF...`);
        const imagePromises = currentReport.images.map(async (imageUrl, index) => {
          try {
            const base64Image = await loadImageAsBase64(imageUrl);
            return { base64Image, imageUrl, index };
          } catch (error) {
            console.error(`Failed to load legacy image ${index}:`, error);
            return null;
          }
        });

        const loadedImages = await Promise.all(imagePromises);
        const validImages = loadedImages.filter((img) => img !== null);

        validImages.forEach(({ base64Image, imageUrl, index }) => {
          const captionText =
            views.find((view) => imageUrl.includes(view)) || `View ${index + 1}`;

          if (yPos + 130 > pageHeight) {
            doc.addPage();
            yPos = 10;
          }

          // Add border
          doc.setLineWidth(0.5);
          doc.setDrawColor(16, 185, 129); // Emerald-500
          doc.rect(10, yPos, pageWidth - 20, 110);

          try {
            // Add image
            doc.addImage(base64Image, "PNG", 15, yPos + 5, pageWidth - 30, 90);
          } catch (error) {
            console.error("Error adding image to PDF:", error);
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.text("Image could not be loaded", pageWidth / 2, yPos + 50, {
              align: "center",
            });
          }

          // Add caption
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105); // Slate-600
          doc.text(captionText.toUpperCase(), pageWidth / 2, yPos + 100, {
            align: "center",
          });

          yPos += 130;
        });
      }

      // ========================================
      // Add page numbers to all pages
      // ========================================
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 25, pageHeight - 10);
        doc.text(
          "EpiCareHub - Confidential",
          15,
          pageHeight - 10,
          { align: "left" }
        );
      }

      // ========================================
      // Save PDF
      // ========================================
      const filename = `${patient.firstName}_${patient.lastName}_Report_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(filename);
      console.log("PDF generated successfully:", filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(
        "Failed to generate PDF. Please try again or check the console for details."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 shadow-md shadow-emerald-600/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      onClick={generatePDF}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Generating PDF...
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Report
        </>
      )}
    </button>
  );
};

export default PDFGenerator;
