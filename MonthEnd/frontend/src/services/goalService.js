import API from "./api";

export const getGoals = () => API.get("/goal");

export const createGoal = (data) => API.post("/goal", data);

export const getGoalAnalysis = (id) =>
  API.get(`/goal/${id}`);

export const updateGoal = (id, data) =>
  API.put(`/goal/${id}`, data);

export const deleteGoal = (id) =>
  API.delete(`/goal/${id}`); 