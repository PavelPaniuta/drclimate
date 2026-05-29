export interface MaterialInput {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface SettlementInput {
  clientPaid: number;
  transportCost?: number;
  otherCosts?: number;
  materials?: MaterialInput[];
}

export interface SettlementTotals {
  materialsCost: number;
  transportCost: number;
  otherCosts: number;
  totalExpenses: number;
  netProfit: number;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateSettlementTotals(input: SettlementInput): SettlementTotals {
  const materials = input.materials ?? [];
  const materialsCost = roundMoney(
    materials.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  );
  const transportCost = roundMoney(input.transportCost ?? 0);
  const otherCosts = roundMoney(input.otherCosts ?? 0);
  const totalExpenses = roundMoney(materialsCost + transportCost + otherCosts);
  const netProfit = roundMoney(input.clientPaid - totalExpenses);

  return { materialsCost, transportCost, otherCosts, totalExpenses, netProfit };
}
