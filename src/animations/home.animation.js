import { useRef, useEffect } from "react";
import { Animated, Easing, Dimensions } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

/**
 * useIntroAnimation
 * Handles the bag icon intro sequence (center → top-right)
 * Returns animated values + a trigger to start layout animations
 */
export const useIntroAnimation = (onIntroComplete) => {
  const bagTranslateX = useRef(new Animated.Value(29 - screenWidth / 2)).current;
  const bagTranslateY = useRef(new Animated.Value(screenHeight / 2 - 36)).current;
  const bagScale    = useRef(new Animated.Value(0.1)).current;
  const bagOpacity  = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(bagOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(bagScale,   { toValue: 5, friction: 6, tension: 40, useNativeDriver: true }),
      ]),
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(bagTranslateX, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(bagTranslateY, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(bagScale,      { toValue: 1, duration: 800, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      if (onIntroComplete) onIntroComplete();
    });
  }, []);

  return { bagTranslateX, bagTranslateY, bagScale, bagOpacity, overlayOpacity };
};

/**
 * useLayoutAnimation
 * Handles all post-intro section reveal animations
 */
export const useLayoutAnimation = (startLayoutAnimation) => {
  const headerOpacity    = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-60)).current;

  const searchOpacity = useRef(new Animated.Value(0)).current;
  const searchScale   = useRef(new Animated.Value(0.95)).current;

  const bannerOpacity    = useRef(new Animated.Value(0)).current;
  const bannerTranslateX = useRef(new Animated.Value(-screenWidth)).current;

  const featuredHeadingOpacity    = useRef(new Animated.Value(0)).current;
  const featuredHeadingTranslateX = useRef(new Animated.Value(-20)).current;

  const recentHeadingOpacity    = useRef(new Animated.Value(0)).current;
  const recentHeadingTranslateY = useRef(new Animated.Value(50)).current;

  const sellCardScale   = useRef(new Animated.Value(0.8)).current;
  const sellCardOpacity = useRef(new Animated.Value(0)).current;

  const tabBarOpacity    = useRef(new Animated.Value(0)).current;
  const tabBarTranslateY = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    if (!startLayoutAnimation) return;

    Animated.parallel([
      Animated.timing(headerOpacity,    { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(headerTranslateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.exp), useNativeDriver: true }),

      Animated.timing(searchOpacity, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
      Animated.timing(searchScale,   { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),

      Animated.timing(bannerOpacity,    { toValue: 1, duration: 500, delay: 350, useNativeDriver: true }),
      Animated.timing(bannerTranslateX, { toValue: 0, duration: 500, delay: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),

      Animated.timing(featuredHeadingOpacity,    { toValue: 1, duration: 400, delay: 700, useNativeDriver: true }),
      Animated.timing(featuredHeadingTranslateX, { toValue: 0, duration: 400, delay: 700, useNativeDriver: true }),

      Animated.timing(recentHeadingOpacity,    { toValue: 1, duration: 400, delay: 1000, useNativeDriver: true }),
      Animated.timing(recentHeadingTranslateY, { toValue: 0, duration: 400, delay: 1000, useNativeDriver: true }),

      Animated.timing(sellCardOpacity, { toValue: 1, duration: 10, delay: 1200, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(1200),
        Animated.spring(sellCardScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
      ]),

      Animated.timing(tabBarOpacity,    { toValue: 1, duration: 500, delay: 300, useNativeDriver: true }),
      Animated.timing(tabBarTranslateY, { toValue: 0, duration: 500, delay: 300, useNativeDriver: true }),
    ]).start();
  }, [startLayoutAnimation]);

  return {
    header:          { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] },
    search:          { opacity: searchOpacity, transform: [{ scale: searchScale }] },
    banner:          { opacity: bannerOpacity, transform: [{ translateX: bannerTranslateX }] },
    featuredHeading: { opacity: featuredHeadingOpacity, transform: [{ translateX: featuredHeadingTranslateX }] },
    recentHeading:   { opacity: recentHeadingOpacity, transform: [{ translateY: recentHeadingTranslateY }] },
    sellCard:        { opacity: sellCardOpacity, transform: [{ scale: sellCardScale }] },
    tabBar:          { opacity: tabBarOpacity, transform: [{ translateY: tabBarTranslateY }] },
  };
};

/**
 * useCategoryItemAnimation
 * Per-item staggered entrance + press hover lift
 */
export const useCategoryItemAnimation = (index, startAnimation) => {
  const hoverTranslateY  = useRef(new Animated.Value(0)).current;
  const enterTranslateY  = useRef(new Animated.Value(40)).current;
  const enterOpacity     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!startAnimation) return;
    Animated.parallel([
      Animated.timing(enterOpacity, {
        toValue: 1, duration: 350,
        delay: 500 + index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(enterTranslateY, {
        toValue: 0,
        delay: 500 + index * 80,
        friction: 6, tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [startAnimation]);

  const handlePressIn = () => {
    Animated.spring(hoverTranslateY, {
      toValue: -8, useNativeDriver: true, friction: 4, tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(hoverTranslateY, {
      toValue: 0, useNativeDriver: true, friction: 5, tension: 80,
    }).start();
  };

  const combinedTranslateY = Animated.add(hoverTranslateY, enterTranslateY);

  return {
    animatedStyle: { opacity: enterOpacity, transform: [{ translateY: combinedTranslateY }] },
    handlePressIn,
    handlePressOut,
  };
};

/**
 * useFeaturedCardAnimation
 * Staggered slide-in from right per card
 */
export const useFeaturedCardAnimation = (index, startAnimation) => {
  const enterTranslateX = useRef(new Animated.Value(60)).current;
  const enterOpacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!startAnimation) return;
    Animated.parallel([
      Animated.timing(enterOpacity, {
        toValue: 1, duration: 400,
        delay: 800 + index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(enterTranslateX, {
        toValue: 0, duration: 400,
        delay: 800 + index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, startAnimation]);

  return {
    animatedStyle: { opacity: enterOpacity, transform: [{ translateX: enterTranslateX }] },
  };
};

/**
 * useHeartAnimation
 * Bounce scale on heart button press
 */
export const useHeartAnimation = () => {
  const heartScale = useRef(new Animated.Value(1)).current;

  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 0.7, duration: 100, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, friction: 3, tension: 60, useNativeDriver: true }),
    ]).start();
  };

  return { heartScale, animateHeart };
};

/**
 * useRecentCardAnimation
 * Fade up from bottom per card
 */
export const useRecentCardAnimation = (index, startAnimation) => {
  const enterTranslateY = useRef(new Animated.Value(50)).current;
  const enterOpacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!startAnimation) return;
    Animated.parallel([
      Animated.timing(enterOpacity, {
        toValue: 1, duration: 400,
        delay: 1000 + index * 150,
        useNativeDriver: true,
      }),
      Animated.timing(enterTranslateY, {
        toValue: 0, duration: 400,
        delay: 1000 + index * 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, startAnimation]);

  return {
    animatedStyle: { opacity: enterOpacity, transform: [{ translateY: enterTranslateY }] },
  };
};