"use client";
import DashboardShell from "@/components/DashboardShell";
import NotificationsCenter from "@/components/dashboard/NotificationsCenter";
import {ADMIN_NAV} from "@/lib/dashboard-nav";
export default function Page(){
  return <DashboardShell accessRole="ADMIN" role="Administrator" name="Admin Nalarva" initials="AD" nav={ADMIN_NAV}>
    <NotificationsCenter/>
  </DashboardShell>
}