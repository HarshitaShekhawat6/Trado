import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  Image, ActivityIndicator, Keyboard, TouchableWithoutFeedback,
  Modal, ScrollView,
} from "react-native";
import { Controller } from "react-hook-form";
import useSignup from "../hooks/useSignup";

const LOGO = require("../../../../android/app/src/main/assets/image.png"); // ← apna actual path daalo

const SignupScreen = ({ navigation }) => {
  const { control, handleSubmit, errors, isLoading, handleSignup } = useSignup(navigation);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>

        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.title2}>Create your account</Text>
          <Text style={styles.subtitle}>
            Join the community. Experience high-end curation at your fingertips.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.code}>+91</Text>
            <View style={styles.divider} />
            <Controller
              control={control}
              name="phone"
              rules={{
                required: "Phone is required",
                pattern: { value: /^[0-9]{10}$/, message: "Enter valid 10-digit number" },
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="0000000000"
                  placeholderTextColor="#6b7280"
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={10}
                  value={value}
                  onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ""))}
                />
              )}
            />
          </View>
          {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
        </View>

        <Pressable
          style={[styles.button, isLoading && { backgroundColor: "#a0a0a0" }]}
          onPress={handleSubmit(handleSignup)}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Create Account</Text>}
        </Pressable>

        <View style={styles.termsBox}>
          <Text style={styles.termsText}>
            By creating an account, you agree to our{" "}
            <Text style={styles.link} onPress={() => setShowTerms(true)}>
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text style={styles.link} onPress={() => setShowTerms(true)}>
              Privacy Policy
            </Text>.
          </Text>
        </View>

        <Text style={styles.loginText}>
          Already have an account?{" "}
          <Text style={styles.loginLink} onPress={() => navigation.navigate("Login")}>
            Login
          </Text>
        </Text>

        {/* ── Terms & Conditions Modal ── */}
        <Modal visible={showTerms} animationType="slide" transparent onRequestClose={() => setShowTerms(false)}>
          <View style={modal.overlay}>
            <View style={modal.card}>
              <Text style={modal.title}>Terms & Conditions</Text>
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <Text style={modal.body}>
                  {`Welcome to Trado!\n\nBy using our app, you agree to the following terms:\n\n1. Use of Service\nTrado is a marketplace for buying and selling second-hand goods. You agree to use the platform lawfully and not engage in fraudulent activity.\n\n2. User Accounts\nYou are responsible for maintaining the confidentiality of your account and all activity that occurs under it.\n\n3. Listings\nAll listings must be accurate and honest. Misleading descriptions are strictly prohibited.\n\n4. Payments\nAll transactions are between buyers and sellers. Trado is not responsible for disputes arising from transactions.\n\n5. Privacy\nWe collect minimal personal data to operate the service. Your data is never sold to third parties.\n\n6. Termination\nWe reserve the right to suspend accounts that violate these terms.\n\n7. Changes\nWe may update these terms at any time. Continued use of the app constitutes acceptance.\n\nFor questions, contact us at support@trado.in`}
                </Text>
              </ScrollView>
              <Pressable style={modal.btn} onPress={() => setShowTerms(false)}>
                <Text style={modal.btnText}>I Understand</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

      </View>
    </TouchableWithoutFeedback>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container:    { flex: 1, padding: 20, backgroundColor: "#fbf8ff", justifyContent: "top" },
  header:       { marginBottom: 30, alignItems: "center" },
  logoBox:      { marginBottom: 18 },
  logo:         { width: 250, height: 250 },
  title2:       { fontSize: 26, fontWeight: "900", marginBottom: 8, textAlign: "center", color: "#0d06a2" },
  subtitle:     { color: "#666", textAlign: "center" },
  inputGroup:   { marginTop: 20 },
  label:        { marginBottom: 5, color: "#555" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#f3f2ff", borderRadius: 20, paddingHorizontal: 10 },
  code:         { fontWeight: "bold", paddingHorizontal: 10 },
  divider:      { width: 1, height: 30, backgroundColor: "#ccc" },
  input:        {  flex: 1, padding: 15, color: "#111", fontWeight: "600"  },
  errorText:    { color: "red", fontSize: 12, marginTop: 5, marginLeft: 10 },
  button:       { marginTop: 30, backgroundColor: "#2e5bff", padding: 18, borderRadius: 30, alignItems: "center" },
  btnText:      { color: "#fff", fontWeight: "bold" },
  termsBox:     { backgroundColor: "#f3f2ff", padding: 10, borderRadius: 10, marginTop: 20 },
  termsText:    { fontSize: 12, textAlign: "center" },
  link:         { color: "#2e5bff", fontWeight: "bold" },
  loginText:    { marginTop: 25, color: "#666", textAlign: "center" },
  loginLink:    { color: "#2e5bff", fontWeight: "bold" },
});

const modal = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  card:     { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: "80%" },
  title:    { fontSize: 20, fontWeight: "800", color: "#111", marginBottom: 16 },
  body:     { fontSize: 14, color: "#444", lineHeight: 22 },
  btn:      { marginTop: 16, backgroundColor: "#2e5bff", padding: 16, borderRadius: 30, alignItems: "center" },
  btnText:  { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
