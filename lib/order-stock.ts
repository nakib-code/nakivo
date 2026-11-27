import type { OrderStatus } from "@/types/order";

export type StockTransitionAction = "deduct" | "restore" | "none";

/**
 * Pure stock-safety state machine for order status transitions.
 *
 * - Orders are created in `Pending` with `stockDeducted = false` so fake/unconfirmed
 *   COD orders never lock up real inventory.
 * - Moving into `Processing` or `Delivered` deducts stock once (only when `stockDeducted === false`).
 * - Moving into `Cancelled` restores stock ONLY when `stockDeducted === true`.
 */
export function getStockActionForTransition(
  nextStatus: OrderStatus,
  stockDeducted: boolean
): StockTransitionAction {
  if (nextStatus === "Processing" || nextStatus === "Delivered") {
    return stockDeducted ? "none" : "deduct";
  }

  if (nextStatus === "Cancelled") {
    return stockDeducted ? "restore" : "none";
  }

  return "none";
}
