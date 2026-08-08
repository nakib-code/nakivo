"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import type { MonthlySale } from "@/types/dashboard.types";

type Props = {
  data: MonthlySale[];
};

export default function RevenueChart({
  data,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
      <div className="mb-6">
        <h2 className="text-lg font-bold">
          Revenue Overview
        </h2>

        <p className="text-sm text-muted-foreground">
          Monthly sales revenue
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id="revenue"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#2563eb"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="#2563eb"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              tickFormatter={(value) =>
                `$${value}`
              }
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              formatter={(value) => [
                `$${Number(value).toFixed(2)}`,
                "Revenue",
              ]}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={3}
              fill="url(#revenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}