export function formatBDT(amount: unknown): string {
  const numeric = Number(amount);
  const safeAmount = Number.isFinite(numeric) ? numeric : 0;

  return `৳${safeAmount.toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}
