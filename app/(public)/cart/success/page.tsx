"use client";

import Link from "next/link";
import { CheckCircle2, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SuccessPageProps {
  searchParams: {
    session_id?: string;
    order_id?: string;
  };
}

export default function SuccessPage({
  searchParams,
}: SuccessPageProps) {
  const orderId = searchParams.order_id;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm">
        {/* Success Icon */}

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-9 w-9 text-green-600" />
        </div>

        {/* Heading */}

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Payment Successful!
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Thank you for your order. Your payment has been
          successfully processed.
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
          <Button asChild>
            <Link href="/user/orders">
              <ShoppingBag className="mr-2 h-4 w-4" />
              View My Orders
            </Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/products">
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
