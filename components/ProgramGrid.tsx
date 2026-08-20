import Image from "next/image";
import Link from "next/link";
import {programs} from "@/lib/data";
export default function ProgramGrid(){return <div className="program-grid">{programs.map((p,idx)=><article className="program-card" key={p.slug}>
  <div className="program-photo"><Image src={p.image} alt={p.title} fill sizes="(max-width: 900px) 100vw, 33vw"/><span className={`level ${p.tone}`}>{p.level}</span><span className="program-index">0{idx+1}</span></div>
  <div className="program-body"><small>{p.label}</small><h3>{p.title}</h3><p>{p.desc}</p><ul>{p.items.map(x=><li key={x}>{x}</li>)}</ul><Link href={`/program/${p.slug}`}>Jelajahi program <span>→</span></Link></div>
</article>)}</div>}
