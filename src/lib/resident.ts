import { FLOORS } from "./sorting/questions";

export type ResidentData = {
  discordId: string;
  username: string;
  archetype: string;
  relationshipType?: string;
  primaryFloorRoles: string[];
  gatewayFloorRoles: string[];
  joinedAt: string;
};

const STORAGE_KEY = "building_resident";

export function getResident(): ResidentData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    if (data.discordId && data.archetype) return data;
    return null;
  } catch {
    return null;
  }
}

export function setResident(data: ResidentData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearResident(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function decodeBase64Url(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

export function getFloorDisplay(roleName: string) {
  const match = roleName.match(/^floor-(\d+|b)-/);
  if (!match) return null;
  const num = match[1].toLowerCase() === "b" ? "B" : parseInt(match[1]);
  return FLOORS.find((f) => String(f.number) === String(num));
}
