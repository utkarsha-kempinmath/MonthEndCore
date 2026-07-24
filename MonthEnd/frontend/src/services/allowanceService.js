import API from "./api";

export const getAllowance = () => API.get("/allowance");

export const addAllowance = (data) =>
  API.post("/allowance", data);

export const updateAllowance = (id, data) =>
  API.put(`/allowance/${id}`, data);

export const deleteAllowance = (id) =>
  API.delete(`/allowance/${id}`);