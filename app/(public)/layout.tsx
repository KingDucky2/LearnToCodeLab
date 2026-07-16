import { AppFooter } from "@/components/AppFooter";
import { AppNav } from "@/components/AppNav";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <AppNav />
      {children}
      <AppFooter />
    </>
  );
}
