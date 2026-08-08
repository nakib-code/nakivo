import { HeroBanner } from "@/types/hero.types";
import HeroCarousel from "./HeroCarousel";

const dummyBanners: HeroBanner[] = [
  {
    _id: "1",
    title: "Summer Collection",
    description: "Up to 50% Off",
    buttonText: "Shop Now",
    buttonLink: "/products",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
    active: true,
    order: 1,
  },
  {
    _id: "2",
    title: "New Electronics",
    description: "Latest Gadgets Available",
    buttonText: "Explore",
    buttonLink: "/products",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1600&q=80",
    active: true,
    order: 2,
  },
  {
    _id: "3",
    title: "Premium Fashion",
    description: "Discover Your Style",
    buttonText: "Browse",
    buttonLink: "/products",
    image:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1600&q=80",
    active: true,
    order: 3,
  },
];

export default function Hero() {
  return <HeroCarousel banners={dummyBanners} />;
}
