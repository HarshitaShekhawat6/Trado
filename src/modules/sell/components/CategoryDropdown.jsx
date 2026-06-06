import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const CategoryDropdown = ({ categories = [], selected, onSelect }) => {
  const [open,      setOpen]      = useState(false);
  const rotateAnim                = useRef(new Animated.Value(0)).current;

  const toggleDropdown = () => {
    const toValue = open ? 0 : 1;
    Animated.timing(rotateAnim, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setOpen((prev) => !prev);
  };

  const handleSelect = (cat) => {
    onSelect(cat);
    Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    setOpen(false);
  };

  const getLabel = (cat) => cat?.name  || cat?.label || "";
  const getId    = (cat) => cat?.id?.toString() || cat?.slug || "";
  const isActive = (cat) => selected && getId(selected) === getId(cat);

  const arrowRotate = rotateAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={styles.wrapper}>
      <Text style={styles.fieldLabel}>CATEGORY</Text>

      {/* ── Trigger ───────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.triggerBox, open && styles.triggerBoxOpen]}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <Text
          numberOfLines={1}
          style={selected ? styles.triggerText : styles.triggerPlaceholder}
        >
          {selected ? getLabel(selected) : "Select a category"}
        </Text>
        <Animated.View style={{ transform: [{ rotate: arrowRotate }] }}>
          <MaterialIcons name="keyboard-arrow-down" size={22} color="#747688" />
        </Animated.View>
      </TouchableOpacity>

      {/* ── Inline dropdown list ──────────────────────────────────────────── */}
      {open && (
        <View style={styles.dropdownBox}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {categories.length === 0 ? (
              <Text style={styles.emptyText}>No categories available</Text>
            ) : (
              categories.map((item, index) => (
                <TouchableOpacity
                  key={getId(item) || index.toString()}
                  style={[
                    styles.item,
                    isActive(item) && styles.itemActive,
                    index === categories.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.itemText, isActive(item) && styles.itemTextActive]}>
                    {getLabel(item)}
                  </Text>
                  {isActive(item) && (
                    <MaterialIcons name="check" size={16} color="#0040e0" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 999,        // important — keeps dropdown above sibling views
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#747688",
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 2,
  },

  // ── Trigger ───────────────────────────────────────────────────────────────
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
    marginBottom: 0,
  },
  triggerBoxOpen: {
    borderColor: "#0040e0",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,        // merges visually with the list below
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

  // ── Dropdown list ─────────────────────────────────────────────────────────
  dropdownBox: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#0040e0",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: "#fff",
    maxHeight: 220,              // ~5 items visible, rest scrollable
    marginBottom: 14,
    overflow: "hidden",
  },

  // ── Items ─────────────────────────────────────────────────────────────────
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f8",
  },
  itemActive: {
    backgroundColor: "#f0f4ff",
  },
  itemText: {
    fontSize: 14,
    color: "#444",
    fontWeight: "500",
  },
  itemTextActive: {
    color: "#0040e0",
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    color: "#747688",
    paddingVertical: 20,
    fontSize: 14,
  },
});

export default CategoryDropdown;