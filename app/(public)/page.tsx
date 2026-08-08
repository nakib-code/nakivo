"use client";

import { useGetProducts } from "@/hooks/useProducts";
import { useCartStore } from "@/store/useCartStore";
import Link from "next/link";
import { toast } from "sonner";

export default function HomePage() {
  const { data: products, isLoading, isError } = useGetProducts();
  const addToCart = useCartStore((state) => state.addToCart);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Hero Section */}
      <section className="bg-black text-white rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-lg">
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
            New Arrival
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Discover Trendy Fashion & Tech.
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Upgrade your wardrobe and setup with high-quality products directly from our premium store.
          </p>
          <div className="pt-2">
            <Link
              href="#products"
              className="inline-block bg-white text-black font-semibold px-6 py-3 rounded-lg hover:bg-gray-200 transition duration-200 text-sm"
            >
              Shop Now
            </Link>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex justify-center">
          <div className="relative w-64 h-64 md:w-80 md:h-80 bg-gray-800 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center text-gray-500">
            <span> Hero Banner Image </span>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <span className="text-sm font-semibold text-gray-500">
            {products?.length || 0} Products
          </span>
        </div>

        {/* Product Grid */}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products && products.length > 0 ? (
              products.map((product: any) => (
                <div
                  key={product._id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition duration-200 flex flex-col justify-between"
                >
                  <div className="relative h-48 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="object-cover w-full h-full hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">No Image</span>
                    )}
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        {product.category || "General"}
                      </span>
                      <h3 className="text-base font-semibold text-gray-800 line-clamp-1">
                        {product.title}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-lg font-bold text-black">
                        ${product.price}
                      </span>
                      <button
                        onClick={() => {
                          addToCart(product);
                          toast.success(`${product.title} added to cart! 🛒`);                        }}
                        className="bg-black text-white text-xs font-semibold px-3 py-2 rounded-md hover:bg-gray-800 transition"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                No products found. Add products from Admin Dashboard!
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}