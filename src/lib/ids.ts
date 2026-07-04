import { nanoid } from "nanoid";

export const newViewId = () => nanoid(10);
export const newEditToken = () => nanoid(24);
export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : nanoid(21);
export const newMediaKey = () => nanoid(12);
