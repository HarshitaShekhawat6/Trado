import React  ,{ useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import apiClient from "../../../api/client";
import { CATEGORY_STYLES } from "../constants/categoryStyles";
import { Animated } from "react-native";

const resolveImage = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const BASE_URL = apiClient.defaults.baseURL?.replace("/api", "") ?? "";
  return `${BASE_URL}/${url.replace(/^\/+/, "")}`;
};

const CategoriesModal = ({ visible, onClose, categories, navigation, startAnimation }) => {



    const slideAnim = useRef(new Animated.Value(-400)).current;

useEffect(() => {
  if (visible) {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  } else {
    slideAnim.setValue(-400);
  }
}, [visible]);

  const handleCategoryPress = (cat) => {
    onClose();
    navigation.navigate("CategoryListings", { category: cat });
  };

  const handleSellPress = () => {
    onClose();
    navigation.navigate("Sell");
  };

  const renderItem = ({ item, index }) => {
    const fallback = CATEGORY_STYLES[index % CATEGORY_STYLES.length];
    const style = {
      icon: item?.icon || item?.icon_name || fallback.icon,
      bg: item?.bg || item?.background_color || item?.backgroundColor || fallback.bg,
      color: item?.color || item?.icon_color || item?.iconColor || fallback.color,
    };
    const imageUri = resolveImage(item?.image);

    return (
      <TouchableOpacity
        style={styles.catItem}
        activeOpacity={0.8}
        onPress={() => handleCategoryPress(item)}
      >
        <View style={[styles.iconBox, { backgroundColor: style.bg }]}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", height: "100%", borderRadius: 12 }}
              resizeMode="cover"
            />
          ) : (
            <MaterialIcons name={style.icon} size={26} color={style.color} />
          )}
        </View>
        <Text style={styles.catLabel} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Blurred backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Bottom sheet */}
<Animated.View
  style={[
    styles.sheet,
    {
      transform: [{ translateX: slideAnim }],
    },
  ]}
>        

{/* Handle bar */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>All Categories</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color="#191b24" />
          </TouchableOpacity>
        </View>

        {/* Categories grid */}
        <FlatList
          data={categories}
          keyExtractor={(item, i) => item?.id?.toString() ?? i.toString()}
          renderItem={renderItem}
          numColumns={4}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        />

      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
// sheet style replace karo:
sheet: {
  position: "absolute",
  left: 20,
  right: 20,
  top: "30%",         
  maxHeight: "80%",    
  backgroundColor: "#fff",
  borderRadius: 24,
  paddingBottom: 16,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 12,
  elevation: 20,
},
  handleBar: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#dde0e8",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#191b24",
  },
  row: {
    justifyContent: "flex-start",
    gap: 4,
  },
  catItem: {
    flex: 1,
    maxWidth: "25%",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    overflow: "hidden",
  },
  catLabel: {
    fontSize: 11,
    color: "#3a3d4a",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 14,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#f0f1f5",
  },
  sellBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2979FF",
    paddingVertical: 14,
    borderRadius: 14,
  },
  sellBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default CategoriesModal;