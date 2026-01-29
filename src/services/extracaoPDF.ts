import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "../node_modules/pdfjs-dist/build/pdf.worker.mjs";

interface Debito {
  receita: string;
  periodo: string;
  dataVencimento: string;
  valorOriginal: string;
  saldoDevedor: string;
  multa: string;
  juros: string;
  saldoConsolidado: string;
  situacao: string;
}

// ===== FUNÇÃO BASE =====
export async function extrairTextoDoPDF(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");

    pages.push({
      pageNumber: i,
      text: pageText,
    });
  }

  return {
    fileName: file.name,
    totalPages: pdf.numPages,
    fullText: pages.map((page) => page.text).join("\n\n"),
  };
}

// ===== EXTRAÇÕES ESPECÍFICAS =====
export async function extrairDividaAtiva(file: File) {
  const result = await extrairTextoDoPDF(file);

  const nome = result?.fullText
    .match(/Devedor:\s*([^\n]+?)(?:\s*CPF\/CNPJ|$)/)?.[1]
    ?.trim();
  const cnpj = result?.fullText.match(/CPF\/CNPJ:\s*([\d.\/]+)/)?.[1];

  return {
    nome,
    cnpj,
  };
}

export async function extrairCapag(file: File) {
  const result = await extrairTextoDoPDF(file);

  const valorDaCapag = result?.fullText.match(
    /Capacidade de pagamento em em 60 meses:\s*R\$\s*([\d.,]+)/,
  )?.[1];

  const valorDaDivida = result?.fullText.match(
    /Valor total da dívida na PGFN e RFB:\s*R\$\s*([\d.,]+)/,
  )?.[1];

  const classificacao = result?.fullText
    .match(/Classificação para transação :\s*([^\n]+?)(?:\s*Valor|$)/)?.[1]
    ?.trim();

  return {
    valorDaCapag,
    valorDaDivida,
    classificacao,
  };
}

export async function extrairSituacao(file: File) {
  const result = await extrairTextoDoPDF(file);

  const cidade = result?.fullText
    .match(/Município:\s*([^\n]+?)(?:\s*UF|$)/)?.[1]
    ?.trim();

  const estado = result?.fullText
    .match(/UF:\s*([^\n]+?)(?:\s*Responsável|$)/)?.[1]
    ?.trim();

  const porte = result?.fullText
    .match(/Porte da Empresa:\s*([^\n]+?)(?:\s*Opção|$)/)?.[1]
    ?.trim();

  return {
    cidade,
    estado,
    porte,
  };
}

export async function debugExtracao(file: File) {
  const result = await extrairTextoDoPDF(file);

  console.log("=== TEXTO COMPLETO EXTRAÍDO ===");
  console.log(result.fullText);
  console.log("\n=== BUSCANDO MARCADORES ===");

  const markers = [
    "Pendência",
    "Pendência - Débito",
    "Débito (SIEF)",
    "Diagnóstico Fiscal na Procuradoria",
    "Diagnóstico Fiscal na Procuradoria-Geral da Fazenda Nacional",
  ];

  markers.forEach((marker) => {
    const index = result.fullText.indexOf(marker);
    console.log(
      `"${marker}": ${index >= 0 ? `encontrado na posição ${index}` : "NÃO ENCONTRADO"}`,
    );
  });

  return result.fullText;
}

// FUNÇÂO PARA EXTRAIR SECAO RELEVANTE RECEITA
export async function extractSecaoRelevante(file: File) {
  const result = await extrairTextoDoPDF(file);
  const fullText = result.fullText;

  const startPatterns = ["Débito (SIEF)"];
  const endPattern = "Diagnóstico Fiscal na Procuradoria";

  let startIndex = -1;
  let usedPattern = "";

  for (const pattern of startPatterns) {
    startIndex = fullText.indexOf(pattern);
    if (startIndex !== -1) {
      usedPattern = pattern;
      break;
    }
  }

  const endIndex = fullText.indexOf(endPattern);

  if (startIndex === -1) {
    console.warn("Marcador inicial não encontrado");
    return "";
  }

  if (endIndex === -1) {
    console.warn("Marcador final não encontrado");
    return "";
  }

  const secao = fullText
    .substring(startIndex + usedPattern.length, endIndex)
    .trim();

  return secao;
}

export async function processarDebitosReceita(file: File) {
  let secao = await extractSecaoRelevante(file);

  if (!secao) {
    return { simplesNacional: [], preve: [], demais: [] };
  }

  // 1) limpeza: remove trechos típicos de header/rodapé sem matar débitos
  secao = secao
    .replace(/_{2,}/g, "") // remove linhas de sublinhado (inclusive no final)
    .replace(
      /MINIST[ÉE]RIO DA FAZENDA.*?(?=(\d{4}-\d{2}\s*-|SIMPLES\s+NAC\.))/gs,
      "",
    ) // tira cabeçalho até o 1º débito
    .replace(/Página:\s*\d+\s*\/\s*\d+/g, "") // remove paginação
    .replace(/\s+/g, " ") // normaliza espaços
    .trim();

  const todosDebitos: Debito[] = [];

  // 2) regex GLOBAL: acha cada débito independente de \n
  // Ajuste a "receita" para começar como débito de verdade:
  // - ou código tipo 0561-07 - ..
  // - ou "SIMPLES NAC."
  const regexDebitoGlobal =
    /((?:\d{4}-\d{2}\s*-\s*[^0-9]+?|SIMPLES\s+NAC\.|SIMPLES\s+NAC))\s+(\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([A-Z\s\-]+?)(?=(?:\s+\d{4}-\d{2}\s*-|\s+SIMPLES\s+NAC\.|\s*$))/g;

  for (const m of secao.matchAll(regexDebitoGlobal)) {
    const debito: Debito = {
      receita: m[1].trim(),
      periodo: m[2],
      dataVencimento: m[3],
      valorOriginal: m[4],
      saldoDevedor: m[5],
      multa: m[6],
      juros: m[7],
      saldoConsolidado: m[8],
      situacao: m[9].trim(),
    };

    todosDebitos.push(debito);
  }

  const simplesNacional: Debito[] = [];
  const preve: Debito[] = [];
  const demais: Debito[] = [];

  for (const debito of todosDebitos) {
    const receita = debito.receita.toUpperCase();

    if (receita.includes("SIMPLES") && receita.includes("NAC")) {
      simplesNacional.push(debito);
    } else if (receita.includes("CP")) {
      preve.push(debito);
    } else {
      demais.push(debito);
    }
  }

  return { simplesNacional, preve, demais };
}

export function calcularTotais(debitos: Debito[]) {
  let total = 0;

  for (const debito of debitos) {
    const valorLimpo = debito.saldoConsolidado
      ?.replace(/\./g, "")
      .replace(",", ".");
    const valor = parseFloat(valorLimpo);

    if (!isNaN(valor)) {
      total += valor;
    }
  }

  return {
    quantidade: debitos.length,
    total: total.toFixed(2),
    totalFormatado: total.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  };
}
