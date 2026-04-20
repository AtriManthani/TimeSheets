"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [managers, setManagers] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    title: "",
    department: "",
    managerId: "",
    phone: "",
    employeeNumber: "",
  });

  useEffect(() => {
    fetch("/api/users/managers")
      .then((r) => r.json())
      .then((data) =>
        setManagers(data.map((m: any) => ({ value: m.id, label: `${m.name} (${m.email})` })))
      )
      .catch(() => {});
  }, []);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : Object.values(data.error?.fieldErrors ?? {}).flat().join("; ") ||
              "Registration failed";
        setError(msg);
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Create your account</h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input id="name" label="Full Name" value={form.name} onChange={set("name")} required placeholder="Jane Smith" />
          <Input id="employeeNumber" label="Employee # (optional)" value={form.employeeNumber} onChange={set("employeeNumber")} placeholder="EMP001" />
        </div>
        <Input id="email" label="Work Email" type="email" value={form.email} onChange={set("email")} required placeholder="jane@its.org" />
        <Input id="password" label="Password" type="password" value={form.password} onChange={set("password")} required placeholder="Min 8 chars, 1 uppercase, 1 number"
          hint="Minimum 8 characters, one uppercase letter, one number"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input id="title" label="Job Title" value={form.title} onChange={set("title")} required placeholder="Systems Analyst" />
          <Input id="department" label="Department" value={form.department} onChange={set("department")} required placeholder="Information Technology" />
        </div>
        <Input id="phone" label="Phone (optional)" type="tel" value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" />
        <Select
          id="managerId"
          label="Reporting Manager"
          value={form.managerId}
          onChange={set("managerId")}
          options={managers}
          placeholder="Select your manager..."
        />
        <Button type="submit" loading={loading} className="w-full">
          Create Account
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-primary-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
