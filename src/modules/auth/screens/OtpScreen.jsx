import React from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  Image, Keyboard, TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import useOtp from "../hooks/useOtp";

const LOGO = require("../../../../android/app/src/main/assets/image.png"); // ← apna actual path daalo

const OtpScreen = ({ route, navigation }) => {
  const phone = route?.params?.phone || "";
  const { otp, setOtp, timeLeft, formatTime, handleVerify, handleResend, isVerifying } = useOtp(phone, navigation);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>

          {/* Back button — sirf icon, puri line nahi */}
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#2e5bff" />
          </Pressable>

          <View style={styles.card}>
            <View style={styles.iconBox}>
              <Image source={LOGO} style={styles.iconImage} resizeMode="contain" />
            </View>

            <Text style={styles.title}>Verify Identity</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to{"\n"}
              <Text style={styles.phone}>{phone}</Text>
            </Text>

            <Text style={styles.otpLabel}>Verification Code</Text>

            <TextInput
              style={styles.singleOtpInput}
              placeholder="000000"
              placeholderTextColor="#6b7280"
              keyboardType="number-pad"
              maxLength={6}
              value={otp.join("")}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, "");
                setOtp(cleaned.split(""));
              }}
            />

            <Pressable
              style={[styles.button, isVerifying && { backgroundColor: "#a0a0a0" }]}
              onPress={handleVerify}
              disabled={isVerifying}
            >
              <Text style={styles.btnText}>
                {isVerifying ? "Verifying..." : "Verify & Continue"}
              </Text>
            </Pressable>

            <Text style={styles.footer}>Didn't receive the code?</Text>
            <Pressable onPress={handleResend} disabled={timeLeft > 0}>
              <Text style={[styles.resend, timeLeft > 0 && styles.resendDisabled]}>
                {timeLeft > 0 ? `Resend Code (${formatTime(timeLeft)})` : "Resend Code"}
              </Text>
            </Pressable>
          </View>

        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default OtpScreen;

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#fbf8ff" },
  backBtn:        { width: 44, height: 44, justifyContent: "center", alignItems: "center", marginLeft: 12, marginTop: 8 },
  card:           { width: "90%", alignSelf: "center", backgroundColor: "rgba(255,255,255,0.8)", padding: 20, borderRadius: 20 },
  iconBox:        { alignSelf: "center", marginBottom: 18 },
  iconImage:      { width: 250, height: 250 },
  logo:           { width: 250, height: 250 },
  title:          { fontSize: 24, fontWeight: "bold", textAlign: "center" },
  subtitle:       { textAlign: "center", marginTop: 10, color: "#666" },
  phone:          { color: "#2e5bff", fontWeight: "bold" },
  otpLabel:       { marginTop: 25, marginBottom: 18, fontSize: 13, color: "#777", textAlign: "center", letterSpacing: 1 },
  singleOtpInput: { backgroundColor: "#f3f2ff", paddingVertical: 18, borderRadius: 14, fontSize: 24, textAlign: "center", letterSpacing: 12, elevation: 4, borderWidth: 1, borderColor: "#d8dcff", color: "#111827", fontWeight: "700" },
  button:         { marginTop: 30, backgroundColor: "#2e5bff", padding: 15, borderRadius: 15, alignItems: "center" },
  btnText:        { color: "#fff", fontWeight: "bold" },
  footer:         { textAlign: "center", marginTop: 20, color: "#666" },
  resend:         { textAlign: "center", color: "#2e5bff", fontWeight: "bold", marginTop: 5 },
  resendDisabled: { color: "#aaa" },
});
