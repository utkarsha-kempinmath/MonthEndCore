import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 15 },
  title: { fontSize: 24, fontWeight: "bold" },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 8, fontWeight: '600' },
  input: { padding: 15, borderRadius: 12, elevation: 1 },
  button: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  eventCard: { padding: 15, borderRadius: 15, marginBottom: 10, elevation: 2 },
  heroSection: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, marginBottom: 10 },
heroTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
heroSub: { fontSize: 13, lineHeight: 18 },
formCard: { padding: 20, borderRadius: 20, elevation: 2, shadowOpacity: 0.1 },
dateSelector: { 
  flexDirection: 'row', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  borderWidth: 1, 
  borderColor: '#eee', 
  padding: 12, 
  borderRadius: 10 
},
typeGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
typeButton: { padding: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 10, width: '23%', alignItems: 'center' },
typeSelected: { borderColor: COLORS.accentOrange, backgroundColor: '#FFF5F0' },
submitBtn: { backgroundColor: '#8FB9B3', padding: 15, borderRadius: 12, marginTop: 20, alignItems: 'center' },
submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});