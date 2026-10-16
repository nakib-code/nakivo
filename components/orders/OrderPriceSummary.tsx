
interface OrderPriceSummaryProps {
  subtotal?: number;
  deliveryCharge?: number;
  totalPrice: number;
  className?: string;
}

function formatBDT(amount: number) {
  return `৳${amount.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function OrderPriceSummary({
  subtotal,
  deliveryCharge,
  totalPrice,
  className = "",
}: OrderPriceSummaryProps) {
  const safeDeliveryCharge = deliveryCharge ?? 0;
  const safeSubtotal = subtotal ?? totalPrice;

  return (
    <div className={`space-y-3 text-sm ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium">
          {formatBDT(safeSubtotal)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">
          Delivery Charge
        </span>
        <span className="font-medium">
          {safeDeliveryCharge === 0
            ? "Free"
            : formatBDT(safeDeliveryCharge)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 border-t pt-3 text-base font-bold">
        <span>Total</span>
        <span>{formatBDT(totalPrice)}</span>
      </div>
    </div>
  );
}
