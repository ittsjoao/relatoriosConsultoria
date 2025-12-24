export class Debitos {
  static calcularPercentual(divida: number, capag: number): number {
    return (capag / divida) * 100;
  }

  static calcularDesconto(percentual: number, porte: string): number {
    let percentualFinal = 1 - percentual / 100;
    if (percentualFinal < 0) {
      return 0;
    } else if (porte !== "Demais" && percentualFinal > 0.7) {
      return 70;
    } else if (porte === "Demais" && percentualFinal > 0.65) {
      return 65;
    } else {
      return percentualFinal * 100;
    }
  }

  static valorDesconto(divida: number, desconto: number): number {
    return divida * (desconto / 100);
  }

  static valorAposDesconto(divida: number, valorDesconto: number): number {
    return divida - valorDesconto;
  }

  static rating(divida: number, capag: number): string {
    if (divida === 0) {
      return "D";
    }

    const indice = capag / divida;

    if (indice >= 1.5) {
      return "A";
    } else if (indice >= 1.0) {
      return "B";
    } else if (indice >= 0.5) {
      return "C";
    } else {
      return "D";
    }
  }
}
