"use client";

import Link from "next/link";
import { CheckCircle2, ShoppingBag } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-6 shadow-sm">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Payment Successful!</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Thank you for your order. Your payment has been verified and your shipment is being processed.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <Link
            href="/user/orders"
            className="w-full inline-flex items-center justify-center bg-black text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
          >
            <ShoppingBag className="mr-2 h-4 w-4" /> View Order Status
          </Link>

          <Link
            href="/"
            className="block text-xs font-semibold text-slate-500 hover:text-black transition"
          >
            Return to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}