// সাইটের সব সাধারণ তথ্য এক জায়গায়। বদলাতে চাইলে .env.local এ বদলান।
const env = (v: string | undefined, fallback = "") => (v && v.trim() ? v.trim() : fallback);

export const SITE = {
  name: env(process.env.NEXT_PUBLIC_SITE_NAME, "Akhi Lifestyle"),
  tagline: env(process.env.NEXT_PUBLIC_TAGLINE, "Style · Accessories · You"),
  url: env(process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000").replace(/\/$/, ""),
  phone: env(process.env.NEXT_PUBLIC_PHONE, "+880 1234 567890"),
  email: env(process.env.NEXT_PUBLIC_EMAIL, "akhilifestyle@gmail.com"),
  address: env(process.env.NEXT_PUBLIC_ADDRESS, "ঢাকা, বাংলাদেশ"),
  facebook: env(process.env.NEXT_PUBLIC_FACEBOOK_URL),
  instagram: env(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
  youtube: env(process.env.NEXT_PUBLIC_YOUTUBE_URL),
  messenger: env(process.env.NEXT_PUBLIC_MESSENGER_URL),
  whatsapp: env(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
  description:
    "Akhi Lifestyle - ব্যাগ, আয়নাঠারি, জুয়েলারি, বিউটি ও আরও অনেক স্টাইলিশ অ্যাক্সেসরিজ। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।",
};
