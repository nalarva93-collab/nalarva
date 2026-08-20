import type {Metadata} from "next";
import "./globals.css";

export const metadata:Metadata={
  metadataBase:new URL("https://nalarva.com"),
  title:{default:"Nalarva — Persiapan TKA SD, SMP & SMA",template:"%s — Nalarva"},
  description:"Persiapan TKA SD, SMP, dan SMA dengan kelas terstruktur, materi, latihan, tryout, analisis hasil, dan pemantauan progres belajar.",
  applicationName:"Nalarva",
  keywords:["Nalarva","TKA","persiapan TKA","TKA SD","TKA SMP","TKA SMA","tryout TKA","kursus TKA"],
  alternates:{canonical:"/"},
  openGraph:{
    type:"website",locale:"id_ID",url:"https://nalarva.com",siteName:"Nalarva",
    title:"Nalarva — Persiapan TKA SD, SMP & SMA",
    description:"Persiapan TKA yang terstruktur dengan kelas, materi, tryout, analisis, dan pemantauan progres."
  },
  twitter:{card:"summary",title:"Nalarva — Persiapan TKA",description:"Persiapan TKA SD, SMP, dan SMA yang terstruktur."},
  icons:{icon:"/icon.png"},
  manifest:"/site.webmanifest",
  robots:{index:true,follow:true}
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="id" data-scroll-behavior="smooth"><body>{children}</body></html>
}