async function gerarPDF() {
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  const exercicios = document.getElementById("exercicios").value;
  const gabarito = document.getElementById("gabarito").value;

  doc.setFontSize(12);

  doc.text("Lista de Exercícios", 10, 10);
  doc.text(exercicios, 10, 20);

  doc.addPage();

  doc.text("Gabarito", 10, 10);
  doc.text(gabarito, 10, 20);

  doc.save("lista.pdf");
}
