import { StyleSheet } from "react-native";

const sellStyles = StyleSheet.create({

  // ─── Screen ───────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: "#fbf8ff",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fbf8ff",
  },

  // ─── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: "rgba(251,248,255,0.97)",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e4e4f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e1b4b",
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f2ff",
  },
  postHeaderBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#0040e0",
  },
  postHeaderText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // ─── Section ──────────────────────────────────────────────────────────────
  section: {
    marginBottom: 28,
  },
  sectionHeading: {
    fontWeight: "800",
    fontSize: 20,
    color: "#191b24",
    marginBottom: 16,
    letterSpacing: -0.3,
  },

  // ─── Field Label ──────────────────────────────────────────────────────────
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#747688",
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 2,
  },

  // ─── Inputs ───────────────────────────────────────────────────────────────
  inputBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e4e4f0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#191b24",
    fontWeight: "500",
    marginBottom: 14,
  },
  inputMultiline: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e4e4f0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#191b24",
    fontWeight: "500",
    marginBottom: 14,
    height: 110,
    textAlignVertical: "top",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e4e4f0",
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  inputRowText: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#191b24",
    fontWeight: "500",
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: "700",
    color: "#434656",
    marginRight: 4,
  },

  // ─── Image Upload ─────────────────────────────────────────────────────────
  uploadBox: {
    borderWidth: 2,
    borderColor: "rgba(0,64,224,0.2)",
    borderStyle: "dashed",
    borderRadius: 20,
    paddingVertical: 36,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    marginBottom: 14,
  },
  uploadIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#f0f0ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  uploadTitle: {
    fontWeight: "700",
    fontSize: 17,
    color: "#191b24",
  },
  uploadSub: {
    fontSize: 13,
    color: "#747688",
    marginTop: 4,
  },
  previewRow: {
    marginTop: 4,
    marginBottom: 8,
  },
  previewThumb: {
    width: 90,
    height: 90,
    borderRadius: 14,
    marginRight: 10,
    overflow: "hidden",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  removeBtn: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    padding: 4,
  },
  addMoreThumb: {
    width: 90,
    height: 90,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#c4c5d9",
    backgroundColor: "#f3f2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  // ─── Bottom Sheet shared ──────────────────────────────────────────────────
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#191b24",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f2ff",
    alignItems: "center",
    justifyContent: "center",
  },

  // ─── Image Options ────────────────────────────────────────────────────────
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
    gap: 14,
  },
  optionIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#f0f0ff",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#191b24",
  },
  optionSub: {
    fontSize: 12,
    color: "#747688",
    marginTop: 2,
  },

  // ─── Category Dropdown ────────────────────────────────────────────────────
  triggerBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#e4e4f0",
    marginBottom: 14,
  },
  triggerText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#191b24",
    flex: 1,
  },
  triggerPlaceholder: {
    fontSize: 15,
    fontWeight: "400",
    color: "#aaa",
    flex: 1,
  },
  dropdownSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 16,
  maxHeight: "65%",
  zIndex: 999,
  elevation: 10, 
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f4f4f4",
  },
  dropdownItemActive: {
    backgroundColor: "#f0f4ff",
    borderRadius: 12,
    borderBottomWidth: 0,
    marginBottom: 2,
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#444",
    fontWeight: "500",
  },
  dropdownItemTextActive: {
    color: "#0040e0",
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    color: "#747688",
    paddingVertical: 24,
    fontSize: 14,
  },

  // ─── Condition Chips ──────────────────────────────────────────────────────
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f1f3f6",
    borderWidth: 1,
    borderColor: "#e4e4f0",
  },
  chipActive: {
    backgroundColor: "#0040e0",
    borderColor: "#0040e0",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  chipTextActive: {
    color: "#fff",
  },

  // ─── Bottom Bar ───────────────────────────────────────────────────────────
  bottomBar: {
    
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 14,
    backgroundColor: "rgba(251,248,255,0.95)",
    borderTopWidth: 0.5,
    borderTopColor: "#e4e4f0",
  },
  submitBtn: {
    backgroundColor: "#0040e0",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#0040e0",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  // ─── Terms ────────────────────────────────────────────────────────────────
  termsBox: {
    backgroundColor: "rgba(237,237,250,0.7)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  termsText: {
    fontSize: 12,
    color: "#434656",
    lineHeight: 18,
    textAlign: "center",
  },
  termsLink: {
    color: "#0040e0",
    fontWeight: "600",
  },
});

export default sellStyles;