import AccountSettings from "@/components/dashboard/AccountSettings";
import {ADMIN_NAV} from "@/lib/dashboard-nav";
export default function Page(){return <AccountSettings accessRole="ADMIN" role="Administrator" nav={ADMIN_NAV}/>}
