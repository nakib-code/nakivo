export type RecentOrder = {
  _id: string;
  totalPrice: number;
  status: string;
  isPaid: boolean;
  createdAt: string;

  user?: {
    _id: string;
    name: string;
    email: string;
  };
};

export interface LowStockProduct {
  _id: string;
  title: string;
  price: number;
  stock: number;
  images: {
    url: string;
  }[];
}


export type MonthlySale = {
  month: string;
  revenue: number;
};

export type DashboardData = {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;

  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];

  monthlySales: MonthlySale[];
};