import { api } from "./client";

export const ordersApi = {
  list: () => api.get("/orders").then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  create: (data) => api.post("/orders", data).then((r) => r.data),
  remove: (id) => api.delete(`/orders/${id}`),
};

export const dashboardApi = {
  summary: () => api.get("/dashboard").then((r) => r.data),
};
