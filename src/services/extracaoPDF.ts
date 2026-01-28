import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "../node_modules/pdfjs-dist/build/pdf.worker.mjs";

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
    /Capacidade de pagamento em em 60 meses: R\$ ([\d.,]+)/,
  )?.[1];
  const valorDaDivida = result?.fullText.match(
    /Valor total da dívida na PGFN e RFB: R\$ ([\d.,]+)/,
  )?.[1];

  return {
    valorDaCapag,
    valorDaDivida,
  };
}

export async function extrairSituacao(file: File) {
  const result = await extrairTextoDoPDF(file);
  return {};
}
