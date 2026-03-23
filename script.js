/* ===== Estado ===== */
let idx = 0;

/* ===== Inicialização ===== */
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('btn-add').addEventListener('click', addQuestao);
  document.getElementById('btn-pdf').addEventListener('click', gerarPDF);

  addQuestao();
  addQuestao();
});

/* ===== Adicionar questão ===== */
function addQuestao() {
  const id = idx++;
  const num = document.querySelectorAll('.bloco').length + 1;
  const container = document.getElementById('lista-questoes');

  const div = document.createElement('div');
  div.className = 'bloco';
  div.id = 'bloco' + id;

  const altsHTML = ['A', 'B', 'C', 'D', 'E'].map(l => `
    <div class="alt-linha" id="linha${id}${l}">
      <span class="alt-letra">${l}</span>
      <input type="text" class="alt-input" id="alt${id}${l}" placeholder="alternativa ${l}..." />
    </div>
  `).join('');

  const radiosHTML = ['A', 'B', 'C', 'D', 'E'].map(l => `
    <input type="radio" class="radio-correta" name="correta${id}" id="rc${id}${l}" value="${l}" ${l === 'A' ? 'checked' : ''} />
    <label class="radio-label" for="rc${id}${l}">${l}</label>
  `).join('');

  div.innerHTML = `
    <div class="bloco-num">questão ${num}</div>
    <button type="button" class="btn-del" data-id="${id}" title="remover">×</button>
    <input type="text" class="q-input" id="q${id}" placeholder="enunciado da questão..." />
    <div class="alts">${altsHTML}</div>
    <div class="correta-row">
      <span>resposta correta:</span>
      <div class="opcoes-correta">${radiosHTML}</div>
    </div>
  `;

  container.appendChild(div);

  /* Destaca alternativa correta ao mudar radio */
  ['A', 'B', 'C', 'D', 'E'].forEach(l => {
    const radio = document.getElementById('rc' + id + l);
    radio.addEventListener('change', function () {
      destacarCorreta(id);
    });
  });

  div.querySelector('.btn-del').addEventListener('click', function () {
    div.remove();
    renumerarBlocos();
  });

  destacarCorreta(id);
}

/* ===== Destaca a alternativa marcada como correta ===== */
function destacarCorreta(id) {
  const correta = document.querySelector(`input[name="correta${id}"]:checked`)?.value;
  ['A', 'B', 'C', 'D', 'E'].forEach(l => {
    const linha = document.getElementById('linha' + id + l);
    if (linha) linha.classList.toggle('correta', l === correta);
  });
}

/* ===== Renumera questões após remover ===== */
function renumerarBlocos() {
  document.querySelectorAll('.bloco-num').forEach((el, i) => {
    el.textContent = 'questão ' + (i + 1);
  });
}

/* ===== Coleta questões do DOM ===== */
function coletarQuestoes() {
  const questoes = [];
  document.querySelectorAll('.bloco').forEach(bloco => {
    const id = bloco.id.replace('bloco', '');
    const enunciado = document.getElementById('q' + id)?.value.trim();
    if (!enunciado) return;

    const alts = {};
    ['A', 'B', 'C', 'D', 'E'].forEach(l => {
      alts[l] = document.getElementById('alt' + id + l)?.value.trim() || '';
    });

    const correta = document.querySelector(`input[name="correta${id}"]:checked`)?.value || 'A';
    questoes.push({ enunciado, alts, correta });
  });
  return questoes;
}

