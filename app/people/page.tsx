"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Person = {
  person_id: string;
  name: string;
  role: string;
  email: string;
  status: "Active" | "Inactive";
};

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  // create form
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPeople();
  }, []);

  async function loadPeople() {
    setLoading(true);
    try {
      const res = await fetch("/api/people");
      const json = await res.json();
      setPeople(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) return;

    setSaving(true);

    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          role,
          email,
          status,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setShowCreate(false);
        setName("");
        setRole("");
        setEmail("");
        setStatus("Active");
        loadPeople();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              People
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Team Members
            </h1>

            <p className="mt-3 text-base text-slate-600">
              Manage team members and their roles in projects.
            </p>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Add Member
          </button>
        </div>

        {/* CREATE FORM */}
        {showCreate && (
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow">
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <input
                  placeholder="Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-xl border px-3"
                />

                <input
                  placeholder="Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-11 rounded-xl border px-3"
                />

                <input
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border px-3"
                />

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "Active" | "Inactive")
                  }
                  className="h-11 rounded-xl border px-3"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-950 px-4 py-2 text-white"
                >
                  {saving ? "Saving..." : "Save"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABLE */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow">
          <table className="min-w-full">
            <thead className="border-b bg-slate-50">
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-sm">
                    Loading...
                  </td>
                </tr>
              ) : people.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-sm">
                    No people added yet
                  </td>
                </tr>
              ) : (
                people.map((p) => (
                  <tr key={p.person_id} className="border-b">
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {p.name}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {p.role || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {p.email || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          p.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/people/${p.person_id}/edit`}
                        className="text-sm font-medium text-slate-900 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
