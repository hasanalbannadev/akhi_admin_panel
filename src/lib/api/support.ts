// অন-সাইট সাপোর্ট চ্যাট: কাস্টমার <-> অ্যাডমিন। কাস্টমার শুধু পাঠাতে ও নিজের মেসেজ এডিট করতে পারে, মুছতে পারে শুধু অ্যাডমিন।
import { api } from "./client";
import type { SupportMsg } from "@/types";

export const supportApi = {
  unread: () => api<{ count: number }>("/me/support/unread", { auth: true }),
  list: (after?: number) => api<SupportMsg[]>("/me/support", { auth: true, query: after ? { after } : undefined }),
  send: (text: string, images: string[]) => api<SupportMsg>("/me/support", { method: "POST", body: { text, images }, auth: true }),
  edit: (id: number, text: string, images: string[]) => api<SupportMsg>(`/me/support/${id}`, { method: "PUT", body: { text, images }, auth: true }),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api<{ url: string }>("/me/support/photo", { method: "POST", body: fd, auth: true });
  },
  discard: (url: string) => api<void>("/me/support/photo", { method: "DELETE", query: { url }, auth: true }),
};
