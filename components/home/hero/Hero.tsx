import { HeroBanner } from "@/types/hero.types";
import HeroCarousel from "./HeroCarousel";

const dummyBanners: HeroBanner[] = [
  {
    id: "1",
    title: "Summer Collection",
    subtitle: "Up to 50% Off",
    buttonText: "Shop Now",
    buttonLink: "/products",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
    isActive: true,
    order: 1,
  },
  {
    id: "2",
    title: "New Electronics",
    subtitle: "Latest Gadgets Available",
    buttonText: "Explore",
    buttonLink: "/products",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1600&q=80",
    isActive: true,
    order: 2,
  },
  {
    id: "3",
    title: "Premium Fashion",
    subtitle: "Discover Your Style",
    buttonText: "Browse",
    buttonLink: "/products",
    image:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1600&q=80",
    isActive: true,
    order: 3,
  },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <HeroCarousel banners={dummyBanners} />
    </section>
  );
}