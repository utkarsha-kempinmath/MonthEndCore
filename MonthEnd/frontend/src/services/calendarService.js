import API from "./api";

export const addEvent = (data) => API.post("/calendar", data);

export const getEvents = () => API.get("/calendar");

export const updateEvent = (id, data) =>
  API.patch(`/calendar/${id}`, data);

export const deleteEvent = (id) =>
  API.delete(`/calendar/${id}`);