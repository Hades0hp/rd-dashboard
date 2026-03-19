export type PersonStatus = "Active" | "Inactive";

export type Person = {
  person_id: string;
  name: string;
  role?: string;
  email?: string;
  status: PersonStatus;
  created_at: string;
  updated_at: string;
};
