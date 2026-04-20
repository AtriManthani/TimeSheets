import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getNotificationsForUser } from "@/services/notification.service";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const notifications = await getNotificationsForUser(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <form action="/api/notifications" method="PATCH">
            <button
              type="button"
              className="text-sm text-primary-600 hover:underline"
              onClick={async () => {
                await fetch("/api/notifications", { method: "PATCH" });
                window.location.reload();
              }}
            >
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border p-4 ${
                n.isRead ? "border-gray-200 bg-white" : "border-primary-200 bg-primary-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-sm font-medium ${n.isRead ? "text-gray-700" : "text-gray-900"}`}>
                    {n.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.createdAt)}</p>
                </div>
                {n.relatedEntityType === "Timesheet" && n.relatedEntityId && (
                  <Link
                    href={`/timesheets/${n.relatedEntityId}`}
                    className="shrink-0 text-xs text-primary-600 hover:underline"
                  >
                    View
                  </Link>
                )}
                {!n.isRead && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
