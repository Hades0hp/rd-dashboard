"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Person = {
  person_id: string;
  name?: string;
  person_name?: string;
};

type Project = {
  project_id: string;
  name?: string;
  project_name?: string;
};

type Objective = {
  objective_id: string;
  project_id: string;
  name?: string;
  objective_name?: string;
};

type FormState = {
  date: string;
  person_id: string;
  person_name: string;
  project_id: string;
  project_name: string;
  objective_id: string;
  objective_name: string;
  description: string;
  task_type: string;
  status: string;
  effort_hours: string;
  blocker_flag: boolean;
  blocker_title: string;
  blocker_description: string;
  assigned_to_resolve: string;
  blocker_status: string;
  resolution_notes: string;
  insight: string;
};

const initialForm: FormState = {
  date: new Date().toISOString().slice(0, 10),
  person_id: "",
  person_name: "",
  project_id: "",
  project_name: "",
  objective_id: "",
  objective_name: "",
  description: "",
  task_type: "Analysis",
  status: "Done",
  effort_hours: "",
  blocker_flag: false,
  blocker_title: "",
  blocker_description: "",
  assigned_to_resolve: "",
  blocker_status: "Open",
  resolution_notes: "",
  insight: "",
};

export default function TaskForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialForm);
  const [people, setPeople] = useState<Person[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadMasterData() {
      try {
        const [peopleRes, projectsRes, objectivesRes] = await Promise.all([
          fetch("/api/people", { cache: "no-store" }),
          fetch("/api/projects", { cache: "no-store" }),
          fetch("/api/objectives", { cache: "no-store" }),
        ]);

        const peopleJson = await peopleRes.json();
        const projectsJson = await projectsRes.json();
        const objectivesJson = await objectivesRes.json();

        setPeople(peopleJson?.data || []);
        setProjects(projectsJson?.data || []);
        setObjectives(objectivesJson?.data || []);
      } catch (error) {
        console.error("Error loading form master data:", error);
      }
    }

    loadMasterData();
  }, []);

  const filteredObjectives = useMemo(() => {
    if (!form.project_id) return objectives;
    return objectives.filter((obj) => obj.project_id === form.project_id);
  }, [objectives, form.project_id]);

  function handlePersonChange(personId: string) {
    const selectedPerson = people.find((p) => p.person_id === personId);
    setForm((prev) => ({
      ...prev,
      person_id: personId,
      person_name: selectedPerson?.name || selectedPerson?.person_name || "",
    }));
  }

  function handleProjectChange(projectId: string) {
    const selectedProject = projects.find((p) => p.project_id === projectId);
    setForm((prev) => ({
      ...prev,
      project_id: projectId,
      project_name: selectedProject?.name || selectedProject?.project_name || "",
      // Reset objective when project changes
      objective_id: "",
      objective_name: "",
    }));
  }

  function handleObjectiveChange(objectiveId: string) {
    const selectedObjective = objectives.find(
      (o) => o.objective_id === objectiveId
    );
    setForm((prev) => ({
      ...prev,
      objective_id: objectiveId,
      objective_name:
        selectedObjective?.name || selectedObjective?.objective_name || "",
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    if (form.blocker_flag) {
      if (!form.blocker_title.trim()) {
        alert("Blocker Title is required.");
        setSubmitting(false);
        return;
      }
      if (!form.blocker_description.trim()) {
        alert("Blocker Description is required.");
        setSubmitting(false);
        return;
      }
      if (!form.assigned_to_resolve.trim()) {
        alert("Assigned To Resolve is required.");
        setSubmitting(false);
        return;
      }
      if (!form.blocker_status.trim()) {
        alert("Blocker Status is required.");
        setSubmitting(false);
        return;
      }
      if (form.blocker_status === "Resolved" && !form.resolution_notes.trim()) {
        alert("Resolution Notes are required when blocker status is Resolved.");
        setSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json?.error || "Failed to create task");
        setSubmitting(false);
        return;
      }

      router.push("/tasks");
      router.refresh();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Date *
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Team Member *
          </label>
          <select
            value={form.person_id}
            onChange={(e) => handlePersonChange(e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none"
            required
          >
            <option value="">Select team member</option>
            {people.map((person) => (
              <option key={person.person_id} value={person.person_id}>
                {person.name || person.person_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Project *
          </label>
          <select
            value={form.project_id}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none"
            required
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.name || project.project_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`mb-2 block text-sm font-medium ${form.project_id ? "text-slate-700" : "text-slate-400"}`}>
            Objective *
          </label>
          <select
            value={form.objective_id}
            onChange={(e) => handleObjectiveChange(e.target.value)}
            disabled={!form.project_id}
            className={`h-12 w-full rounded-2xl border px-4 text-base outline-none transition-colors ${
              form.project_id
                ? "border-slate-300 bg-white text-slate-900 cursor-pointer"
                : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
            required
          >
            <option value="">
              {form.project_id ? "Select objective" : "Select a project first"}
            </option>
            {filteredObjectives.map((objective) => (
              <option key={objective.objective_id} value={objective.objective_id}>
                {objective.name || objective.objective_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Task Type
          </label>
          <select
            value={form.task_type}
            onChange={(e) => setForm({ ...form, task_type: e.target.value })}
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none"
          >
            <option value="Analysis">Analysis</option>
            <option value="Testing">Testing</option>
            <option value="Development">Development</option>
            <option value="Fabrication">Fabrication</option>
            <option value="Procurement">Procurement</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none"
          >
            <option value="Done">Done</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Description *
        </label>
        <textarea spellCheck={true}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe the task completed"
          className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none"
          required
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Effort Hours
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={form.effort_hours}
            onChange={(e) => setForm({ ...form, effort_hours: e.target.value })}
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          What did you learn from this work?
        </label>
        <textarea spellCheck={true}
          value={form.insight}
          onChange={(e) => setForm({ ...form, insight: e.target.value })}
          placeholder="What did you learn from this work?"
          className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none"
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <label className="flex items-center gap-3 text-base font-medium text-slate-800">
          <input
            type="checkbox"
            checked={form.blocker_flag}
            onChange={(e) =>
              setForm({
                ...form,
                blocker_flag: e.target.checked,
                blocker_status: e.target.checked ? form.blocker_status || "Open" : "Open",
                resolution_notes: e.target.checked ? form.resolution_notes : "",
              })
            }
            className="h-4 w-4"
          />
          Mark this task as blocked
        </label>

        {form.blocker_flag && (
          <div className="mt-5 grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Blocker Title *
              </label>
              <input
                value={form.blocker_title}
                onChange={(e) => setForm({ ...form, blocker_title: e.target.value })}
                placeholder="Enter blocker title"
                className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 outline-none"
                required={form.blocker_flag}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Blocker Description *
              </label>
              <textarea spellCheck={true}
                value={form.blocker_description}
                onChange={(e) => setForm({ ...form, blocker_description: e.target.value })}
                placeholder="Describe what is blocking this task"
                className="min-h-[110px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none"
                required={form.blocker_flag}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Assigned To Resolve *
                </label>
                <select
                  value={form.assigned_to_resolve}
                  onChange={(e) => setForm({ ...form, assigned_to_resolve: e.target.value })}
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none"
                  required={form.blocker_flag}
                >
                  <option value="">Select assignee</option>
                  {people.map((person) => {
                    const personLabel = person.name || person.person_name || person.person_id;
                    return (
                      <option key={person.person_id} value={personLabel}>
                        {personLabel}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Blocker Status *
                </label>
                <select
                  value={form.blocker_status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      blocker_status: e.target.value,
                      resolution_notes:
                        e.target.value === "Resolved" ? form.resolution_notes : "",
                    })
                  }
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none"
                  required={form.blocker_flag}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            {form.blocker_status === "Resolved" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Resolution Notes *
                </label>
                <textarea spellCheck={true}
                  value={form.resolution_notes}
                  onChange={(e) => setForm({ ...form, resolution_notes: e.target.value })}
                  placeholder="Add resolution notes"
                  className="min-h-[100px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none"
                  required={form.blocker_flag && form.blocker_status === "Resolved"}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-6">
        <p className="text-sm text-slate-500">
          Fields marked with * are required.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-base font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create Task"}
        </button>
      </div>
    </form>
  );
}