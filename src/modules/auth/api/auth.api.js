import API from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const checkUserApi = (phone) => {
  
  console.log("Checking user with phone-ccccc:", phone);
  console.log("API Endpoint:", ENDPOINTS.LOGIN);

  return API.post(ENDPOINTS.LOGIN, { phone });
};

export const registerUserApi = (phone) => {
  return API.post(ENDPOINTS.REGISTER, { phone });
};

export const sendOtpApi = (phone) => {
  return API.post(ENDPOINTS.SEND_OTP, { phone });
};

export const verifyOtpApi = (phone, otp) => {
  return API.post(ENDPOINTS.VERIFY_OTP, { phone, otp });
};

export const resendOtpApi = (phone) => {
  return API.post(ENDPOINTS.SEND_OTP, { phone });
};