import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Debitos } from "../services/debitos";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { useState } from "react";

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

  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold text-center">
        Teste
        <div className="grid w-full max-w-sm gap-6 text-1x1 font-light">
          <InputGroup>
            <InputGroupInput
              placeholder="Valor da Divida"
              value={valorDivida}
              onChange={(e) => setValorDivida(e.target.value)}
            />
          </InputGroup>
          <InputGroup>
            <InputGroupInput
              placeholder="valor da Capag"
              value={valorCapag}
              onChange={(e) => setValorCapag(e.target.value)}
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
          {resultado !== null && <p>Percentual: {resultado}%</p>}
          {desconto !== null && <p>Desconto: {desconto}%</p>}
          {descontoValor !== null && <p>Valor do Desconto: {descontoValor}</p>}
          {valorAposDesconto !== null && (
            <p>Valor após Desconto: {valorAposDesconto}</p>
          )}
          {rating !== null && <p>Rating: {rating}</p>}
        </div>
      </h1>
    </div>
  );
}
