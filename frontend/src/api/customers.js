import { api } from "./client";

export const customersApi = {
  list: () => api.get("/customers").then((r) => r.data),
  get: (id) => api.get(`/customers/${id}`).then((r) => r.data),
  create: (data) => api.post("/customers", data).then((r) => r.data),
  remove: (id) => api.delete(`/customers/${id}`),
};
