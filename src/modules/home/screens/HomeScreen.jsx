import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  Animated,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAuth } from "../../../navigation/AuthContext";
import apiClient, { setAuthToken } from "../../../api/client";

import useHome from "../hooks/useHome";
import { useIntroAnimation, useLayoutAnimation } from "../animations/home.animation";
import AnimatedCategoryItem from "../components/AnimatedCategoryItem";
import FeaturedCard from "../components/FeaturedCard";
import RecentCard from "../components/RecentCard";
import DrawerMenu from "../../../components/DrawerMenu";
import useDrawer from "../../../hooks/useDrawer";
import homeStyles from "../styles/home.style";

import CategoriesModal from "../components/CategoriesModal";

const resolveRemoteImage = (value) => {
  const BASE_URL = apiClient.defaults.baseURL?.replace("/api", "") ?? "";
  const raw = typeof value === "object"
    ? value?.url ?? value?.uri ?? value?.image ?? value?.image_url ?? value?.imageUrl
    : value;

  if (!raw || typeof raw !== "string") return null;

  const clean = raw.replace(/\\/g, "/").replace(/^\/+/, "");
  return clean.startsWith("http") ? clean : `${BASE_URL}/${clean}`;
};

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getDisplayName = (profile) =>
  profile?.name ??
  profile?.full_name ??
  profile?.fullName ??
  profile?.username ??
  profile?.user_name ??
  "";

