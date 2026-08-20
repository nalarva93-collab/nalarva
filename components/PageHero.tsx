export default function PageHero({eyebrow,title,desc}:{eyebrow:string;title:string;desc:string}){
  return <section className="page-hero">
    <div className="page-hero-glow"/>
    <div className="container narrow page-hero-inner">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{desc}</p>
    </div>
  </section>
}
