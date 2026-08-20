"use client";
import DashboardShell from "@/components/DashboardShell";
import NotificationsCenter from "@/components/dashboard/NotificationsCenter";
import {STUDENT_NAV} from "@/lib/dashboard-nav";
export default function Page(){
  return <DashboardShell accessRole="SISWA" role="Siswa · TKA" name="Siswa Nalarva" initials="SN" nav={STUDENT_NAV}>
    <NotificationsCenter/>
  </DashboardShell>
}