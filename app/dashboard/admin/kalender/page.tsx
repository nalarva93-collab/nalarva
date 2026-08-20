"use client";
import DashboardShell from "@/components/DashboardShell";
import AcademicCalendar from "@/components/dashboard/AcademicCalendar";
import {ADMIN_NAV} from "@/lib/dashboard-nav";
export default function Page(){return <DashboardShell accessRole="ADMIN" role="Admin" name="Admin Nalarva" initials="AD" nav={ADMIN_NAV}><AcademicCalendar canCreate={true}/></DashboardShell>}