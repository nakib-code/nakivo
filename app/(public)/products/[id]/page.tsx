"use client";

import { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useGetProducts } from "@/hooks/useProducts";

const categories = ["All", "Electronics", "Fashion", "Shoes", "Gadgets"];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: products, isLoading, isError } = useGetProducts(
    search,
    selectedCategory.toLowerCase()
  );
  const addToCart = useCartStore((state) => state.addToCart);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Hero Section */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
        <div className="space-y-4 max-w-lg">
          <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
            New Collections 2026
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Discover Premium Fashion & Electronics.
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            Upgrade your style and setup with our exclusive handpicked items directly from verified stores.
          </p>
        </div>
      </section>

      {/* Filter & Search Controls */}
      <section id="products" className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white rounded-full focus-visible:ring-black"
            />
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="rounded-full text-xs font-semibold whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Product Count Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-bold text-slate-900">
            {selectedCategory === "All" ? "All Products" : selectedCategory}
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {products?.length || 0} Products Found
          </span>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 bg-slate-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500">Failed to load products.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products && products.length > 0 ? (
              products.map((product: any) => (
                <div
                  key={product._id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition duration-300 flex flex-col justify-between group"
                >
                  <Link href={`/products/${product._id}`} className="block">
                    <div className="relative h-48 w-full bg-slate-50 flex items-center justify-center overflow-hidden">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">No Image</span>
                      )}
                    </div>

                    <div className="p-4 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {product.category || "General"}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:underline">
                        {product.title}
                      </h3>
                    </div>
                  </Link>

                  <div className="p-4 pt-0 flex items-center justify-between border-t mt-2">
                    <span className="text-base font-extrabold text-black">
                      ${product.price}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => {
                        addToCart(product);
                        alert(`${product.title} added to cart! 🛒`);
                      }}
                      className="rounded-lg text-xs"
                    >
                      <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Add
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 text-slate-400">
                No products found matching your search criteria.
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}