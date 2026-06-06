import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import sellStyles from "../styles/sell.styles";

const CONDITIONS = [
  { label: "New",      value: "NEW"      },
  { label: "Used", value: "USED" },
];

const ConditionSelector = ({ value, onChange }) => {
  return (
    <View>
      <Text style={sellStyles.fieldLabel}>CONDITION</Text>
      <View style={sellStyles.chipRow}>
        {CONDITIONS.map((item) => {
          const isActive = value === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              style={[sellStyles.chip, isActive && sellStyles.chipActive]}
              onPress={() => onChange(item.value)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  sellStyles.chipText,
                  isActive && sellStyles.chipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default memo(ConditionSelector);