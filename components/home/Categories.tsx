import Image from "next/image";
import Link from "next/link";

import { getAllCategories } from "@/service/category/category.service";
import CategoryCarouselTrack from "@/components/home/CategoryCarouselTrack";

export default async function Categories() {
  const rawCategories = await getAllCategories();
  const categories = rawCategories.map((category) => ({
    _id: String(category._id),
    name: category.name,
    slug: category.slug,
    image: category.image ?? "",
  }));

  if (!categories.length) return null;

  return (
    <section
      aria-label="Categories"
      className=" w-full overflow-x-clip bg-background"
    >
      <div className="site-container">
        <CategoryCarouselTrack>
          {categories.map((category) => (
            <div
              key={category._id}
              role="listitem"
              className="min-w-0 shrink-0 grow-0 snap-start basis-[calc((100%_-_2_*_var(--content-gap))_/_3)] sm:basis-[calc((100%_-_3_*_var(--content-gap))_/_4)] lg:basis-[calc((100%_-_4_*_var(--content-gap))_/_5)] 2xl:basis-[calc((100%_-_5_*_var(--content-gap))_/_6)]"
            >
              <Link
                href={`/category/${category.slug}`}
                aria-label={`Shop ${category.name}`}
                draggable={false}
                className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(min-width: 1536px) 240px, (min-width: 1024px) 20vw, (min-width: 640px) 25vw, 33vw"
                      draggable={false}
                      className="responsive-image object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground"
                    >
                      {category.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex flex-1 items-center justify-center px-2.5 py-2.5 text-center sm:px-3 sm:py-3">
                  <span
                    title={category.name}
                    className="line-clamp-1 text-xs font-medium text-foreground transition-colors group-hover:text-primary sm:text-sm"
                  >
                    {category.name}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </CategoryCarouselTrack>
      </div>
    </section>
  );
}
