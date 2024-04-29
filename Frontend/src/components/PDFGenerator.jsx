import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PDFGenerator = ({ patient }) => {
  console.log(patient);
  const generatePDF = () => {
    const doc = new jsPDF();

    // Add text
    doc.text("Hello, this is a PDF!", 10, 10);

    // Add image
    const img = new Image();
    img.src =
      "http://localhost:1010/7b91ed7b-8417-413f-95e5-7d12a9195fe6/figures/rostral.png";
    doc.addImage(img, "PNG", 10, 20, 180, 120);

    // Add table
    // const table = document.getElementById("your-table-id");
    // html2canvas(table).then((canvas) => {
    //   const imgData = canvas.toDataURL("image/png");
    //   doc.addImage(imgData, "PNG", 10, 150);
    //   doc.save("generated.pdf");
    // });
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
