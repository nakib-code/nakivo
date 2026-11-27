import type { Metadata } from "next";

import ComboBuilder from "@/components/combo/ComboBuilder";
import { getComboProducts } from "@/service/product.service";

export const metadata: Metadata = {
  title: "Combo Builder — Pick 3+ Products",
  description:
    "কম্বো হলে কমপক্ষে ৩টি প্রোডাক্ট নিন। যেকোনো ৩টি বা তার বেশি আইটেম সিলেক্ট করে কম্বো তৈরি করুন।",
};

export default async function ComboPage() {
  const products = await getComboProducts();

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1600px]
        px-4
        py-6
        sm:px-6
        sm:py-8
        lg:px-8
        xl:px-10
        2xl:px-12
      "
    >
      <ComboBuilder products={products} />
    </div>
  );
}
