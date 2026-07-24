import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDE3D1",
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#3A2E2E",
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    color: "#6B5E5E",
    marginBottom: 5,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#D6C1E5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  emotionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },

  emotionChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#EBCFC8",
    margin: 5,
  },

  selectedChip: {
    backgroundColor: "#B79ACD",
  },

  emotionText: {
    color: "#3A2E2E",
  },

  selectedText: {
    color: "#fff",
    fontWeight: "600",
  },

  button: {
    marginTop: 30,
    backgroundColor: "#F26A21",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  historyCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
  },
  historyCategory: { fontWeight: "bold", fontSize: 16, color: "#333" },
  historyDate: { fontSize: 12, color: "#666" },
  historyAmount: { fontSize: 18, fontWeight: "bold", color: "#F26A21" },
  historyEmotion: { fontSize: 12, color: "#B79ACD", fontStyle: "italic" },
});