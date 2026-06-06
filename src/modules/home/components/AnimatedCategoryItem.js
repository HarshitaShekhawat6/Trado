import React from "react";
import { View, Text, Image, TouchableOpacity, Animated } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import { useCategoryItemAnimation } from "../../../animations/home.animation";
import { CATEGORY_STYLES } from "../constants/categoryStyles";
import homeStyles from "../styles/home.style";
import apiClient from "../../../api/client";

const resolveImage = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const BASE_URL = apiClient.defaults.baseURL?.replace("/api", "") ?? "";
  return `${BASE_URL}/${url.replace(/^\/+/, "")}`;
};

const AnimatedCategoryItem = ({ cat, index, startAnimation, navigation }) => {
  const { animatedStyle, handlePressIn, handlePressOut } =
    useCategoryItemAnimation(index, startAnimation);

  const fallbackStyle = CATEGORY_STYLES[index % CATEGORY_STYLES.length];
  const style = {
    icon:  cat?.icon || cat?.icon_name || fallbackStyle.icon,
    bg:    cat?.bg || cat?.background_color || cat?.backgroundColor || fallbackStyle.bg,
    color: cat?.color || cat?.icon_color || cat?.iconColor || fallbackStyle.color,
  };

  const imageUri = resolveImage(cat?.image);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate("CategoryListings", { category: cat })}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[homeStyles.catItem, startAnimation ? animatedStyle : {}]}
      >
        <View style={[homeStyles.iconBox, { backgroundColor: style.bg }]}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: homeStyles.iconBox?.borderRadius ?? 12,
              }}
              resizeMode="cover"
            />
          ) : (
            <MaterialIcons name={style.icon} size={26} color={style.color} />
          )}
        </View>
        <Text style={homeStyles.catLabel}>{cat.name}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedCategoryItem;