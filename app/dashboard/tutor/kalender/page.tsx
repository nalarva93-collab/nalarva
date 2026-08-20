"use client";
import DashboardShell from "@/components/DashboardShell";
import AcademicCalendar from "@/components/dashboard/AcademicCalendar";
import {TUTOR_NAV} from "@/lib/dashboard-nav";
export default function Page(){return <DashboardShell accessRole="TUTOR" role="Tutor" name="Tutor Nalarva" initials="TU" nav={TUTOR_NAV}><AcademicCalendar canCreate={false}/></DashboardShell>}