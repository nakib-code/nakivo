import Footer from "@/components/Footer";
import Navbar from "@/components/navbar/Navbar";
import { getAllCategories } from "@/service/category/category.service";
import { getWebsiteSettings } from "@/service/settings/website-settings.service";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ siteName, logoUrl }, rawCategories] = await Promise.all([
    getWebsiteSettings(),
    getAllCategories().catch(() => []),
  ]);

  const footerCategories = rawCategories.slice(0, 3).map((cat) => ({
    name: cat.name,
    slug: cat.slug,
  }));

  return (
    <>
      <Navbar siteName={siteName} logoUrl={logoUrl} />
      <main>{children}</main>
      <Footer
        siteName={siteName}
        logoUrl={logoUrl}
        categories={footerCategories}
      />
    </>
  );
}