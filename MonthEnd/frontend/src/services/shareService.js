import API from "./api";

// Assuming you'll eventually want to fetch the existing config when the page loads
export const getShareConfig = () => {
    return API.get("/share/config"); // (Add this simple GET route to your backend later if you want to load saved settings)
};

export const configureSharing = (data) => {
    return API.post("/share/configure", data);
};

export const toggleSharing = () => {
    return API.post("/share/toggle");
};