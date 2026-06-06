import React, { useEffect, useRef } from "react";
import { View, Text, Image, TouchableOpacity, Animated } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { styles } from "./home.styles";

const CATEGORY_STYLES = [
  { icon: "phone-portrait-outline", bg: "#EEF2FF", color: "#4F6EF7" },
  { icon: "car-outline", bg: "#FFF0EE", color: "#E8603C" },
  { icon: "shirt-outline", bg: "#FFFBEA", color: "#E0A020" },
];

const CategoryItem = ({ cat, index, startAnimation, navigation }) => {
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (startAnimation) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [startAnimation]);

  const style = CATEGORY_STYLES[index % CATEGORY_STYLES.length];
  const imageUri = cat?.image
    ? cat.image.startsWith("http")
      ? cat.image
      : null
    : null;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        style={styles.catItem}
        onPress={() =>
          navigation && navigation.navigate("CategoryListings", { category: cat })
        }
      >
        <View style={[styles.iconBox, { backgroundColor: style.bg }]}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 12,
              }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name={style.icon} size={26} color={style.color} />
          )}
        </View>
        <Text style={styles.catLabel}>{cat.name}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default CategoryItem;