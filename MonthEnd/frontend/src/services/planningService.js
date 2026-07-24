import API from "./api";

const getCurrentMonth = () => new Date().toISOString().slice(0, 7); // "2025-04"

export const savePlan = (data) => API.post("/planning", data);

export const getPlan = () => API.get(`/planning?month=${getCurrentMonth()}`);