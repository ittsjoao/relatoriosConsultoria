import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Debitos } from "../services/debitos";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { useState } from "react";
import {
  extrairDividaAtiva,
  extrairCapag,
  extrairSituacao,
} from "../services/extracaoPDF";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const [valorDivida, setValorDivida] = useState("");
  const [valorCapag, setValorCapag] = useState("");
  const [porte, setPorte] = useState("");
  const [resultado, setResultado] = useState<number | null>(null);
  const [desconto, setDesconto] = useState<number | null>(null);
  const [descontoValor, setDescontoValor] = useState<number | null>(null);
  const [valorAposDesconto, setValorAposDesconto] = useState<number | null>(
    null,
  );
  const [rating, setRating] = useState("");

  // 🆕 Estados para os 3 PDFs
  const [pdfDividaAtiva, setPdfDividaAtiva] = useState<File | null>(null);
  const [pdfCapag, setPdfCapag] = useState<File | null>(null);
  const [pdfSituacao, setPdfSituacao] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [dadosExtraidos, setDadosExtraidos] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  function calcularPercentual() {
    const divida = Number(valorDivida);
    const capag = Number(valorCapag);
    const port = String(porte);
    const percentual = Debitos.calcularPercentual(divida, capag);
    const descontoObtido = Debitos.calcularDesconto(percentual, port);
    const valorDesconto = Debitos.valorDesconto(divida, descontoObtido);
    const valorAposDesconto = Debitos.valorAposDesconto(divida, valorDesconto);
    const rating = Debitos.rating(divida, capag);
    setDesconto(descontoObtido);
    setDescontoValor(valorDesconto);
    setValorAposDesconto(valorAposDesconto);
    setResultado(percentual);
    setRating(rating);
  }

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
      const [dadosDivida, dadosCapag, dadosSituacao] = await Promise.all([
        extrairDividaAtiva(pdfDividaAtiva),
        extrairCapag(pdfCapag),
        extrairSituacao(pdfSituacao),
      ]);

      // Combinar todos os dados
      const todosOsDados = {
        ...dadosDivida,
        ...dadosCapag,
        ...dadosSituacao,
      };

      setDadosExtraidos(todosOsDados);
      console.log("Todos os dados extraídos:", todosOsDados);
    } catch (error) {
      console.error("❌ Erro ao processar PDFs:", error);
      setErro(
        error instanceof Error ? error.message : "Erro ao processar PDFs",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl space-y-8">
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

            {/* PDF 2: CAPAG */}
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

            {/* PDF 3: Situação */}
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
                ❌ {erro}
              </div>
            )}

            {dadosExtraidos && (
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Nome:</strong> {dadosExtraidos.nome || "N/A"}
                  </p>
                  <p>
                    <strong>CNPJ:</strong> {dadosExtraidos.cnpj || "N/A"}
                  </p>
                  <p>
                    <strong>Valor Dívida:</strong> R${" "}
                    {dadosExtraidos.valorDaDivida || "N/A"}
                  </p>
                  <p>
                    <strong>Valor CAPAG:</strong> R${" "}
                    {dadosExtraidos.valorDaCapag || "N/A"}
                  </p>
                  <p>
                    <strong>Situação:</strong>{" "}
                    {dadosExtraidos.situacao || "N/A"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seção de Cálculo Existente */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">
            Calculadora de Débitos
          </h1>
          <div className="grid w-full gap-4">
            <InputGroup>
              <InputGroupInput
                placeholder="Valor da Dívida"
                value={valorDivida}
                onChange={(e) => setValorDivida(e.target.value)}
                type="number"
              />
            </InputGroup>
            <InputGroup>
              <InputGroupInput
                placeholder="Valor da Capag"
                value={valorCapag}
                onChange={(e) => setValorCapag(e.target.value)}
                type="number"
              />
            </InputGroup>
            <InputGroup>
              <InputGroupInput
                placeholder="Porte"
                value={porte}
                onChange={(e) => setPorte(e.target.value)}
              />
            </InputGroup>
            <Button onClick={calcularPercentual}>Calcular</Button>

            {resultado !== null && (
              <div className="space-y-2 p-4 bg-gray-50 rounded">
                <p>
                  <strong>Percentual:</strong> {resultado}%
                </p>
                <p>
                  <strong>Desconto:</strong> {desconto}%
                </p>
                <p>
                  <strong>Valor do Desconto:</strong> R${" "}
                  {descontoValor?.toFixed(2)}
                </p>
                <p>
                  <strong>Valor após Desconto:</strong> R${" "}
                  {valorAposDesconto?.toFixed(2)}
                </p>
                <p>
                  <strong>Rating:</strong> {rating}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
