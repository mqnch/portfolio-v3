import SceneSwitcher from "@/components/SceneSwitcher";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SceneSwitcher>{children}</SceneSwitcher>;
}
