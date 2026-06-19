import axios from "axios";

// Base URL comes from the environment:
//  - dev: empty string, so requests go to "/products" and Vite proxies them
//  - production: the deployed backend URL injected at build time as VITE_API_URL
const baseURL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({ baseURL });

// Turn a backend error into a single human-readable string. FastAPI returns
// errors in two shapes: {detail: "..."} for our raised errors, and
// {detail: [{msg, loc}, ...]} for validation (422) errors.
export function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => `${d.loc?.slice(1).join(".")}: ${d.msg}`).join(", ");
  }
  return error?.message ?? "Something went wrong. Please try again.";
}
