import Footer from "@/components/Footer";
import Navbar from "@/components/navbar/Navbar";
import { getWebsiteSettings } from "@/service/settings/website-settings.service";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { siteName, logoUrl } = await getWebsiteSettings();

  return (
    <>
      <Navbar siteName={siteName} logoUrl={logoUrl} />
      <main>{children}</main>
      <Footer siteName={siteName} logoUrl={logoUrl} />
    </>
  );
}