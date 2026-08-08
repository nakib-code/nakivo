export const navLinks = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Shop",
    href: "/products",
  },
  {
    title: "Categories",
    children: [
      {
        title: "Fashion",
        href: "/products?category=Fashion",
      },
      {
        title: "Electronics",
        href: "/products?category=Electronics",
      },
      {
        title: "Shoes",
        href: "/products?category=Shoes",
      },
      {
        title: "Accessories",
        href: "/products?category=Accessories",
      },
      {
        title: "Beauty",
        href: "/products?category=Beauty",
      },
    ],
  },
  {
    title: "New Arrivals",
    href: "/products?sort=newest",
  },
  {
    title: "Deals",
    href: "/products?discount=true",
  },
  {
    title: "About",
    href: "/about",
  },
  {
    title: "Contact",
    href: "/contact",
  },
] as const;