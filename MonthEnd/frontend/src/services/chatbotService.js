import API from "./api";

export const sendChatMessage = (question) => {
    return API.post("/chat", { question });
};