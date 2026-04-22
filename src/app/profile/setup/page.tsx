"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const DEPARTMENTS = [
  "Information Technology",
  "Human Resources",
  "Finance",
  "Operations",
  "Administration",
  "Other",
];

const SPECIFIC_DEPARTMENTS = ["ITS", "UrbanAI", "311"];

export default function ProfileSetupPage() {
  const router = useRouter();
  const { update } = useSession();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    designation: "",
    managerFirstName: "",
    managerLastName: "",
    managerEmail: "",
    managerRole: "",
    hrLeadEmail: "",
    department: "",
    specificDepartment: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : Object.values((data.error as any)?.fieldErrors ?? {})
                .flat()
                .join("; ");
        setError(msg || "Failed to save profile");
        return;
      }

      // Update session so middleware sees profileComplete = true
      await update({ profileComplete: true });
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  const field = (label: string, key: keyof typeof form, type = "text", required = true) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        required={required}
      />
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Complete your profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            This information is required to submit timesheets. You only need to do this once.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {field("First name", "firstName")}
            {field("Last name", "lastName")}
          </div>

          {field("Job designation / title", "designation")}

          <hr className="border-gray-100" />
          <p className="text-sm font-medium text-gray-700">Manager information</p>

          <div className="grid grid-cols-2 gap-4">
            {field("Manager first name", "managerFirstName")}
            {field("Manager last name", "managerLastName")}
          </div>
          {field("Manager email", "managerEmail", "email")}
          {field("Manager role / title", "managerRole")}

          <hr className="border-gray-100" />

          {field("HR lead email", "hrLeadEmail", "email")}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specific department / unit
            </label>
            <select
              value={form.specificDepartment}
              onChange={(e) => set("specificDepartment", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select unit</option>
              {SPECIFIC_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save and continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
