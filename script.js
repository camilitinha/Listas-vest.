/* ===== Estado global ===== */
let modo = 'simples';
let idxSimples = 0;
let idxAlt = 0;
/* ===== Troca de abas ===== */
function switchTab(t) {
  modo = t;
  document.querySelectorAll('.tab').forEach((b, i) => {
    b.classList.toggle('active', (i === 0 && t === 'simples') || (i === 1 && t === 'alternativas'));
  });
  document.getElementById('pane-simples').classList.toggle('active', t === 'simples');
  document.getElementById('pane-alternativas').classList.toggle('active', t === 'alternativas');
}
/* ===== Adicionar questão simples ===== */
function addSimples() {
  const id = idxSimples++;
  const container = document.getElementById('lista-simples');
  const div = document.createElement('div');
  div.id = 's' + id;
  div.className = 'row-simples';
  div.innerHTML = `
    <input class="q-input" placeholder="Enunciado da questão..." id="sq${id}" />
    <select id="sr${id}">
      <option value="Certo">Certo</option>
      <option value="Errado">Errado</option>
    </select>
    <button class="btn-del" onclick="document.getElementById('s${id}').remove()" title="Remover">×</button>
  `;
  container.appendChild(div);
}
/* ===== Adicionar questão de múltipla escolha ===== */
function addAlternativa() {
  const id = idxAlt++;
  const container = document.getElementById('lista-alt');
  const div = document.createElement('div');
  div.id = 'a' + id;
  div.className = 'bloco-alt';
  div.innerHTML = `
    <div class="bloco-alt-header">
      <input class="q-input" placeholder="Enunciado da questão..." id="aq${id}" style="flex:1;background:#fff;" />
      <button class="btn-del" onclick="document.getElementById('a${id}').remove()" title="Remover">×</button>
    </div>
    <div class="alts-grid">
      ${['A', 'B', 'C', 'D'].map(l => `
        <span class="alt-letra">${l}</span>
        <input class="alt-input" id="aa${id}${l}" placeholder="Alternativa ${l}..." oninput="highlightCorrect(${id})" />
      `).join('')}
    </div>
    <div class="correta-row">
      <label>Correta:</label>
      <select id="ac${id}" onchange="highlightCorrect(${id})" style="width:80px;">
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
        <option value="D">D</option>
      </select>
    </div>
  `;
  container.appendChild(div);
  highlightCorrect(id);
}
/* ===== Destaca alternativa correta ===== */
function highlightCorrect(id) {
  const correta = document.getElementById('ac' + id)?.value;
  ['A', 'B', 'C', 'D'].forEach(l => {
    const el = document.getElementById('aa' + id + l);
    if (el) el.classList.toggle('correct', l === correta);
  });
}
/* ===== Embaralhador (Fisher-Yates) ===== */
function embaralhar(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
/* ===== Coleta questões do DOM ===== */
function coletarQuestoes() {
  const questoes = [];
  if (modo === 'simples') {
    document.querySelectorAll('[id^="sq"]').forEach(el => {
      const id = el.id.replace('sq', '');
      const p = el.value.trim();
      const r = document.getElementById('sr' + id)?.value || '';
      if (p) questoes.push({ pergunta: p, resposta: r, tipo: 'simples' });
    });
  } else {
    document.querySelectorAll('[id^="aq"]').forEach(el => {
      const id = el.id.replace('aq', '');
      const p = el.value.trim();
      const correta = document.getElementById('ac' + id)?.value || 'A';
      const alts = {};
      ['A', 'B', 'C', 'D'].forEach(l => {
        alts[l] = document.getElementById('aa' + id + l)?.value.trim() || '';
      });
      if (p) questoes.push({ pergunta: p, alternativas: alts, resposta: correta, tipo: 'alt' });
    });
  }
  return questoes;
}
/* ===== Geração do PDF ===== */
function gerarPDF() {
  const { jsPDF } = window.jspdf;
  const titulo = document.getElementById('titulo').value || 'Lista de Exercícios';
  const disciplina = document.getElementById('disciplina').value;
  const banca = document.getElementById('banca').value;
  const statusEl = document.getElementById('status');
  let questoes = coletarQuestoes();
  if (questoes.length === 0) {
    statusEl.textContent = 'Adicione ao menos uma questão!';
    statusEl.className = 'status erro';
    return;
  }
  questoes = embaralhar(questoes);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, ML = 15, MR = 15, TW = W - ML - MR;
  const COR_VERDE = [30, 158, 117];
  const COR_BORDA = [220, 220, 220];
  let pageNum = 1;
  let y = 0;
  /* --- Cabeçalho de página --- */
  function renderHeader(label) {
    doc.setFillColor(...COR_VERDE);
    doc.rect(ML, 10, TW, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(titulo.toUpperCase(), ML + 4, 16.5);
    const meta = [disciplina, banca].filter(Boolean).join(' · ');
    if (meta) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(meta, W - MR - 2, 16.5, { align: 'right' });
    }
    doc.setFillColor(245, 245, 245);
    doc.rect(ML, 21, TW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(label, ML + 4, 26);
  }
  /* --- Rodapé de página --- */
  function renderFooter(total) {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${pageNum}`, W / 2, 292, { align: 'center' });
    if (total !== undefined) doc.text(`Total: ${total} questões`, ML, 292);
  }
  /* --- Verifica espaço e quebra página se necessário --- */
  function checkPage(needed, headerLabel) {
    if (y + needed > 280) {
      renderFooter();
      doc.addPage();
      pageNum++;
      renderHeader(headerLabel + ' (cont.)');
      y = 30;
    }
  }
  /* ========== PÁGINA DE QUESTÕES ========== */
  renderHeader('Lista de Questões');
  y = 30;
  if (modo === 'simples') {
    /* Cabeçalho da tabela */
    doc.setFillColor(240, 240, 240);
    doc.rect(ML, y, TW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Nº', ML + 3, y + 5);
    doc.text('Questão', ML + 18, y + 5);
    y += 7;
    questoes.forEach((q, i) => {
      const linhas = doc.splitTextToSize(q.pergunta, TW - 26);
      const h = Math.max(8, linhas.length * 5 + 4);
      checkPage(h, 'Lista de Questões');
      if (i % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(ML, y, TW, h, 'F');
      }
      doc.setDrawColor(...COR_BORDA);
      doc.rect(ML, y, TW, h);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...COR_VERDE);
      doc.text(String(i + 1), ML + 5, y + h / 2 + 3);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(linhas, ML + 18, y + h / 2 + 3 - (linhas.length - 1) * 2.5);
      y += h;
    });
  } else {
    questoes.forEach((q, i) => {
      const linhas = doc.splitTextToSize(q.pergunta, TW - 16);
      const nAlts = Object.values(q.alternativas).filter(v => v).length;
      const h = Math.max(14, linhas.length * 5 + nAlts * 6 + 12);
      checkPage(h + 4, 'Lista de Questões');
      doc.setFillColor(252, 252, 252);
      doc.setDrawColor(...COR_BORDA);
      doc.rect(ML, y, TW, h, 'FD');
      doc.setFillColor(...COR_VERDE);
      doc.rect(ML, y, 10, h, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(String(i + 1), ML + 5, y + h / 2 + 3, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(20, 20, 20);
      let iy = y + 6;
      doc.text(linhas, ML + 13, iy);
      iy += linhas.length * 5 + 3;
      ['A', 'B', 'C', 'D'].forEach(l => {
        const txt = q.alternativas[l];
        if (!txt) return;
        const altLinhas = doc.splitTextToSize(`${l}) ${txt}`, TW - 20);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(50, 50, 50);
        doc.text(altLinhas, ML + 14, iy);
        iy += altLinhas.length * 5 + 1;
      });
      y += h + 3;
    });
  }
  renderFooter();
  /* ========== PÁGINA DE GABARITO ========== */
  doc.addPage();
  pageNum++;
  renderHeader('Gabarito');
  y = 30;
  /* Cabeçalho da tabela do gabarito */
  doc.setFillColor(230, 248, 241);
  doc.rect(ML, y, TW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COR_VERDE);
  doc.text('Nº', ML + 3, y + 5.5);
  doc.text('Resposta', ML + 20, y + 5.5);
  y += 8;
  questoes.forEach((q, i) => {
    checkPage(8, 'Gabarito');
    if (i % 2 === 0) {
      doc.setFillColor(250, 253, 251);
      doc.rect(ML, y, TW, 8, 'F');
    }
    doc.setDrawColor(...COR_BORDA);
    doc.rect(ML, y, TW, 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COR_VERDE);
    doc.text(String(i + 1), ML + 5, y + 5.5);
    doc.setFillColor(...COR_VERDE);
    doc.roundedRect(ML + 15, y + 1.5, 20, 5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(q.resposta, ML + 25, y + 5.5, { align: 'center' });
    y += 8;
  });
  renderFooter(questoes.length);
  const nomePDF = titulo.toLowerCase().replace(/\s+/g, '-') + '.pdf';
  doc.save(nomePDF);
  statusEl.textContent = `PDF gerado com ${questoes.length} questão(ões)!`;
  statusEl.className = 'status ok';
}
/* ===== Inicializa com exemplos ===== */
addSimples();
addSimples();
addAlternativa();
