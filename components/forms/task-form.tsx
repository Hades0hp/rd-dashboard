"use client";

import { useEffect, useMemo, useState } from "react";

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
  blocker_description: string;
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
  blocker_description: "",
  insight: "",
};

const baseFieldClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-200";

const textareaClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-200 resize-none";

const labelClassName = "mb-2 block text-sm font-medium text-slate-700";

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </h3>
      {subtitle ? (
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

export default function TaskForm() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [projectsRes, objectivesRes, peopleRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/objectives"),
          fetch("/api/people"),
        ]);

        const projectsJson = await projectsRes.json();
        const objectivesJson = await objectivesRes.json();
        const peopleJson = await peopleRes.json();

        setProjects(projectsJson.data || []);
        setObjectives(objectivesJson.data || []);
        setPeople(peopleJson.data || []);
      } catch (error) {
        console.error("Failed to load form data", error);
        setMessageType("error");
        setMessage("Failed to load form data.");
      }
    }

    loadInitialData();
  }, []);

  const filteredObjectives = useMemo(() => {
    if (!form.project_id) return [];
    return objectives.filter(
      (objective) => objective.project_id === form.project_id,
    );
  }, [objectives, form.project_id]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleProjectChange(projectId: string) {
    const selectedProject = projects.find((p) => p.project_id === projectId);

    setForm((prev) => ({
      ...prev,
      project_id: projectId,
      project_name: selectedProject?.name || "",
      objective_id: "",
      objective_name: "",
    }));
  }

  function handleObjectiveChange(objectiveId: string) {
    const selectedObjective = objectives.find(
      (o) => o.objective_id === objectiveId,
    );

    setForm((prev) => ({
      ...prev,
      objective_id: objectiveId,
      objective_name: selectedObjective?.objective_name || "",
    }));
  }

  function handlePersonChange(personId: string) {
    const selectedPerson = people.find((p) => p.person_id === personId);

    setForm((prev) => ({
      ...prev,
      person_id: personId,
      person_name: selectedPerson?.name || "",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

    if (form.blocker_flag && !form.blocker_description.trim()) {
      setMessageType("error");
      setMessage("Please add blocker description.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          effort_hours: form.effort_hours ? Number(form.effort_hours) : 0,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessageType("error");
        setMessage(result.error || "Failed to create task");
        return;
      }

      setMessageType("success");
      setMessage("Task created successfully.");

      setForm({
        ...initialForm,
        date: new Date().toISOString().slice(0, 10),
        person_id: form.person_id,
        person_name: form.person_name,
      });
    } catch (error) {
      console.error(error);
      setMessageType("error");
      setMessage("Something went wrong while creating task.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-white px-8 py-7">
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          New Entry
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Add Task
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Capture daily work under a selected project and objective. Include
          learnings, blockers, and effort so the executive dashboard reflects
          actual progress.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-8">
        <div className="space-y-10">
          <section>
            <SectionHeader
              title="Basic Details"
              subtitle="Choose the team member, project, and objective for this work log."
            />

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
                  disabled={!form.project_id}
                  className={`${baseFieldClassName} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
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

          <section>
            <SectionHeader
              title="Work Log"
              subtitle="Describe the task clearly so it is useful later in reviews and executive summaries."
            />

            <div className="space-y-5">
              <div>
                <label className={labelClassName}>Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={6}
                  className={textareaClassName}
                  placeholder="Describe the work completed today..."
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
                    onChange={(e) =>
                      updateField("effort_hours", e.target.value)
                    }
                    className={baseFieldClassName}
                    placeholder="e.g. 2"
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <SectionHeader
              title="Learnings & Blockers"
              subtitle="Capture useful findings and surface issues that need attention."
            />

            <div className="space-y-5">
              <div>
                <label className={labelClassName}>Insight</label>
                <textarea
                  value={form.insight}
                  onChange={(e) => updateField("insight", e.target.value)}
                  rows={5}
                  className={textareaClassName}
                  placeholder="What did you learn from this work?"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={form.blocker_flag}
                    onChange={(e) =>
                      updateField("blocker_flag", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Mark this task as blocked
                </label>

                {form.blocker_flag && (
                  <div className="mt-4">
                    <label className={labelClassName}>
                      Blocker Description *
                    </label>
                    <textarea
                      value={form.blocker_description}
                      onChange={(e) =>
                        updateField("blocker_description", e.target.value)
                      }
                      rows={4}
                      className={textareaClassName}
                      placeholder="Describe what is blocking this task"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

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
                  Fields marked with * are required.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create Task"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
