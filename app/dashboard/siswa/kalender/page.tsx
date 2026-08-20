"use client";
import DashboardShell from "@/components/DashboardShell";
import AcademicCalendar from "@/components/dashboard/AcademicCalendar";
import {STUDENT_NAV} from "@/lib/dashboard-nav";
export default function Page(){return <DashboardShell accessRole="SISWA" role="Siswa" name="Siswa Nalarva" initials="SN" nav={STUDENT_NAV}><AcademicCalendar canCreate={false}/></DashboardShell>}