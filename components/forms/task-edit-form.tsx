"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Project = {
  project_id: string;
  name: string;
};

type Objective = {
  objective_id: string;
  project_id: string;
  objective_name: string;
};

type Person = {
  person_id: string;
  name: string;
};

type Task = {
  task_id: string;
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
  effort_hours?: number;
  blocker_flag: boolean;
  blocker_title?: string;
  blocker_description?: string;
  assigned_to_resolve?: string;
  blocker_status?: string;
  resolution_notes?: string;
  insight?: string;
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

const baseFieldClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-200";

const textareaClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-200 resize-none";

const labelClassName = "mb-2 block text-sm font-medium text-slate-700";

export default function TaskEditForm({ taskId }: { taskId: string }) {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    async function loadData() {
      try {
        const [taskRes, projectsRes, objectivesRes, peopleRes] =
          await Promise.all([
            fetch(`/api/tasks/${taskId}`),
            fetch("/api/projects"),
            fetch("/api/objectives"),
            fetch("/api/people"),
          ]);

        const taskJson = await taskRes.json();
        const projectsJson = await projectsRes.json();
        const objectivesJson = await objectivesRes.json();
        const peopleJson = await peopleRes.json();

        if (!taskJson.success || !taskJson.data) {
          setMessageType("error");
          setMessage("Task not found.");
          setPageLoading(false);
          return;
        }

        const task: Task = taskJson.data;

        setProjects(projectsJson.data || []);
        setObjectives(objectivesJson.data || []);
        setPeople(peopleJson.data || []);

        setForm({
          date: task.date,
          person_id: task.person_id,
          person_name: task.person_name,
          project_id: task.project_id,
          project_name: task.project_name,
          objective_id: task.objective_id,
          objective_name: task.objective_name,
          description: task.description,
          task_type: task.task_type || "Analysis",
          status: task.status || "Done",
          effort_hours: String(task.effort_hours ?? 0),
          blocker_flag: task.blocker_flag,
          blocker_title: task.blocker_title || "",
          blocker_description: task.blocker_description || "",
          assigned_to_resolve: task.assigned_to_resolve || "",
          blocker_status: task.blocker_status || "Open",
          resolution_notes: task.resolution_notes || "",
          insight: task.insight || "",
        });
      } catch (error) {
        console.error(error);
        setMessageType("error");
        setMessage("Failed to load task data.");
      } finally {
        setPageLoading(false);
      }
    }

    loadData();
  }, [taskId]);

  const filteredObjectives = useMemo(() => {
    if (!form?.project_id) return [];
    return objectives.filter(
      (objective) => objective.project_id === form.project_id,
    );
  }, [objectives, form?.project_id]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function handleProjectChange(projectId: string) {
    const selectedProject = projects.find((p) => p.project_id === projectId);
    setForm((prev) =>
      prev
        ? {
            ...prev,
            project_id: projectId,
            project_name: selectedProject?.name || "",
            objective_id: "",
            objective_name: "",
          }
        : prev,
    );
  }

  function handleObjectiveChange(objectiveId: string) {
    const selectedObjective = objectives.find(
      (o) => o.objective_id === objectiveId,
    );
    setForm((prev) =>
      prev
        ? {
            ...prev,
            objective_id: objectiveId,
            objective_name: selectedObjective?.objective_name || "",
          }
        : prev,
    );
  }

  function handlePersonChange(personId: string) {
    const selectedPerson = people.find((p) => p.person_id === personId);
    setForm((prev) =>
      prev
        ? {
            ...prev,
            person_id: personId,
            person_name: selectedPerson?.name || "",
          }
        : prev,
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    setMessage("");

    if (
      !form.person_id ||
      !form.project_id ||
      !form.objective_id ||
      !form.description.trim()
    ) {
      setMessageType("error");
      setMessage("Please fill all required fields.");
      return;
    }

    if (form.blocker_flag) {
      if (!form.blocker_title.trim()) {
        setMessageType("error");
        setMessage("Blocker Title is required.");
        return;
      }
      if (!form.blocker_description.trim()) {
        setMessageType("error");
        setMessage("Blocker Description is required.");
        return;
      }
      if (!form.assigned_to_resolve.trim()) {
        setMessageType("error");
        setMessage("Assigned To Resolve is required.");
        return;
      }
      if (form.blocker_status === "Resolved" && !form.resolution_notes.trim()) {
        setMessageType("error");
        setMessage("Resolution Notes are required when status is Resolved.");
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          effort_hours: form.effort_hours ? Number(form.effort_hours) : 0,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessageType("error");
        setMessage(result.error || "Failed to update task");
        return;
      }

      setMessageType("success");
      setMessage("Task updated successfully.");

      setTimeout(() => {
        router.push(`/tasks/${taskId}`);
      }, 800);
    } catch (error) {
      console.error(error);
      setMessageType("error");
      setMessage("Something went wrong while updating task.");
    } finally {
      setSaving(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm text-slate-500">Loading task...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm text-rose-600">{message || "Task not found."}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-white px-8 py-7">
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Edit
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Edit Task
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Update task details, project mapping, insights, blockers, and effort.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-8">
        <div className="space-y-10">

          {/* Basic Details */}
          <section>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Basic Details
            </h3>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelClassName}>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className={baseFieldClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Person *</label>
                <select
                  value={form.person_id}
                  onChange={(e) => handlePersonChange(e.target.value)}
                  className={baseFieldClassName}
                >
                  <option value="">Select person</option>
                  {people.map((person) => (
                    <option key={person.person_id} value={person.person_id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClassName}>Project *</label>
                <select
                  value={form.project_id}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className={baseFieldClassName}
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClassName}>Objective *</label>
                <select
                  value={form.objective_id}
                  onChange={(e) => handleObjectiveChange(e.target.value)}
                  className={baseFieldClassName}
                >
                  <option value="">Select objective</option>
                  {filteredObjectives.map((objective) => (
                    <option
                      key={objective.objective_id}
                      value={objective.objective_id}
                    >
                      {objective.objective_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Work Log */}
          <section>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Work Log
            </h3>
            <div className="space-y-5">
              <div>
                <label className={labelClassName}>Description *</label>
                <textarea spellCheck={true}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={6}
                  className={textareaClassName}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div>
                  <label className={labelClassName}>Task Type</label>
                  <select
                    value={form.task_type}
                    onChange={(e) => updateField("task_type", e.target.value)}
                    className={baseFieldClassName}
                  >
                    <option>Experiment</option>
                    <option>Development</option>
                    <option>Testing</option>
                    <option>Procurement</option>
                    <option>Fabrication</option>
                    <option>Analysis</option>
                  </select>
                </div>

                <div>
                  <label className={labelClassName}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateField("status", e.target.value)}
                    className={baseFieldClassName}
                  >
                    <option>Done</option>
                    <option>In Progress</option>
                    <option>Blocked</option>
                    <option>Dropped</option>
                  </select>
                </div>

                <div>
                  <label className={labelClassName}>Effort Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.effort_hours}
                    onChange={(e) => updateField("effort_hours", e.target.value)}
                    className={baseFieldClassName}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Learnings & Blockers */}
          <section>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Learnings & Blockers
            </h3>

            <div className="space-y-5">
              <div>
                <label className={labelClassName}>Insight</label>
                <textarea spellCheck={true}
                  value={form.insight}
                  onChange={(e) => updateField("insight", e.target.value)}
                  rows={5}
                  className={textareaClassName}
                />
              </div>

              {/* Blocker section — matches create form exactly */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <label className="flex items-center gap-3 text-base font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={form.blocker_flag}
                    onChange={(e) => {
                      updateField("blocker_flag", e.target.checked);
                      if (!e.target.checked) {
                        // clear blocker fields when unchecked
                        setForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                blocker_flag: false,
                                blocker_title: "",
                                blocker_description: "",
                                assigned_to_resolve: "",
                                blocker_status: "Open",
                                resolution_notes: "",
                              }
                            : prev,
                        );
                      }
                    }}
                    className="h-4 w-4"
                  />
                  Mark this task as blocked
                </label>

                {form.blocker_flag && (
                  <div className="mt-5 grid gap-5">
                    {/* Blocker Title */}
                    <div>
                      <label className={labelClassName}>Blocker Title *</label>
                      <input
                        value={form.blocker_title}
                        onChange={(e) =>
                          updateField("blocker_title", e.target.value)
                        }
                        placeholder="Enter blocker title"
                        className={baseFieldClassName}
                      />
                    </div>

                    {/* Blocker Description */}
                    <div>
                      <label className={labelClassName}>
                        Blocker Description *
                      </label>
                      <textarea spellCheck={true}
                        value={form.blocker_description}
                        onChange={(e) =>
                          updateField("blocker_description", e.target.value)
                        }
                        placeholder="Describe what is blocking this task"
                        rows={4}
                        className={textareaClassName}
                      />
                    </div>

                    {/* Assigned To + Status */}
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className={labelClassName}>
                          Assigned To Resolve *
                        </label>
                        <select
                          value={form.assigned_to_resolve}
                          onChange={(e) =>
                            updateField("assigned_to_resolve", e.target.value)
                          }
                          className={baseFieldClassName}
                        >
                          <option value="">Select assignee</option>
                          {people.map((person) => (
                            <option key={person.person_id} value={person.name}>
                              {person.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelClassName}>
                          Blocker Status *
                        </label>
                        <select
                          value={form.blocker_status}
                          onChange={(e) => {
                            setForm((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    blocker_status: e.target.value,
                                    resolution_notes:
                                      e.target.value === "Resolved"
                                        ? prev.resolution_notes
                                        : "",
                                  }
                                : prev,
                            );
                          }}
                          className={baseFieldClassName}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>
                    </div>

                    {/* Resolution Notes — only when Resolved */}
                    {form.blocker_status === "Resolved" && (
                      <div>
                        <label className={labelClassName}>
                          Resolution Notes *
                        </label>
                        <textarea spellCheck={true}
                          value={form.resolution_notes}
                          onChange={(e) =>
                            updateField("resolution_notes", e.target.value)
                          }
                          placeholder="Add resolution notes"
                          rows={4}
                          className={textareaClassName}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              {message ? (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                    messageType === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  {message}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Update the task and save changes.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push(`/tasks/${taskId}`)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}