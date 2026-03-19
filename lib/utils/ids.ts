import { v4 as uuidv4 } from "uuid";

export function createId(prefix: string): string {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}
