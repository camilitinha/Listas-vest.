function embaralhar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
async function gerarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const input = document.getElementById("exercicios").value;
  let linhas = input.split("\n");
  let questoes = linhas.map(linha => {
    let partes = linha.split("|");
    return {
      pergunta: partes[0],
      resposta: partes[1]
    };
  });
  questoes = embaralhar(questoes);
  let y = 10;
  doc.text("Lista de Exercícios", 10, y);
  y += 10;
  questoes.forEach((q, index) => {
    doc.text(`${index + 1}. ${q.pergunta}`, 10, y);
    y += 10;
  });
  doc.addPage();
  y = 10;
  doc.text("Gabarito", 10, y);
  y += 10;
  questoes.forEach((q, index) => {
    doc.text(`${index + 1}. ${q.resposta}`, 10, y);
    y += 10;
  });
  doc.save("lista.pdf");
}
