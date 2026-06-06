  import {
    checkUserApi,
    registerUserApi,
    sendOtpApi,
    verifyOtpApi,
    resendOtpApi,
  } from "../api/auth.api";

  // Login — check if user exists
  export const checkUserService = async (phone) => {
    console.log("Checking user with phone-bbbb:", phone);
    const res = await checkUserApi(phone);
    return res.data;
  };

  // Signup — register new user
  export const registerService = async (phone) => {
    const res = await registerUserApi(phone);
    return res.data;
  };

  // Send OTP
  export const sendOtpService = async (phone) => {
    const res = await sendOtpApi(phone);
    return res.data;
  };

  // Verify OTP
  export const verifyOtpService = async (phone, otp) => {
    const res = await verifyOtpApi(phone, otp);
    return res.data;
  };

  // Resend OTP
  export const resendOtpService = async (phone) => {
    const res = await resendOtpApi(phone);
    return res.data;
  };