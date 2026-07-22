import type { Metadata } from "next";
import ProjectsPanel from "@/components/ProjectsPanel";

export const metadata: Metadata = {
  title: "built",
  description: "things i've built",
};

export default function BuiltPage() {
  return <ProjectsPanel />;
}
