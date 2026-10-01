import type { Role } from "./types";

/** Where each kind of account lands after sign-in and when it clicks the logo. */
export const homeFor = (role: Role) => (role === "company" ? "/company" : "/home");
