// Team roles and what each may do (issue #18). Safe to import in client components.
// The server checks these in every admin action (requireAdmin); the screens only hide what a role can't use.

export type Role = "owner" | "editor" | "viewer";
export type Permission = "edit" | "delete" | "team";

export const ROLES: readonly { value: Role; label: string; hint: string }[] = [
  { value: "owner", label: "Owner", hint: "Everything, including deleting, the team and the activity log." },
  { value: "editor", label: "Editor", hint: "Adds and edits businesses and services, uploads photos and works the inboxes. Can't delete or manage the team." },
  { value: "viewer", label: "Viewer", hint: "Sees everything in the admin but can't change anything." },
];

const ALLOWED: Record<Role, readonly Permission[]> = {
  owner: ["edit", "delete", "team"],
  editor: ["edit"],
  viewer: [],
};

export const isRole = (r: string): r is Role => r in ALLOWED;
export const can = (role: string, p: Permission) => isRole(role) && ALLOWED[role].includes(p);
export const roleLabel = (r: string) => ROLES.find((x) => x.value === r)?.label ?? r;
/** "an owner", "an editor", "a viewer": for sentences. */
export const aRole = (r: string) => `${r === "viewer" ? "a" : "an"} ${roleLabel(r).toLowerCase()}`;
