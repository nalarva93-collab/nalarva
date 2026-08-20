"use client";
import DashboardShell from "@/components/DashboardShell";
import MessagesCenter from "@/components/dashboard/MessagesCenter";
import {STUDENT_NAV} from "@/lib/dashboard-nav";
export default function Page(){return <DashboardShell accessRole="SISWA" role="Siswa" name="Siswa Nalarva" initials="SN" nav={STUDENT_NAV}><MessagesCenter/></DashboardShell>}