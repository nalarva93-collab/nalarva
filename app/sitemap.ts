import type {MetadataRoute} from "next";
export const dynamic = "force-static";
const base="https://nalarva.com";
export default function sitemap():MetadataRoute.Sitemap{
  const pages=[
    ["",1,"weekly"],["/program",0.9,"weekly"],["/program/tka-sd",0.85,"weekly"],["/program/tka-smp",0.85,"weekly"],["/program/tka-sma",0.85,"weekly"],
    ["/tryout",0.8,"weekly"],["/paket",0.8,"weekly"],["/tentang",0.6,"monthly"],["/faq",0.6,"monthly"],["/kontak",0.5,"monthly"],["/daftar",0.7,"monthly"],["/pembayaran",0.3,"monthly"]
  ] as const;
  return pages.map(([path,priority,changeFrequency])=>({url:base+path,lastModified:new Date(),changeFrequency,priority}));
}