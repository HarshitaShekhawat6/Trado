import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, StyleSheet,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import apiClient from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

const StateDropdown = ({ value, onChange, editable = true }) => {
  const [states,    setStates]    = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [query,     setQuery]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [isOpen,    setIsOpen]    = useState(false);

  const normalizeState = (item, index) => {
    const stateName =
      typeof item === "string"
        ? item
        : item?.state_name || item?.name || item?.state || item?.title || "";

    return {
      id: item?.id || item?._id || stateName || index,
      state_name: String(stateName).trim(),
    };
  };

  const getStatesFromResponse = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.states)) return data.states;
    if (Array.isArray(data?.data?.states)) return data.data.states;
    return [];
  };

  const filterStates = (list, text) => {
    const q = text.trim().toLowerCase();
    if (!q) return list;

    return list
      .filter((item) => item.state_name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aName = a.state_name.toLowerCase();
        const bName = b.state_name.toLowerCase();
        const aStarts = aName.startsWith(q);
        const bStarts = bName.startsWith(q);

        if (aStarts === bStarts) return aName.localeCompare(bName);
        return aStarts ? -1 : 1;
      });
  };

  // Fetch once on mount
  useEffect(() => {
    const fetchStates = async () => {
      setLoading(true);
      try {
        let res;
        try {
          res = await apiClient.get(ENDPOINTS.STATES);
        } catch (statesErr) {
          if (ENDPOINTS.STATES === "/states") throw statesErr;
          res = await apiClient.get("/states");
        }

        const data = getStatesFromResponse(res.data)
          .map(normalizeState)
          .filter((item) => item.state_name);

        setStates(data);
        setFiltered(data);
      } catch (err) {
        console.log("[StateDropdown] fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStates();
  }, []);

  const handleOpen = () => {
    if (!editable) return;
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setQuery("");
    setFiltered(states);
    setIsOpen(true);
  };

  const handleSearch = (text) => {
    setQuery(text);
    setFiltered(filterStates(states, text));
  };

  const handleSelect = (state) => {
    onChange(state.state_name);
    setIsOpen(false);
    setQuery("");
    setFiltered(states);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
    setQuery("");
    setFiltered(states);
  };

  return (
    <View style={s.wrapper}>
      <Text style={s.label}>State</Text>

      {/* Trigger */}
      <TouchableOpacity
        style={[s.trigger, !editable && s.triggerDisabled, isOpen && s.triggerOpen]}
        onPress={handleOpen}
        activeOpacity={editable ? 0.7 : 1}
      >
        <Text style={[s.triggerText, !value && s.placeholder]} numberOfLines={1}>
          {value || "Select state"}
        </Text>
        {editable && (
          <MaterialIcons
            name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={20}
            color="#777"
          />
        )}
      </TouchableOpacity>

      {/* Inline dropdown */}
      {isOpen && (
        <View style={s.dropdown}>
          {/* Search input */}
          <View style={s.searchWrap}>
            <MaterialIcons name="search" size={16} color="#aaa" />
            <TextInput
              style={s.searchInput}
              placeholder="Type to search..."
              placeholderTextColor="#bbb"
              value={query}
              onChangeText={handleSearch}
              autoFocus
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch("")}>
                <MaterialIcons name="cancel" size={15} color="#bbb" />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          {loading ? (
            <ActivityIndicator color="#2e5bff" style={{ padding: 12 }} />
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              style={s.list}
            >
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <TouchableOpacity
                    key={String(item.id)}
                    style={[s.item, value === item.state_name && s.itemSelected]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={[s.itemText, value === item.state_name && s.itemTextSelected]}>
                      {item.state_name}
                    </Text>
                    {value === item.state_name && (
                      <MaterialIcons name="check" size={15} color="#2e5bff" />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={s.noResult}>No state found</Text>
              )}
            </ScrollView>
          )}

          {/* Close */}
          <TouchableOpacity style={s.closeRow} onPress={() => setIsOpen(false)}>
            <Text style={s.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default StateDropdown;

const s = StyleSheet.create({
  wrapper:         { marginBottom: 14, zIndex: 999  },
  label:           { fontSize: 13, color: "#555", fontWeight: "500", marginBottom: 5 },
  trigger:         { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e8e8e8", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  triggerOpen:     { borderColor: "#2e5bff", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  triggerDisabled: { backgroundColor: "#f5f5f5", borderColor: "#f0f0f0" },
  triggerText:     { flex: 1, minWidth: 0, fontSize: 14, color: "#111" },
  placeholder:     { color: "#aaa" },
dropdown: { backgroundColor: "#fff", borderWidth: 1, borderTopWidth: 0, borderColor: "#2e5bff", borderBottomLeftRadius: 10, borderBottomRightRadius: 10, overflow: "hidden", zIndex: 999, elevation: 5, position: "absolute", top: 62, left: 0, right: 0 },
  searchWrap:      { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f0f0", backgroundColor: "#f8f9ff" },
  searchInput:     { flex: 1, fontSize: 13, color: "#111", padding: 0 },
  list:            { maxHeight: 200 },
  item:            { paddingVertical: 11, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#f5f5f5", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemSelected:    { backgroundColor: "#f0f3ff" },
  itemText:        { fontSize: 14, color: "#333" },
  itemTextSelected:{ color: "#2e5bff", fontWeight: "600" },
  noResult:        { textAlign: "center", color: "#aaa", padding: 16, fontSize: 13 },
  closeRow:        { alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  closeText:       { fontSize: 13, color: "#888", fontWeight: "500" },
});
