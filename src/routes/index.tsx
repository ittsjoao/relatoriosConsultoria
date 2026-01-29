import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  extrairDividaAtiva,
  extrairCapag,
  extrairSituacao,
  processarDebitosReceita,
  calcularTotais,
} from "../services/extracaoPDF";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const [pdfDividaAtiva, setPdfDividaAtiva] = useState<File | null>(null);
  const [pdfCapag, setPdfCapag] = useState<File | null>(null);
  const [pdfSituacao, setPdfSituacao] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [dadosExtraidos, setDadosExtraidos] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function processarTodosPDFs() {
    if (!pdfDividaAtiva || !pdfCapag || !pdfSituacao) {
      setErro("Por favor, selecione os 3 arquivos PDF");
      return;
    }

    setLoading(true);
    setErro(null);
    setDadosExtraidos(null);

    try {
      // Processar os 3 PDFs em paralelo
      const [dadosDivida, dadosCapag, dadosSituacao, debitosAgrupados] =
        await Promise.all([
          extrairDividaAtiva(pdfDividaAtiva),
          extrairCapag(pdfCapag),
          extrairSituacao(pdfSituacao),
          processarDebitosReceita(pdfSituacao), // Adicionar processamento de débitos
        ]);

      // Calcular totais de cada grupo
      const totaisSimplesNacional = calcularTotais(
        debitosAgrupados.simplesNacional,
      );
      const totaisPreve = calcularTotais(debitosAgrupados.preve);
      const totaisDemais = calcularTotais(debitosAgrupados.demais);

      // Combinar todos os dados
      const todosOsDados = {
        ...dadosDivida,
        ...dadosCapag,
        ...dadosSituacao,
        debitos: {
          simplesNacional: {
            lista: debitosAgrupados.simplesNacional,
            totais: totaisSimplesNacional,
          },
          preve: {
            lista: debitosAgrupados.preve,
            totais: totaisPreve,
          },
          demais: {
            lista: debitosAgrupados.demais,
            totais: totaisDemais,
          },
        },
      };

      setDadosExtraidos(todosOsDados);
      console.log("Todos os dados extraídos:", todosOsDados);
    } catch (error) {
      console.error("Erro ao processar PDFs:", error);
      setErro(
        error instanceof Error ? error.message : "Erro ao processar PDFs",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-center mb-6">
            Upload dos PDFs
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PDF Dívida Ativa
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfDividaAtiva(e.target.files?.[0] || null)}
                className="block w-full text-sm"
              />
              {pdfDividaAtiva && (
                <p className="text-xs text-green-600 mt-1">
                  {pdfDividaAtiva.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PDF CAPAG
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfCapag(e.target.files?.[0] || null)}
                className="block w-full text-sm"
              />
              {pdfCapag && (
                <p className="text-xs text-green-600 mt-1">{pdfCapag.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PDF Situação
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfSituacao(e.target.files?.[0] || null)}
                className="block w-full text-sm"
              />
              {pdfSituacao && (
                <p className="text-xs text-green-600 mt-1">
                  {pdfSituacao.name}
                </p>
              )}
            </div>

            <Button
              onClick={processarTodosPDFs}
              disabled={loading || !pdfDividaAtiva || !pdfCapag || !pdfSituacao}
              className="w-full"
            >
              {loading ? "Processando..." : "Extrair Dados dos PDFs"}
            </Button>

            {erro && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {erro}
              </div>
            )}

            {dadosExtraidos && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DADOS GERAIS */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <h3 className="font-bold text-lg mb-3">Dados Gerais</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <strong>Nome:</strong> {dadosExtraidos.nome || "N/A"}
                    </div>
                    <div>
                      <strong>CNPJ:</strong> {dadosExtraidos.cnpj || "N/A"}
                    </div>
                    <div>
                      <strong>Cidade:</strong> {dadosExtraidos.cidade || "N/A"}
                    </div>
                    <div>
                      <strong>Estado:</strong> {dadosExtraidos.estado || "N/A"}
                    </div>
                    <div>
                      <strong>Porte:</strong> {dadosExtraidos.porte || "N/A"}
                    </div>
                    <div>
                      <strong>Classificação:</strong>{" "}
                      {dadosExtraidos.classificacao || "N/A"}
                    </div>
                  </div>
                </div>

                {/* VALORES */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <h3 className="font-bold text-lg mb-3">Valores</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <strong>Valor da Dívida:</strong> R${" "}
                      {dadosExtraidos.valorDaDivida || "N/A"}
                    </div>
                    <div>
                      <strong>Valor da CAPAG:</strong> R${" "}
                      {dadosExtraidos.valorDaCapag || "N/A"}
                    </div>
                  </div>
                </div>

                {/* DÉBITOS - SIMPLES NACIONAL */}
                {dadosExtraidos.debitos?.simplesNacional.totais.quantidade >
                  0 && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                      <h3 className="font-bold text-lg mb-3">Simples Nacional</h3>
                      <div className="text-sm space-y-2 mb-4">
                        <div className="flex justify-between">
                          <strong>Quantidade de débitos:</strong>
                          <span>
                            {
                              dadosExtraidos.debitos.simplesNacional.totais
                                .quantidade
                            }
                          </span>
                        </div>
                        {/* <div className="flex justify-between">
                          <strong>Total Consolidado:</strong>
                          <span className="text-red-600 font-bold">
                            R${" "}
                            {
                              dadosExtraidos.debitos.simplesNacional.totais
                                .totalFormatado
                            }
                          </span>
                        </div> */}
                      </div>

                      {/* Lista de débitos */}
                      <details className="text-xs">
                        <summary className="cursor-pointer font-medium mb-2">
                          Ver detalhes dos débitos
                        </summary>
                        <div className="space-y-2 mt-2">
                          {dadosExtraidos.debitos.simplesNacional.lista.map(
                            (debito: any, index: number) => (
                              <div
                                key={index}
                                className="p-2 bg-white rounded border"
                              >
                                <div className="grid grid-cols-2 gap-1">
                                  <span>
                                    <strong>Débitos:</strong> {debito.receita + " " + debito.periodo}
                                  </span>
                                  <span>
                                    <strong>Data:</strong>{" "}
                                    {debito.dataVencimento}
                                  </span>
                                  <span>
                                    <strong>Principal:</strong> R${" "}
                                    {debito.saldoDevedor}
                                  </span>
                                  <span>
                                    <strong>Multa:</strong> R${" "}
                                    {debito.multa}
                                  </span>
                                  <span>
                                    <strong>Juros:</strong> R${" "}
                                    {debito.juros}
                                  </span>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </details>
                    </div>
                  )}

                {/* DÉBITOS - PREVE */}
                {dadosExtraidos.debitos?.preve.totais.quantidade > 0 && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                    <h3 className="font-bold text-lg mb-3">PREVE</h3>
                    <div className="text-sm space-y-2 mb-4">
                      <div className="flex justify-between">
                        <strong>Quantidade de débitos:</strong>
                        <span>
                          {dadosExtraidos.debitos.preve.totais.quantidade}
                        </span>
                      </div>
                      {/* <div className="flex justify-between">
                        <strong>Total Consolidado:</strong>
                        <span className="text-red-600 font-bold">
                          R${" "}
                          {dadosExtraidos.debitos.preve.totais.totalFormatado}
                        </span>
                      </div> */}
                    </div>

                    {/* Lista de débitos */}
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium mb-2">
                        Ver detalhes dos débitos
                      </summary>
                      <div className="space-y-2 mt-2">
                        {dadosExtraidos.debitos.preve.lista.map(
                          (debito: any, index: number) => (
                            <div
                              key={index}
                              className="p-2 bg-white rounded border"
                            >
                              <div className="grid grid-cols-2 gap-1">
                                <span>
                                  <strong>Débitos:</strong> {debito.receita + " " + debito.periodo}
                                </span>
                                <span>
                                  <strong>Data:</strong>{" "}
                                  {debito.dataVencimento}
                                </span>
                                <span>
                                  <strong>Principal:</strong> R${" "}
                                  {debito.saldoDevedor}
                                </span>
                                <span>
                                  <strong>Multa:</strong> R${" "}
                                  {debito.multa}
                                </span>
                                <span>
                                  <strong>Juros:</strong> R${" "}
                                  {debito.juros}
                                </span>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </details>
                  </div>
                )}

                {/* DÉBITOS - DEMAIS */}
                {dadosExtraidos.debitos?.demais.totais.quantidade > 0 && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                    <h3 className="font-bold text-lg mb-3">Demais Débitos</h3>
                    <div className="text-sm space-y-2 mb-4">
                      <div className="flex justify-between">
                        <strong>Quantidade de débitos:</strong>
                        <span>
                          {dadosExtraidos.debitos.demais.totais.quantidade}
                        </span>
                      </div>
                      {/* <div className="flex justify-between">
                        <strong>Total Consolidado:</strong>
                        <span className="text-red-600 font-bold">
                          R${" "}
                          {dadosExtraidos.debitos.demais.totais.totalFormatado}
                        </span>
                      </div> */}
                    </div>

                    {/* Lista de débitos */}
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium mb-2">
                        Ver detalhes dos débitos
                      </summary>
                      <div className="space-y-2 mt-2">
                        {dadosExtraidos.debitos.demais.lista.map(
                          (debito: any, index: number) => (
                            <div
                              key={index}
                              className="p-2 bg-white rounded border"
                            >
                              <div className="grid grid-cols-2 gap-1">
                                <span>
                                  <strong>Débitos:</strong> {debito.receita + " " + debito.periodo}
                                </span>
                                <span>
                                  <strong>Data:</strong>{" "}
                                  {debito.dataVencimento}
                                </span>
                                <span>
                                  <strong>Principal:</strong> R${" "}
                                  {debito.saldoDevedor}
                                </span>
                                <span>
                                  <strong>Multa:</strong> R${" "}
                                  {debito.multa}
                                </span>
                                <span>
                                  <strong>Juros:</strong> R${" "}
                                  {debito.juros}
                                </span>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
