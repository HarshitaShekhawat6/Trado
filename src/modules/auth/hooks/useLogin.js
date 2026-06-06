import { useState } from "react";
import { Alert } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { checkUserService } from "../services/auth.service";
import Toast from "react-native-toast-message";

const useLogin = (navigation) => {
  const [phone, setPhone] = useState("");

  const isValidPhone = phone.length === 10;

  const loginMutation = useMutation({
    mutationFn: () => checkUserService(phone),
    onSuccess: () => {
      // DB mein number mila — seedha OTP page pe bhejo
     Toast.show({
  type: "success",
  text1: "Login Successful",
  text2: "Please verify OTP sent to your phone.",
  position: "top",
});
      navigation.navigate("OTP", { phone });
    },
    onError: (error) => {
Toast.show({
  type: "error",
  text1: "Login Failed",
  text2:
    error?.response?.data?.message ||
    error?.message ||
    "Please try again.",
  position: "top",
});
    },
  });

  const handleLogin = () => {
    if (!isValidPhone) {
     Toast.show({
  type: "error",
  text1: "Invalid Phone Number",
  text2: "Please enter a valid 10-digit phone number.",
  position: "top",
});
      return;
    }
    loginMutation.mutate();
  };

  return {
    phone,
    setPhone,
    isValidPhone,
    isLoading: loginMutation.isPending,
    handleLogin,
  };
};

export default useLogin;