import API from "./api";

export const getDashboard = () => API.get("/home/dashboard");

export const getAnalysis = () => API.get("/home/analysis");

export const getReflection = () => API.get("/home/reflection");