/* ===== Embaralhador (Fisher-Yates) ===== */
function embaralhar(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ===== Gerar PDF ===== */
function gerarPDF() {
  const { jsPDF } = window.jspdf;

  const titulo = document.getElementById('titulo').value.trim() || 'Lista de Exercícios';
  const disciplina = document.getElementById('disciplina').value.trim();
  const banca = document.getElementById('banca').value.trim();
  const statusEl = document.getElementById('status');

  let questoes = coletarQuestoes();

  if (questoes.length === 0) {
    statusEl.textContent = 'adicione ao menos uma questão!';
    statusEl.className = 'status erro';
    return;
  }

  questoes = embaralhar(questoes);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, ML = 16, MR = 16, TW = W - ML - MR;
  const ROSA = [180, 120, 110];
  const ROSA_CLARO = [240, 221, 214];
  const BORDA = [232, 220, 216];
  let y = 0;
  let pageNum = 1;

  /* --- Cabeçalho --- */
  function renderHeader(secao) {
    doc.setFillColor(...ROSA_CLARO);
    doc.rect(ML, 10, TW, 11, 'F');

    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(...ROSA);
    doc.text(titulo, ML + 5, 17.5);

    const meta = [disciplina, banca].filter(Boolean).join('  ·  ');
    if (meta) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(180, 150, 140);
      doc.text(meta, W - MR - 2, 17.5, { align: 'right' });
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 170, 160);
    doc.text(secao.toUpperCase(), ML + 5, 26);
    doc.setDrawColor(...ROSA_CLARO);
    doc.line(ML, 28, W - MR, 28);
  }

  /* --- Rodapé --- */
  function renderFooter(total) {
    doc.setFontSize(8);
    doc.setTextColor(200, 180, 175);
    doc.text(String(pageNum), W / 2, 290, { align: 'center' });
    if (total !== undefined) {
      doc.text(total + ' questões', W - MR, 290, { align: 'right' });
    }
  }

  /* --- Verifica espaço --- */
  function checkPage(needed, secao) {
    if (y + needed > 278) {
      renderFooter();
      doc.addPage();
      pageNum++;
      renderHeader(secao);
      y = 32;
    }
  }

  /* ======= PÁGINA DE QUESTÕES ======= */
  renderHeader('questões');
  y = 32;

  questoes.forEach((q, i) => {
    const linhasEnunciado = doc.splitTextToSize(q.enunciado, TW - 14);
    const altsFiltradas = ['A', 'B', 'C', 'D', 'E'].filter(l => q.alts[l]);
    const altAltura = altsFiltradas.reduce((acc, l) => {
      return acc + doc.splitTextToSize(l + ') ' + q.alts[l], TW - 20).length * 5 + 2;
    }, 0);
    const h = linhasEnunciado.length * 5.5 + altAltura + 12;

    checkPage(h, 'questões');

    /* fundo alternado */
    if (i % 2 === 0) {
      doc.setFillColor(255, 252, 250);
      doc.rect(ML, y, TW, h, 'F');
    }
    doc.setDrawColor(...BORDA);
    doc.rect(ML, y, TW, h);

    /* número */
    doc.setFillColor(...ROSA_CLARO);
    doc.rect(ML, y, 10, h, 'F');
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...ROSA);
    doc.text(String(i + 1), ML + 5, y + h / 2 + 3, { align: 'center' });

    /* enunciado */
    let iy = y + 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 38, 34);
    doc.text(linhasEnunciado, ML + 13, iy);
    iy += linhasEnunciado.length * 5.5 + 2;

    /* alternativas */
    altsFiltradas.forEach(l => {
      const txt = l + ') ' + q.alts[l];
      const linhas = doc.splitTextToSize(txt, TW - 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 80, 74);
      doc.text(linhas, ML + 14, iy);
      iy += linhas.length * 5 + 2;
    });

    y += h + 3;
  });

  renderFooter();

  /* ======= PÁGINA DE GABARITO ======= */
  doc.addPage();
  pageNum++;
  renderHeader('gabarito');
  y = 32;

  /* cabeçalho da tabela */
  doc.setFillColor(...ROSA_CLARO);
  doc.rect(ML, y, TW, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...ROSA);
  doc.text('nº', ML + 5, y + 5.5, { align: 'center' });
  doc.text('resposta', ML + 22, y + 5.5);
  y += 8;

  questoes.forEach((q, i) => {
    checkPage(8, 'gabarito');

    if (i % 2 === 0) {
      doc.setFillColor(255, 252, 250);
      doc.rect(ML, y, TW, 8, 'F');
    }
    doc.setDrawColor(...BORDA);
    doc.rect(ML, y, TW, 8);

    /* número */
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...ROSA);
    doc.text(String(i + 1), ML + 5, y + 5.5, { align: 'center' });

    /* pílula com resposta */
    doc.setFillColor(...ROSA);
    doc.roundedRect(ML + 14, y + 1.5, 16, 5, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(q.correta, ML + 22, y + 5.5, { align: 'center' });

    y += 8;
  });

  renderFooter(questoes.length);

  const nome = titulo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '') + '.pdf';
  doc.save(nome || 'lista.pdf');

  statusEl.textContent = 'PDF gerado com ' + questoes.length + ' questão(ões)!';
  statusEl.className = 'status ok';
}
