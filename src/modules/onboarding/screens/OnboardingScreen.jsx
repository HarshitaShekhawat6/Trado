// src/modules/onboarding/screens/OnboardingScreen.jsx

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Buy Everything that\nyou need!",
    subtitle: "Buy all your needs just through the hand,\nIt's so easy and efficient.",
    emoji: "🛍️",
    bg: "#f0eeff",
    accent: "#6C63FF",
  },
  {
    id: "2",
    title: "Sell with ease,\nanywhere!",
    subtitle: "List your items in seconds and reach\nthousands of buyers near you.",
    emoji: "₹",
    bg: "#fff3e0",
    accent: "#FF8C42",
  },
  {
    id: "3",
    title: "Chat, deal &\npick up fast!",
    subtitle: "Talk directly with sellers, negotiate\nand close deals in your city.",
    emoji: "🤝",
    bg: "#e8f5e9",
    accent: "#43A047",
  },
];

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleGetStarted = async () => {
    await AsyncStorage.setItem("onboarding_seen", "true");
    navigation.replace("Auth");
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const isLast = currentIndex === slides.length - 1;
  const currentSlide = slides[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: currentSlide.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={currentSlide.bg} />

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width, backgroundColor: item.bg }]}>
            {/* Illustration area */}
            <View style={styles.illustrationContainer}>
              <View style={[styles.circle, { backgroundColor: item.accent + "22" }]} />
              <View style={[styles.emojiBox, { backgroundColor: item.accent + "18", borderColor: item.accent + "33" }]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              {/* Decorative shapes */}
              <View style={[styles.floatTL, { backgroundColor: item.accent + "40" }]} />
              <View style={[styles.floatBR, { backgroundColor: item.accent + "25" }]} />
              <View style={[styles.floatSmall, { backgroundColor: "#FFD166" }]} />
            </View>

            {/* Text */}
            <View style={styles.textArea}>
              <Text style={[styles.title, { color: "#1a1a2e" }]}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: "clamp",
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity,
                    backgroundColor: currentSlide.accent,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: currentSlide.accent }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {isLast ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>

        {/* Skip */}
        {!isLast && (
          <TouchableOpacity onPress={handleGetStarted} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: currentSlide.accent }]}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
  },
  illustrationContainer: {
    width: width * 0.78,
    height: height * 0.42,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 8,
  },
  circle: {
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
    position: "absolute",
  },
  emojiBox: {
    width: 160,
    height: 180,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  emoji: {
    fontSize: 90,
  },
  floatTL: {
    position: "absolute",
    top: 20,
    left: 10,
    width: 52,
    height: 52,
    borderRadius: 14,
    transform: [{ rotate: "15deg" }],
    zIndex: 1,
  },
  floatBR: {
    position: "absolute",
    bottom: 30,
    right: 8,
    width: 60,
    height: 60,
    borderRadius: 30,
    zIndex: 1,
  },
  floatSmall: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 18,
    height: 18,
    borderRadius: 9,
    zIndex: 1,
  },
  textArea: {
    paddingHorizontal: 32,
    alignItems: "center",
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
  },
  bottomSection: {
    paddingHorizontal: 28,
    paddingBottom: 44,
    paddingTop: 16,
    alignItems: "center",
    gap: 14,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  skipBtn: {
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default OnboardingScreen;