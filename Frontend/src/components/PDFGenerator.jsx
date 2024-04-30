import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PDFGenerator = ({ patient, currentReport }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    doc
      .setFont("helvetica", "bold")
      .setFontSize(16)
      .text(
        "Patient Report",
        doc.internal.pageSize.getWidth() / 2,
        20,
        null,
        null,
        "center"
      )
      .setFontSize(12)
      .setFont("helvetica", "normal");

    doc.text(`Patient Name: ${patient.firstName} ${patient.lastName}`, 10, 40);
    doc.text(`Date of Birth: ${patient.dob}`, 10, 50);
    doc.text(`Gender: ${patient.gender}`, 10, 60);
    doc.text(`Email: ${patient.email}`, 10, 70);
    doc.text(
      `Comments: ${patient.comments ? patient.comments : "No Comments"}`,
      10,
      80
    );
    if (patient.isEpilepsy) {
      doc.setTextColor("#ffffff");
      doc.setFillColor("#dc3545");
      doc.rect(107, 33, 30, 10, "F");
      doc
        .setFont("helvetica", "bold")
        .text("Epilepsy", 110, 40)
        .setTextColor("#000");
    } else {
      doc.setTextColor("#ffffff");
      doc.setFillColor("#28a745");
      doc.rect(107, 33, 30, 10, "F");
      doc
        .setFont("helvetica", "bold")
        .text("No Epilepsy", 110, 40)
        .setTextColor("#000");
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
    if (currentReport) {
      // Start from the second page for images
      doc.addPage();
      currentReport?.images.forEach((imageUrl, index) => {
        const captionText =
          views.find((view) => imageUrl.includes(view)) || "Unknown View";
        if (yPos + 130 > pageHeight) {
          doc.addPage(); // Add new page if needed
          pageCount++;
          yPos = 10; // Reset Y position for new page
        }

        // Add border and padding around the image
        doc.setLineWidth(1);
        doc.rect(10, yPos, doc.internal.pageSize.getWidth() - 20, 110);

        // Add image in the first section (top)
        doc.addImage(
          imageUrl,
          "PNG",
          15,
          yPos + 5, // Margin from the top border
          doc.internal.pageSize.getWidth() - 30,
          90 // Height of the image
        );

        // Add caption in the second section (bottom)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(
          captionText,
          doc.internal.pageSize.getWidth() / 2,
          yPos + 100,
          {
            align: "center",
          }
        );

        yPos += 130; // Space between sections
      });
      for (let i = 1; i <= pageCount + 1; i++) {
        doc.setPage(i);
        doc.text(
          `Page ${i} of ${pageCount + 1}`,
          doc.internal.pageSize.getWidth() - 30,
          doc.internal.pageSize.getHeight() - 10
        );
      }
    }

    // Save PDF
    doc.save(`${patient.firstName}_${patient.lastName}_Report`);
  };

  return (
    <button
      className="bg-eh-4 h-fit hover:bg-eh-3 text-white font-bold py-2 px-4 rounded"
      onClick={() => generatePDF()}
    >
      Download Patient Report
    </button>
  );
};

export default PDFGenerator;
