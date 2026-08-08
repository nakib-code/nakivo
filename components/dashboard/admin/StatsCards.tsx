"use client";

import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";

import { Card } from "@/components/ui/card";

interface Props {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function StatsCards({
  totalUsers,
  totalProducts,
  totalOrders,
  totalRevenue,
}: Props) {
  const cards = [
    {
      title: "Users",
      value: totalUsers.toLocaleString(),
      icon: Users,
    },
    {
      title: "Products",
      value: totalProducts.toLocaleString(),
      icon: Package,
    },
    {
      title: "Orders",
      value: totalOrders.toLocaleString(),
      icon: ShoppingCart,
    },
    {
      title: "Revenue",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(totalRevenue),
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card
            key={card.title}
            className="rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {card.title}
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  {card.value}
                </h2>
              </div>

              <div className="rounded-xl bg-primary/10 p-3">
                <Icon className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}