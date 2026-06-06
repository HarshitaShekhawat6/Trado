import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Animated,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import sellStyles from "../styles/sell.styles";
import Toast from "react-native-toast-message";
import ImagePicker from "react-native-image-crop-picker";

const MAX_IMAGES = 10;

const OPTIONS = [
  { key: "camera",  icon: "photo-camera",  label: "Camera",  sub: "Take a new photo"        },
  { key: "gallery", icon: "photo-library", label: "Gallery", sub: "Choose up to 10 photos"  },
  { key: "url",     icon: "link",          label: "Browse",  sub: "Paste an image URL"       },
];

const ImageUploader = ({ images, setImages }) => {

  // ─── Bottom sheet state ────────────────────────────────────────────────────
  const [visible,         setVisible]         = useState(false);
  const slideAnim                             = useRef(new Animated.Value(400)).current;
  const overlayAnim                           = useRef(new Animated.Value(0)).current;

  // ─── URL modal state ───────────────────────────────────────────────────────
  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [urlInput,        setUrlInput]        = useState("");
  const [urlError,        setUrlError]        = useState("");
  const [previewLoading,  setPreviewLoading]  = useState(false);
  const [previewOk,       setPreviewOk]       = useState(false);   // true once image loads


  // ─── Sheet open ────────────────────────────────────────────────────────────
  const openSheet = () => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  // ─── Sheet close ───────────────────────────────────────────────────────────
  const closeSheet = (cb) => {
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: 400, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0,   duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      if (cb) cb();
    });
  };

  // ─── Camera ────────────────────────────────────────────────────────────────
//   const openCamera = async () => {
//   if (images.length >= MAX_IMAGES) {
//     Toast.show({
//       type: "error", text1: "Limit reached",
//       text2: `You can upload a maximum of ${MAX_IMAGES} photos.`,
//       position: "top", visibilityTime: 3000, topOffset: 60,
//     });
//     return;
//   }
//   try {
//     const res = await ImagePicker.openCamera({
//       width: 1000,
//       height: 1000,
//       cropping: true,
//       freeStyleCropEnabled: true,
//       compressImageQuality: 0.8,
//     });
//     setImages((prev) => [
//       ...prev,
//       {
//         uri:      res.path,
//         type:     res.mime || "image/jpeg",
//         fileName: `photo_${Date.now()}.jpg`,
//       },
//     ].slice(0, MAX_IMAGES));
//   } catch (err) {
//     if (err?.code === "E_PICKER_CANCELLED") return;
//     Toast.show({
//       type: "error", text1: "Error",
//       text2: "Could not open camera.",
//       position: "top", visibilityTime: 3000, topOffset: 60,
//     });
//   }
// };
  const openCamera = async () => {
    if (images.length >= MAX_IMAGES) {
      Toast.show({
        type: "error", text1: "Limit reached",
        text2: `You can upload a maximum of ${MAX_IMAGES} photos.`,
        position: "top", visibilityTime: 3000, topOffset: 60,
      });
      return;
    }
    try {
      const res = await launchCamera({ mediaType: "photo", quality: 0.8, saveToPhotos: false });
      if (res.didCancel || res.errorCode) return;
      if (res.assets?.length) {
        setImages((prev) => [...prev, ...res.assets].slice(0, MAX_IMAGES));
      }
    } catch {
      Toast.show({
        type: "error", text1: "Error",
        text2: "Could not open camera.",
        position: "top", visibilityTime: 3000, topOffset: 60,
      });
    }
  };

  // ─── Gallery ───────────────────────────────────────────────────────────────
  const openGallery = async () => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      Toast.show({
        type: "error", text1: "Limit reached",
        text2: `You can upload a maximum of ${MAX_IMAGES} photos.`,
        position: "top", visibilityTime: 3000, topOffset: 60,
      });
      return;
    }
    try {
      const res = await launchImageLibrary({
        mediaType:      "photo",
        quality:        0.8,
        selectionLimit: remaining,
      });
      if (res.didCancel || res.errorCode) return;
      if (res.assets?.length) {
        setImages((prev) => [...prev, ...res.assets].slice(0, MAX_IMAGES));
      }
    } catch {
      Toast.show({
        type: "error", text1: "Error",
        text2: "Could not open gallery.",
        position: "top", visibilityTime: 3000, topOffset: 60,
      });
    }
  };

  // ─── Handle bottom-sheet option tap ───────────────────────────────────────
  const handleOption = (key) => {
    closeSheet(() => {
      if (key === "camera")  openCamera();
      if (key === "gallery") openGallery();
      if (key === "url")     openUrlModal();
    });
  };

  // ─── URL modal helpers ─────────────────────────────────────────────────────
  const openUrlModal = () => {
    setUrlInput("");
    setUrlError("");
    setPreviewOk(false);
    setPreviewLoading(false);
    setUrlModalVisible(true);
  };

  const closeUrlModal = () => {
    setUrlModalVisible(false);
    setUrlInput("");
    setUrlError("");
    setPreviewOk(false);
    setPreviewLoading(false);
  };

  // Called every time user types a new URL
  const handleUrlChange = (text) => {
    setUrlInput(text);
    setUrlError("");
    setPreviewOk(false);
    // Show loading spinner only if the input looks like a real URL
    setPreviewLoading(text.trim().length > 0);
  };

