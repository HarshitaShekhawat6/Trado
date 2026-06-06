import React from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  Image, ActivityIndicator, Keyboard, TouchableWithoutFeedback, Modal, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useLogin from "../hooks/useLogin";

const LOGO = require("../../../../android/app/src/main/assets/image.png"); 

const LoginScreen = ({ navigation }) => {
  const { phone, setPhone, isValidPhone, isLoading, handleLogin } = useLogin(navigation);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>

        

          <View style={styles.content}>
            <View style={styles.logoBox}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PHONE NUMBER</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.code}>+91</Text>
                <View style={styles.divider} />
                <TextInput
                  placeholder="999 999 9999"
                  placeholderTextColor="#6b7280"
                  style={styles.input}
                  value={phone}
                  keyboardType="numeric"
                  maxLength={10}
                  onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
                />
              </View>
            </View>

            <Pressable
              style={[styles.button, (!isValidPhone || isLoading) && { backgroundColor: "#a0a0a0" }]}
              onPress={handleLogin}
              disabled={!isValidPhone || isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Login</Text>}
            </Pressable>

            <Text style={styles.signupText}>
              Don't have an account?{" "}
              <Text style={styles.signupLink} onPress={() => navigation.navigate("Signup")}>
                Sign Up
              </Text>
            </Text>
          </View>

        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#fbf8ff" },
  content:      { flex: 1, alignItems: "center", padding: 20 },
  logoBox:      { marginBottom: 28 },
  logo:         { width: 250, height: 250 },
  inputGroup:   { width: "100%" },
  label:        { fontSize: 12, color: "#777", marginBottom: 8 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#f3f2ff", borderRadius: 12 },
  code:         { paddingHorizontal: 15, fontWeight: "bold" },
  divider:      { width: 1, height: 30, backgroundColor: "#ccc" },
  input:        { flex: 1, padding: 15, color: "#111", fontWeight: "600" },
  button:       { width: "100%", marginTop: 50, backgroundColor: "#2e5bff", padding: 18, borderRadius: 30, alignItems: "center" },
  btnText:      { color: "#fff", fontWeight: "bold" },
  signupText:   { marginTop: 25, color: "#666" },
  signupLink:   { color: "#2e5bff", fontWeight: "bold" },
});
