"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [managers, setManagers] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState({
    title: "",
    department: "",
    phone: "",
    managerId: "",
    scheduleHours: "40",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/users/me").then((r) => r.json()),
      fetch("/api/users/managers").then((r) => r.json()),
    ]).then(([userData, managersData]) => {
      setUser(userData);
      setForm({
        title: userData.profile?.title ?? "",
        department: userData.profile?.department ?? "",
        phone: userData.profile?.phone ?? "",
        managerId: userData.managerOf?.manager?.id ?? "",
        scheduleHours: String(userData.profile?.scheduleHours ?? 40),
      });
      setManagers(managersData.map((m: any) => ({ value: m.id, label: `${m.name} (${m.email})` })));
    });
  }, []);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, scheduleHours: Number(form.scheduleHours) }),
      });
      if (!res.ok) {
        setError("Failed to save profile.");
        return;
      }
      setSaved(true);
    } catch {
      setError("An error occurred.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return <div className="animate-pulse text-gray-400 p-8">Loading profile...</div>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Name</span>
            <span className="font-medium">{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Role</span>
            <span className="font-medium">{user.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Employee #</span>
            <span className="font-medium">{user.profile?.employeeNumber ?? "–"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {saved && (
              <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                Profile saved successfully.
              </div>
            )}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <Input id="title" label="Job Title" value={form.title} onChange={set("title")} />
            <Input id="department" label="Department" value={form.department} onChange={set("department")} />
            <Input id="phone" label="Phone" type="tel" value={form.phone} onChange={set("phone")} />
            <Input id="scheduleHours" label="Scheduled Hours/Week" type="number" min="1" max="80"
              value={form.scheduleHours} onChange={set("scheduleHours")} />
            <Select
              id="managerId"
              label="Reporting Manager"
              value={form.managerId}
              onChange={set("managerId")}
              options={managers}
              placeholder="Select manager..."
            />
            <Button type="submit" loading={saving}>Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