const handleAddUrl = () => {
  const trimmed = urlInput.trim();

  if (!trimmed) {
    setUrlError("Please enter an image URL");
    return;
  }

  if (images.length >= MAX_IMAGES) {
    setUrlError(`Maximum ${MAX_IMAGES} images allowed`);
    return;
  }

  // ✅ koi bhi validation nahi — user jo bhi paste kare chalega
  setImages((prev) => [
    ...prev,
    {
      uri:      trimmed,
      type:     "image/jpeg",
      fileName: `image_${Date.now()}.jpg`,
      fromUrl:  true,
    },
  ]);

  closeUrlModal();
};
  // ─── Remove image ──────────────────────────────────────────────────────────
  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Show preview only when URL looks like a URL ───────────────────────────
const showPreview = urlInput.trim().length > 0;
  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {images.length === 0 ? (
        <TouchableOpacity
          style={sellStyles.uploadBox}
          onPress={openSheet}
          activeOpacity={0.8}
        >
          <View style={sellStyles.uploadIconCircle}>
            <MaterialIcons name="add-a-photo" size={30} color="#0040e0" />
          </View>
          <Text style={sellStyles.uploadTitle}>Add Photos</Text>
          <Text style={sellStyles.uploadSub}>Up to {MAX_IMAGES} photos · tap to upload</Text>
        </TouchableOpacity>
      ) : (
        /* ── Preview strip ────────────────────────────────────────────────── */
        <View>
          <Text style={localStyles.counter}>{images.length}/{MAX_IMAGES} photos</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={sellStyles.previewRow}
            contentContainerStyle={{ paddingRight: 12 }}
          >
            {images.map((img, index) => (
              <View key={`${img.uri}-${index}`} style={sellStyles.previewThumb}>
                <Image source={{ uri: img.uri }} style={sellStyles.thumbImg} />

                {/* Cover badge on first image */}
                {index === 0 && (
                  <View style={localStyles.coverBadge}>
                    <Text style={localStyles.coverText}>Cover</Text>
                  </View>
                )}

                {/* URL badge */}
                {img.fromUrl && (
                  <View style={localStyles.urlBadge}>
                    <MaterialIcons name="link" size={10} color="#fff" />
                  </View>
                )}

                <TouchableOpacity
                  style={sellStyles.removeBtn}
                  onPress={() => removeImage(index)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <MaterialIcons name="close" size={13} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add more button */}
            {images.length < MAX_IMAGES && (
              <TouchableOpacity
                style={sellStyles.addMoreThumb}
                onPress={openSheet}
                activeOpacity={0.7}
              >
                <MaterialIcons name="add" size={26} color="#747688" />
                <Text style={localStyles.addMoreText}>{MAX_IMAGES - images.length} left</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}


      {/* ═══════════════════════════════════════════════════════════════════════
          BOTTOM SHEET MODAL — Camera / Gallery / Browse
      ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeSheet()}
      >
        <View style={localStyles.modalWrapper}>

          {/* Dimmed background */}
          <Animated.View style={[localStyles.backdrop, { opacity: overlayAnim }]} />

          {/* Tap above sheet → close */}
          <TouchableOpacity
            style={localStyles.dismissArea}
            activeOpacity={1}
            onPress={() => closeSheet()}
          />

          {/* Sheet */}
          <Animated.View
            style={[localStyles.sheet, { transform: [{ translateY: slideAnim }] }]}
          >
            <View style={localStyles.dragHandle} />

            {/* Header */}
            <View style={sellStyles.sheetHeader}>
              <Text style={sellStyles.sheetTitle}>Upload Photo</Text>
              <TouchableOpacity
                style={sellStyles.closeBtn}
                onPress={() => closeSheet()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={18} color="#191b24" />
              </TouchableOpacity>
            </View>

            {/* Options */}
            {OPTIONS.map((opt, idx) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  sellStyles.optionRow,
                  idx === OPTIONS.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => handleOption(opt.key)}
                activeOpacity={0.7}
              >
                <View style={sellStyles.optionIconCircle}>
                  <MaterialIcons name={opt.icon} size={22} color="#0040e0" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={sellStyles.optionLabel}>{opt.label}</Text>
                  <Text style={sellStyles.optionSub}>{opt.sub}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#c4c5d9" />
              </TouchableOpacity>
            ))}

            {/* Cancel */}
            <TouchableOpacity
              style={localStyles.cancelBtn}
              onPress={() => closeSheet()}
              activeOpacity={0.7}
            >
              <Text style={localStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>


      {/* ═══════════════════════════════════════════════════════════════════════
          URL MODAL — Paste image link
      ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={urlModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeUrlModal}
      >
        <KeyboardAvoidingView
          style={urlStyles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Tap outside → close */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeUrlModal}
          />

          <View style={urlStyles.card}>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <View style={urlStyles.cardHeader}>
              <View style={urlStyles.cardIconCircle}>
                <MaterialIcons name="link" size={20} color="#0040e0" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={urlStyles.cardTitle}>Paste Image URL</Text>
                <Text style={urlStyles.cardSub}>Copy any image link and paste below</Text>
              </View>
              <TouchableOpacity
                onPress={closeUrlModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={20} color="#747688" />
              </TouchableOpacity>
            </View>

            {/* ── Input ───────────────────────────────────────────────────── */}
            <View style={[urlStyles.inputWrap, urlError ? urlStyles.inputWrapError : null]}>
              <MaterialIcons
                name="insert-link"
                size={18}
                color={urlError ? "#ff4d4f" : "#aaa"}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={urlStyles.input}
                placeholder="https://example.com/image.jpg"
                placeholderTextColor="#bbb"
                value={urlInput}
                onChangeText={handleUrlChange}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAddUrl}
              />
              {/* Clear button */}
              {urlInput.length > 0 && (
                <TouchableOpacity
                  onPress={() => { setUrlInput(""); setUrlError(""); setPreviewOk(false); setPreviewLoading(false); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="cancel" size={16} color="#bbb" />
                </TouchableOpacity>
              )}
            </View>

            {/* Error message */}
            {urlError ? (
              <View style={urlStyles.errorRow}>
                <MaterialIcons name="error-outline" size={13} color="#ff4d4f" />
                <Text style={urlStyles.errorText}>{urlError}</Text>
              </View>
            ) : null}

            {/* ── Live Preview ─────────────────────────────────────────────── */}
            {showPreview && (
              <View style={urlStyles.previewWrap}>
                {/* Loading spinner shown until image loads/fails */}
                {previewLoading && !previewOk && (
                  <View style={urlStyles.previewPlaceholder}>
                    <ActivityIndicator color="#0040e0" />
                    <Text style={urlStyles.previewHint}>Loading preview…</Text>
                  </View>
                )}

                <Image
                  source={{ uri: urlInput.trim() }}
                  style={[
                    urlStyles.preview,
                    // Hide image visually while loading to avoid flash
                    (!previewOk && previewLoading) && { height: 0, opacity: 0 },
                  ]}
                  resizeMode="cover"
                  onLoadStart={() => { setPreviewLoading(true); setPreviewOk(false); }}
                  onLoad={() => { setPreviewOk(true); setPreviewLoading(false); setUrlError(""); }}
                  onError={() => {
                    setPreviewOk(false);
                    setPreviewLoading(false);
                    setUrlError("Could not load image. Check the URL.");
                  }}
                />

                {/* Success tick overlay */}
                {previewOk && (
                  <View style={urlStyles.previewTick}>
                    <MaterialIcons name="check-circle" size={18} color="#22c55e" />
                    <Text style={urlStyles.previewTickText}>Image loaded</Text>
                  </View>
                )}
              </View>
            )}

            {/* Tip when input is empty */}
            {!showPreview && (
              <View style={urlStyles.tipRow}>
                <MaterialIcons name="info-outline" size={13} color="#b0b0c8" />
                <Text style={urlStyles.tipText}>
                  Tip: Open any image in your browser, long-press → Copy image address
                </Text>
              </View>
            )}

            {/* ── Action buttons ───────────────────────────────────────────── */}
            <View style={urlStyles.btnRow}>
              <TouchableOpacity
                style={urlStyles.cancelBtn}
                onPress={closeUrlModal}
                activeOpacity={0.7}
              >
                <Text style={urlStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>

             <TouchableOpacity
  style={[
    urlStyles.addBtn,
    (!urlInput.trim().startsWith("http") && !urlInput.trim().startsWith("data:image")) 
      && urlStyles.addBtnDisabled
  ]}
  onPress={handleAddUrl}
  activeOpacity={0.85}
>
                <MaterialIcons
                  name="add-photo-alternate"
                  size={17}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={urlStyles.addText}>Add Image</Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};


// ─── Bottom-sheet local styles ─────────────────────────────────────────────────
const localStyles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 32,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: "#e0e0e0",
    alignSelf: "center",
    marginBottom: 16,
  },
  cancelBtn: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#f3f2ff",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444",
  },
  counter: {
    fontSize: 12,
    fontWeight: "600",
    color: "#747688",
    marginBottom: 8,
    marginLeft: 2,
  },
  coverBadge: {
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: "#0040e0",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  coverText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  urlBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    padding: 3,
  },
  addMoreText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#747688",
    marginTop: 4,
  },
});


// ─── URL modal styles ──────────────────────────────────────────────────────────
const urlStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 22,
    width: "100%",
    // subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eef1ff",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#191b24",
  },
  cardSub: {
    fontSize: 12,
    color: "#747688",
    marginTop: 1,
  },

  // ── Input ─────────────────────────────────────────────────────────────────
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e4e4f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
    backgroundColor: "#fafafa",
    marginBottom: 10,
  },
  inputWrapError: {
    borderColor: "#ff4d4f",
    backgroundColor: "#fff5f5",
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: "#191b24",
    padding: 0,        // remove default Android padding
  },

  // ── Error ─────────────────────────────────────────────────────────────────
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 4,
  },
  errorText: {
    color: "#ff4d4f",
    fontSize: 12,
    flex: 1,
  },

  // ── Preview ───────────────────────────────────────────────────────────────
  previewWrap: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 14,
    backgroundColor: "#f3f2ff",
  },
  preview: {
    width: "100%",
    height: 160,
  },
  previewPlaceholder: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  previewHint: {
    fontSize: 12,
    color: "#747688",
  },
  previewTick: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f0fdf4",
  },
  previewTickText: {
    fontSize: 12,
    color: "#22c55e",
    fontWeight: "600",
  },

  // ── Tip ───────────────────────────────────────────────────────────────────
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#f8f8fd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  tipText: {
    fontSize: 12,
    color: "#9898b8",
    flex: 1,
    lineHeight: 17,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: "#f3f2ff",
    alignItems: "center",
  },
  cancelText: {
    fontWeight: "700",
    color: "#444",
    fontSize: 14,
  },
  addBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: "#0040e0",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  addBtnDisabled: {
    backgroundColor: "#b0bef7",    // lighter blue when URL not yet verified
  },
  addText: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 14,
  },
});

export default ImageUploader;


