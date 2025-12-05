import { useState } from "react";
import jsPDF from "jspdf";

const PDFGenerator = ({ patient, currentReport }) => {
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

  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      const doc = new jsPDF();

      // Header
      doc
        .setFont("helvetica", "bold")
        .setFontSize(16)
        .text(
          "Patient Report",
          doc.internal.pageSize.getWidth() / 2,
          20,
          { align: "center" }
        )
        .setFontSize(12)
        .setFont("helvetica", "normal");

      // Patient Information
      doc.text(`Patient Name: ${patient.firstName} ${patient.lastName}`, 10, 40);
      doc.text(`Date of Birth: ${patient.dob}`, 10, 50);
      doc.text(`Gender: ${patient.gender}`, 10, 60);
      doc.text(`Email: ${patient.email}`, 10, 70);
      doc.text(
        `Comments: ${patient.comments ? patient.comments : "No Comments"}`,
        10,
        80
      );

      // Diagnosis Badge
      if (patient.isEpilepsy) {
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(244, 63, 94); // Rose-500
        doc.rect(107, 33, 30, 10, "F");
        doc
          .setFont("helvetica", "bold")
          .text("Epilepsy", 110, 40)
          .setTextColor(0, 0, 0);
      } else {
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(16, 185, 129); // Emerald-500
        doc.rect(107, 33, 30, 10, "F");
        doc
          .setFont("helvetica", "bold")
          .text("No Epilepsy", 110, 40)
          .setTextColor(0, 0, 0);
      }

      // Add images from the current report with captions and borders
      let yPos = 10;
      let pageCount = 1;
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
      const pageHeight = doc.internal.pageSize.getHeight();

      if (currentReport && currentReport.images && currentReport.images.length > 0) {
        // Start from the second page for images
        doc.addPage();

        // Load all images as base64
        console.log("Loading images for PDF...");
        const imagePromises = currentReport.images.map(async (imageUrl, index) => {
          try {
            const base64Image = await loadImageAsBase64(imageUrl);
            return { base64Image, imageUrl, index };
          } catch (error) {
            console.error(`Failed to load image ${index}:`, error);
            return null;
          }
        });

        const loadedImages = await Promise.all(imagePromises);
        const validImages = loadedImages.filter((img) => img !== null);

        console.log(`Successfully loaded ${validImages.length} out of ${currentReport.images.length} images`);

        // Add images to PDF
        validImages.forEach(({ base64Image, imageUrl, index }) => {
          const captionText =
            views.find((view) => imageUrl.includes(view)) || `View ${index + 1}`;

          if (yPos + 130 > pageHeight) {
            doc.addPage(); // Add new page if needed
            pageCount++;
            yPos = 10; // Reset Y position for new page
          }

          // Add border and padding around the image
          doc.setLineWidth(0.5);
          doc.setDrawColor(16, 185, 129); // Emerald-500
          doc.rect(10, yPos, doc.internal.pageSize.getWidth() - 20, 110);

          try {
            // Add image in the first section (top)
            doc.addImage(
              base64Image,
              "PNG",
              15,
              yPos + 5, // Margin from the top border
              doc.internal.pageSize.getWidth() - 30,
              90 // Height of the image
            );
          } catch (error) {
            console.error("Error adding image to PDF:", error);
            // Add placeholder text if image fails
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.text(
              "Image could not be loaded",
              doc.internal.pageSize.getWidth() / 2,
              yPos + 50,
              { align: "center" }
            );
          }

          // Add caption in the second section (bottom)
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105); // Slate-600
          doc.text(
            captionText.toUpperCase(),
            doc.internal.pageSize.getWidth() / 2,
            yPos + 100,
            { align: "center" }
          );

          yPos += 130; // Space between sections
        });

        // Add page numbers
        for (let i = 1; i <= pageCount + 1; i++) {
          doc.setPage(i);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139); // Slate-500
          doc.text(
            `Page ${i} of ${pageCount + 1}`,
            doc.internal.pageSize.getWidth() - 30,
            doc.internal.pageSize.getHeight() - 10
          );
        }
      }

      // Save PDF
      const filename = `${patient.firstName}_${patient.lastName}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      console.log("PDF generated successfully:", filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again or check the console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 shadow-md shadow-emerald-600/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
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