const InlineError = ({ message, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={{
      marginHorizontal: 16,
      marginTop: 12,
      padding: 12,
      borderRadius: 10,
      backgroundColor: "#fff0f0",
    }}
  >
    <Text style={{ color: "#b42318", fontWeight: "700" }}>{message}</Text>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
  const { user, token } = useAuth();

  const [introActive, setIntroActive] = useState(true);
  const [startLayoutAnim, setStartLayoutAnim] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(false);

  const { drawerVisible, openDrawer, closeDrawer } = useDrawer();
  const {
    homeContent,
    profile,
    featured,
    recent,
    categories,
    loading,
    errors,
    refetchAll,
  } = useHome(token);

  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);

  const profileUser = profile ?? homeContent?.user ?? user;
  const header = homeContent?.header ?? {};
  const sectionTitles = homeContent?.sectionTitles ?? {};
  const primaryBanner =
    homeContent?.banners?.find((banner) => banner?.is_active !== false) ??
    homeContent?.banners?.[0] ??
    null;
  const sellCta = homeContent?.sellCta;
  const visibleSellCta = sellCta ?? {
    icon: "megaphone-outline",
    title: "Start Selling Today",
    subtitle: "Turn your unused items into cash. List for free and reach millions of buyers near you.",
    cta_label: "Post Your Ad",
    cta_icon: "add-circle-outline",
    route: "Sell",
  };

 const avatarUri = resolveRemoteImage(
  user?.image ??                    // ← AuthContext — turant update hota hai
  profile?.image ??                 // ← API fetch fallback
  profileUser?.avatar ??
  profileUser?.profile_image
);

const displayName = getDisplayName(user ?? profile ?? homeContent?.user);
  const headerTitle = displayName ? `Hi, ${displayName}` : header.title || "Hi, there";
  const bannerImageUri = resolveRemoteImage(
    primaryBanner?.image ?? primaryBanner?.image_url ?? primaryBanner?.imageUrl
  );

  const { bagTranslateX, bagTranslateY, bagScale, bagOpacity, overlayOpacity } =
    useIntroAnimation(() => {
      setIntroActive(false);
      setStartLayoutAnim(true);
    });

  const anim = useLayoutAnimation(startLayoutAnim);

  const handleSearch = () => {
    if (!searchText.trim()) return;
    navigation.navigate("SearchResults", { query: searchText.trim() });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0040e0" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8f9fb", marginBottom: 60, paddingTop: 40 }}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {introActive && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#f8f9fb",
              opacity: overlayOpacity,
              zIndex: 10,
            }}
          />
        )}

        

        <View style={[homeStyles.header, { zIndex: 11 }]}>
          <Animated.View style={[{ flexDirection: "row", alignItems: "center", gap: 12 }, anim.header]}>
            <TouchableOpacity
              onPress={openDrawer}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={homeStyles.menuBtn}
            >
              <Icon name="menu" size={24} color="#191b24" />
            </TouchableOpacity>

            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={homeStyles.avatar} />
            ) : (
              <View
                style={[
                  homeStyles.avatar,
                  {
                    backgroundColor: "#0d6efd",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>
                  {getInitials(displayName)}
                </Text>
              </View>
            )}

            <View>
              <Text style={homeStyles.welcome}>{header.subtitle || "Welcome back"}</Text>
              <Text style={homeStyles.name}>
                {headerTitle}
              </Text>
            </View>
          </Animated.View>

          <Animated.View
  style={{
    transform: [
      { translateX: bagTranslateX },
      { translateY: bagTranslateY },
      { scale: bagScale },
    ],
    opacity: bagOpacity,
  }}
>
  <TouchableOpacity
    onPress={() => !introActive && navigation.navigate("NearbyProducts")}
    activeOpacity={introActive ? 1 : 0.7}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  >
    <Icon name={header.icon || "local-mall"} size={26} color="#0058be" />
  </TouchableOpacity>
</Animated.View>
        </View>

        <Animated.View style={[homeStyles.searchBox, anim.search]}>
          <Icon name="search" size={20} color="#727785" />
          <TextInput
  placeholder={header.search_placeholder || "Search"}
  placeholderTextColor="#aaa"
  style={homeStyles.searchInput}
  value={searchText}
  onChangeText={setSearchText}
  onSubmitEditing={handleSearch}
  returnKeyType="search"
/>
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleSearch}>
              <Icon name="arrow-forward" size={20} color="#0040e0" />
            </TouchableOpacity>
          )}
        </Animated.View>

        {primaryBanner && bannerImageUri && (
          <Animated.View style={anim.banner}>
            <ImageBackground
              source={{ uri: bannerImageUri }}
              style={homeStyles.banner}
              imageStyle={{ borderRadius: 16 }}
            >
              <View style={homeStyles.overlay} />
              <View style={homeStyles.bannerContent}>
                {!!primaryBanner.badge && (
                  <View style={homeStyles.marketplaceBadge}>
                    <Text style={homeStyles.marketplaceBadgeText}>{primaryBanner.badge}</Text>
                  </View>
                )}
                {!!primaryBanner.title && (
                  <Text style={homeStyles.bannerTitle}>{primaryBanner.title}</Text>
                )}
                {!!primaryBanner.cta_label && (
                  <TouchableOpacity
                    style={homeStyles.exploreBtn}
                    onPress={() => {
                      if (primaryBanner.route) {
                        navigation.navigate(primaryBanner.route, primaryBanner.params || {});
                      }
                    }}
                  >
                    <Ionicons name={primaryBanner.cta_icon || "sparkles-outline"} size={16} color="#fff" />
                    <Text style={homeStyles.exploreBtnText}>{primaryBanner.cta_label}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ImageBackground>
          </Animated.View>
        )}
        

       <View style={{ marginBottom: 24 }}>
  <View style={[homeStyles.row, { marginBottom: 12 }]}>
    <Text style={homeStyles.sectionTitle}>
      {sectionTitles.categories || "Browse Categories"}
    </Text>
    <TouchableOpacity
  style={{
    backgroundColor: "#0D6EFD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  }}
  onPress={() => setCategoriesModalVisible(true)}
>
  <Text
    style={{
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
      
    }}
  >
    See All
  </Text>
</TouchableOpacity>
  </View>
  {errors.categories ? (
    <InlineError message="Categories could not load. Tap to retry." onPress={refetchAll} />
  ) : (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 15}}
    >
      {categories.slice(0, 5).map((cat, index) => (
        <AnimatedCategoryItem
          key={cat?.id?.toString() ?? index.toString()}
          cat={cat}
          index={index}
          startAnimation={startLayoutAnim}
          navigation={navigation}
        />
      ))}
    </ScrollView>
  )}
</View>

<CategoriesModal
  visible={categoriesModalVisible}
  onClose={() => setCategoriesModalVisible(false)}
  categories={categories}
  navigation={navigation}
  startAnimation={startLayoutAnim}
/>

        <Animated.View style={[homeStyles.row, { marginTop: 20 }, anim.recentHeading]}>
          <Text style={homeStyles.section}>{sectionTitles.recent || "Recently Added"}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("AllListings", { type: "recent" })}>
            <Text style={homeStyles.link}>See All</Text>
          </TouchableOpacity>
        </Animated.View>

        {errors.recent ? (
          <InlineError message="Recent listings could not load. Tap to retry." onPress={refetchAll} />
        ) : (
          <FlatList
            data={recent.slice(0, 10)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 4 }}
            keyExtractor={(item, i) => item?.id?.toString() || i.toString()}
            renderItem={({ item }) => <RecentCard item={item} navigation={navigation} />}
          />
        )}

        <Animated.View style={[homeStyles.row, { marginTop: 20 }, anim.featuredHeading]}>
          <Text style={homeStyles.section}>{sectionTitles.featured || "Featured Listings"}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("AllListings", { type: "featured" })}>
            <Text style={homeStyles.link}>See All</Text>
          </TouchableOpacity>
        </Animated.View>

        {errors.featured ? (
          <InlineError message="Featured listings could not load. Tap to retry." onPress={refetchAll} />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 10 }}>
            {featured.slice(0, 10).map((item, i) => (
              <FeaturedCard
                key={item?.id?.toString() || i.toString()}
                item={item}
                navigation={navigation}
              />
            ))}
          </View>
        )}

        {visibleSellCta && (
          <Animated.View style={[homeStyles.sellCard, anim.sellCard]}>
            <View style={homeStyles.iconCircle}>
              <Ionicons name={visibleSellCta.icon || "megaphone-outline"} size={28} color="#fff" />
            </View>
            {!!visibleSellCta.title && <Text style={homeStyles.sellTitle}>{visibleSellCta.title}</Text>}
            {!!visibleSellCta.subtitle && (
              <Text style={homeStyles.sellSubtitle}>{visibleSellCta.subtitle}</Text>
            )}
            {!!visibleSellCta.cta_label && (
              <TouchableOpacity
                style={homeStyles.postBtn}
                activeOpacity={0.85}
                onPress={() => navigation?.navigate?.(visibleSellCta.route || "Sell")}
              >
                <Ionicons name={visibleSellCta.cta_icon || "add-circle-outline"} size={22} color="#2979FF" />
                <Text style={homeStyles.postBtnText}>{visibleSellCta.cta_label}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </ScrollView>

      <DrawerMenu
        visible={drawerVisible}
        onClose={closeDrawer}
        navigation={navigation}
        currentRoute="Home"
      />
    </View>
  );
};

export default HomeScreen;
