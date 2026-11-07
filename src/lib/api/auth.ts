// ফোন OTP লগইন + প্রোফাইল + ঠিকানা
import { api } from "./client";
import type { Address, AddressIn, OtpSent, TokenOut, User } from "@/types";

export const authApi = {
  sendOtp: (phone: string) => api<OtpSent>("/auth/otp/send", { method: "POST", body: { phone } }),
  verifyOtp: (phone: string, code: string) =>
    api<TokenOut>("/auth/otp/verify", { method: "POST", body: { phone, code } }),
  me: () => api<User>("/me", { auth: true }),
  updateMe: (data: { name?: string | null; email?: string | null; avatar_url?: string | null }) =>
    api<User>("/me", { method: "PATCH", body: data, auth: true }),
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api<{ url: string }>("/me/avatar", { method: "POST", body: fd, auth: true });
  },

  addresses: () => api<Address[]>("/me/addresses", { auth: true }),
  addAddress: (a: AddressIn) => api<Address>("/me/addresses", { method: "POST", body: a, auth: true }),
  updateAddress: (id: number, a: AddressIn) =>
    api<Address>(`/me/addresses/${id}`, { method: "PUT", body: a, auth: true }),
  deleteAddress: (id: number) => api<void>(`/me/addresses/${id}`, { method: "DELETE", auth: true }),
  makeDefault: (id: number) => api<Address>(`/me/addresses/${id}/default`, { method: "PATCH", auth: true }),
};
