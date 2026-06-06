import { useState, useRef, useEffect } from "react";
import { Alert } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { verifyOtpService } from "../services/auth.service";
import { useAuth } from "../../../navigation/AuthContext";
import Toast from "react-native-toast-message";

const useOtp = (phone, navigation) => {
  const [otp, setOtp]           = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef                = useRef(null);
const { login } = useAuth();


  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(30);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }; 

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const verifyMutation = useMutation({
    mutationFn: () => verifyOtpService(phone, otp.join("")),
    onSuccess: async (data) => {
  Toast.show({
    type: "success",
    text1: "OTP Verified",
    text2: "Login successful.",
    position: "top",
  });

  await login(data.token, {
    id: data.user.id,
    phone: data.user.phone,
    name: data.user.name || "",
  });
},
  });

  const handleVerify = () => {
    if (otp.join("").length !== 6) {
    Toast.show({
  type: "error",
  text1: "Invalid OTP",
  text2: "Please enter a 6-digit OTP.",
  position: "top",
});
      return;
    }
    verifyMutation.mutate();
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    startTimer();
  };

  return {
    otp,
    setOtp,
    timeLeft,
    formatTime,
    handleVerify,
    handleResend,
    isVerifying: verifyMutation.isPending,
    isResending: false,
  };
};

export default useOtp;
