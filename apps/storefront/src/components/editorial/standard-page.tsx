import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";

export function StandardPage({ eyebrow, title, introduction, children }: { eyebrow: string; title: string; introduction: string; children: React.ReactNode }) {
  return <><header className="page-hero"><PageContainer><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p className="lead">{introduction}</p></PageContainer></header><Section><PageContainer>{children}</PageContainer></Section></>;
}
