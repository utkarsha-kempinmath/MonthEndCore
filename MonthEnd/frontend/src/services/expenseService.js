import API from "./api";

export const addExpense = (data) => API.post("/expenses/add", data);

export const getExpenses = () => API.get("/expenses");

export const updateExpense = (id, data) =>
  API.put(`/expenses/${id}`, data);

export const deleteExpense = (id) =>
  API.delete(`/expenses/${id}`);