"use client";
import Link from "next/link";
import Image from "next/image";
import {useState} from "react";

export default function Header(){
  const [open,setOpen]=useState(false);
  return <header className="site-header">
    <div className="container nav">
      <Link href="/" className="brand" aria-label="Nalarva">
        <Image src="/logo-horizontal.png" alt="Nalarva" width={360} height={80} loading="eager"/>
      </Link>
      <nav className={open?"nav-links open":"nav-links"}>
        <Link href="/program">Program</Link>
        <Link href="/tryout">Tryout</Link>
        <Link href="/paket">Paket</Link>
        <Link href="/tentang">Tentang</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/kontak">Kontak</Link>
      </nav>
      <div className="nav-actions">
        <Link className="btn ghost" href="/login">Masuk</Link>
        <Link className="btn primary" href="/daftar">Daftar Program</Link>
        <button className="menu" onClick={()=>setOpen(!open)} aria-label="Buka menu">☰</button>
      </div>
    </div>
  </header>
}
