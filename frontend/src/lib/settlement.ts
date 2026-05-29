export interface MaterialLine {
  name: string;
  quantity: string;
  unitPrice: string;
}

export interface SettlementFormData {
  clientPaid: string;
  transportCost: string;
  otherCosts: string;
  notes: string;
  materials: MaterialLine[];
}

export interface OrderExpenseItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

export interface OrderSettlement {
  id: string;
  clientPaid: number;
  transportCost: number;
  otherCosts: number;
  materialsCost: number;
  totalExpenses: number;
  netProfit: number;
  notes?: string | null;
  expenseItems: OrderExpenseItem[];
}

export function emptyMaterialLine(): MaterialLine {
  return { name: '', quantity: '1', unitPrice: '' };
}

export function emptySettlementForm(): SettlementFormData {
  return {
    clientPaid: '',
    transportCost: '0',
    otherCosts: '0',
    notes: '',
    materials: [emptyMaterialLine()],
  };
}

function parseNum(value: string): number {
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function calculateSettlementPreview(form: SettlementFormData) {
  const clientPaid = parseNum(form.clientPaid);
  const transportCost = parseNum(form.transportCost);
  const otherCosts = parseNum(form.otherCosts);

  const materialsCost = form.materials.reduce((sum, line) => {
    const qty = parseNum(line.quantity) || 0;
    const price = parseNum(line.unitPrice);
    return sum + qty * price;
  }, 0);

  const totalExpenses = materialsCost + transportCost + otherCosts;
  const netProfit = clientPaid - totalExpenses;

  return {
    clientPaid,
    transportCost,
    otherCosts,
    materialsCost: Math.round(materialsCost * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
  };
}

export function buildCompletePayload(form: SettlementFormData) {
  const preview = calculateSettlementPreview(form);
  const materials = form.materials
    .filter((m) => m.name.trim())
    .map((m) => ({
      name: m.name.trim(),
      quantity: parseNum(m.quantity) || 1,
      unitPrice: parseNum(m.unitPrice),
    }));

  return {
    clientPaid: preview.clientPaid,
    transportCost: preview.transportCost,
    otherCosts: preview.otherCosts,
    notes: form.notes.trim() || undefined,
    materials,
  };
}
