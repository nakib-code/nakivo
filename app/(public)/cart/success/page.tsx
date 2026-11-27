import Link from "next/link";
import { CheckCircle2, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/roles";

interface SuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
    order_id?: string;
  }>;
}

export default async function SuccessPage({
  searchParams,
}: SuccessPageProps) {
  const [{ order_id: orderId }, user] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ]);
  const isStaff = isStaffRole(user?.role);
  const ordersHref = isStaff ? "/admin/orders" : "/user/orders";

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm">
        {/* Success Icon */}

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-9 w-9 text-green-600" />
        </div>

        {/* Heading */}

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Order Confirmed!
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Thank you for your order. Your Cash on Delivery order has been
          received and is now being processed.
        </p>

        {/* Order ID */}

        {orderId && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Order ID
            </p>

            <p className="mt-1 break-all text-sm font-semibold text-slate-900">
              {orderId}
            </p>
          </div>
        )}

        {/* Actions */}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <Button asChild>
              <Link href={ordersHref}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                {isStaff ? "View Orders" : "View My Orders"}
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/products">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          )}

          {user ? (
            <Button variant="outline" asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/login">Sign In with Google</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
