"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠", roles: "all" },
  { href: "/timesheets/new", label: "New Timesheet", icon: "➕", roles: "employee" },
  { href: "/dashboard/manager", label: "Team Timesheets", icon: "👥", roles: "manager" },
  { href: "/dashboard/gwen", label: "Approval Queue", icon: "✅", roles: "gwen" },
  { href: "/dashboard/executive", label: "Org Overview", icon: "📊", roles: "executive" },
  { href: "/notifications", label: "Notifications", icon: "🔔", roles: "all" },
  { href: "/profile", label: "My Profile", icon: "👤", roles: "all" },
  { href: "/audit", label: "Audit Logs", icon: "📋", roles: "executive" },
];

const EXECUTIVE_ROLES = [
  UserRole.DIRECTOR,
  UserRole.COMMISSIONER,
  UserRole.HR_LEAD,
  UserRole.CITO,
  UserRole.ADMIN,
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const role = session.user.role;

  const filtered = navItems.filter((item) => {
    if (item.roles === "all") return true;
    if (item.roles === "employee")
      return ([UserRole.EMPLOYEE, ...EXECUTIVE_ROLES] as string[]).includes(role);
    if (item.roles === "manager") return role === UserRole.MANAGER;
    if (item.roles === "gwen") return role === UserRole.GWEN;
    if (item.roles === "executive") return (EXECUTIVE_ROLES as string[]).includes(role);
    return false;
  });

  return (
    <aside className="hidden w-56 shrink-0 md:block">
      <nav className="sticky top-16 flex flex-col gap-1 pt-4">
        {filtered.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "bg-primary-50 text-primary-700 font-medium"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
