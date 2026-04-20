import { redirect } from "next/navigation";
import { getSession, canViewOrgWideData } from "@/lib/auth";
import { getAuditLogs } from "@/services/audit.service";
import { formatDateTime } from "@/lib/utils";

export default async function AuditPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canViewOrgWideData(session.user.role)) redirect("/dashboard");

  const logs = await getAuditLogs(session.user.role, { limit: 200 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Complete workflow audit trail</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Timestamp</th>
              <th className="px-4 py-3 text-left">Actor</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Entity</th>
              <th className="px-4 py-3 text-left">Entity ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No audit logs found</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                <td className="px-4 py-2">{(log as any).actor?.name ?? log.actorEmail ?? "System"}</td>
                <td className="px-4 py-2 font-mono text-xs">{log.action}</td>
                <td className="px-4 py-2">{log.entityType}</td>
                <td className="px-4 py-2 font-mono text-xs text-gray-400 max-w-[120px] truncate">{log.entityId ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
