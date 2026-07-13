"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Project = {
  project_id: string;
  name: string;
};

type Person = {
  person_id: string;
  name: string;
};

export default function ProjectBlockerForm() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    project_id: "",
    project_name: "",
    person_id: "",
    person_name: "",
    raised_by: "",
    blocker_title: "",
    blocker_description: "",
    assigned_to_resolve: "",
    blocker_status: "Open",
  });

  useEffect(() => {
    async function loadData() {
      const [projectsRes, peopleRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/people"),
      ]);

      const projectsJson = await projectsRes.json();
      const peopleJson = await peopleRes.json();

      setProjects(projectsJson.data || []);
      setPeople(peopleJson.data || []);
    }

    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    const response = await fetch("/api/blockers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      router.push("/blockers");
      router.refresh();
    } else {
      alert("Failed to create blocker.");
    }

    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

        {/* Project */}
        <div>
          <label className="mb-2 block text-sm font-medium !text-slate-700">
            Project
          </label>

          <select
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 !text-slate-900"
            value={form.project_id}
            onChange={(e) => {
              const project = projects.find(
                (p) => p.project_id === e.target.value
              );

              setForm({
                ...form,
                project_id: e.target.value,
                project_name: project?.name || "",
              });
            }}
          >
            <option value="">Select Project</option>

            {projects.map((project) => (
              <option
                key={project.project_id}
                value={project.project_id}
              >
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Raised By */}
<div>
  <label className="mb-2 block text-sm font-medium !text-slate-700">
    Raised By
  </label>

  <select
    required
    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 !text-slate-900"
    value={form.raised_by}
    onChange={(e) =>
      setForm({
        ...form,
        raised_by: e.target.value,
      })
    }
  >
    <option value="">Select Person</option>

    {people.map((person) => (
      <option
        key={person.person_id}
        value={person.name}
      >
        {person.name}
      </option>
    ))}
  </select>
</div>

        {/* Assigned To */}
        <div>
          <label className="mb-2 block text-sm font-medium !text-slate-700">
            Assigned To
          </label>

          <select
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 !text-slate-900"
            value={form.person_id}
            onChange={(e) => {
  const person = people.find(
    (p) => p.person_id === e.target.value
  );

  setForm({
    ...form,
    person_id: e.target.value,
    person_name: person?.name || "",
    assigned_to_resolve: person?.name || "",
  });
}}
          >
            <option value="">Select Person</option>

            {people.map((person) => (
              <option
                key={person.person_id}
                value={person.person_id}
              >
                {person.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Title */}
      <div>
        <label className="mb-2 block text-sm font-medium !text-slate-700">
          Blocker Title
        </label>

        <input
          required
          type="text"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 !text-slate-900 placeholder:text-slate-400"
          value={form.blocker_title}
          onChange={(e) =>
            setForm({
              ...form,
              blocker_title: e.target.value,
            })
          }
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-medium !text-slate-700">
          Description
        </label>

        <textarea
          required
          rows={5}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 !text-slate-900 placeholder:text-slate-400"
          value={form.blocker_description}
          onChange={(e) =>
            setForm({
              ...form,
              blocker_description: e.target.value,
            })
          }
        />
      </div>

      {/* Status */}
      <div>
        <label className="mb-2 block text-sm font-medium !text-slate-700">
          Status
        </label>

        <select
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 !text-slate-900"
          value={form.blocker_status}
          onChange={(e) =>
            setForm({
              ...form,
              blocker_status: e.target.value,
            })
          }
        >
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/blockers")}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-slate-950 px-5 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create Blocker"}
        </button>
      </div>
    </form>
  );
}