import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { registerService } from "../services/auth.service";
import Toast from "react-native-toast-message";

const useSignup = (navigation) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const registerMutation = useMutation({
    mutationFn: (phone) => registerService(phone),
    onSuccess: (_, phone) => {
      // Number DB mein save hua — seedha OTP page pe bhejo
      Toast.show({
  type: "success",
  text1: "Registration Successful",
  text2: "Please verify OTP sent to your phone.",
  position: "top",
});
      navigation.navigate("OTP", { phone });
    },
    onError: (error) => {
     Toast.show({
  type: "error",
  text1: "Signup Failed",
  text2:
    error?.response?.data?.message ||
    error?.message ||
    "Please try again.",
  position: "top",
});
    },
  });

  const handleSignup = (formData) => {
    registerMutation.mutate(formData.phone);
  };

  return {
    control,
    handleSubmit,
    errors,
    isLoading: registerMutation.isPending,
    handleSignup,
  };
};

export default useSignup;