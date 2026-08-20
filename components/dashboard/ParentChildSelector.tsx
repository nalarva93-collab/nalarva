"use client";
export type ParentChild={id:string;name:string;student_no?:string;level?:string;school?:string;program_name?:string};
export default function ParentChildSelector({children,value,onChange}:{children:ParentChild[];value:string;onChange:(v:string)=>void}){
  if(children.length<=1)return null;
  return <div className="parent-child-selector"><label>Anak yang dilihat<select value={value} onChange={e=>onChange(e.target.value)}>{children.map(c=><option value={c.id} key={c.id}>{c.name} · {c.student_no||c.level||"Siswa"}</option>)}</select></label></div>;
}
