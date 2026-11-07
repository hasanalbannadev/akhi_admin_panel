// পণ্য, ক্যাটাগরি, সার্চ, ডেলিভারি জোন - সবই public API
import { api } from "./client";
import type {
  Banner, Category, Offer, CategoryDetail, DeliveryZone, Paged, Product, ReviewsOut, ShopInfo, Suggestion,
} from "@/types";

export interface ProductQuery {
  q?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  sort?: "new" | "price_asc" | "price_desc";
  page?: number;
  page_size?: number;
}

export const catalogApi = {
  categories: (revalidate = 300) => api<Category[]>("/categories", { revalidate }),
  categoryDetail: (slug: string, revalidate = 300) => api<CategoryDetail>(`/categories/${slug}`, { revalidate }),
  products: (q: ProductQuery, revalidate = 60) =>
    api<Paged<Product>>("/products", { query: { ...q }, revalidate }),
  product: (slug: string, revalidate = 60) => api<Product>(`/products/${slug}`, { revalidate }),
  related: (slug: string, limit = 8, revalidate = 120) =>
    api<Product[]>(`/products/${slug}/related`, { query: { limit }, revalidate }),
  newArrivals: (limit = 12, revalidate = 60) => api<Product[]>("/products/new", { query: { limit }, revalidate }),
  bestSellers: (limit = 12, revalidate = 60) =>
    api<Product[]>("/products/best-sellers", { query: { limit }, revalidate }),
  suggest: (q: string, signal?: AbortSignal) => api<Suggestion[]>("/search/suggest", { query: { q }, signal }),
  offers: (revalidate = 60) => api<Offer[]>("/offers", { revalidate }),
  offer: (slug: string, revalidate = 60) => api<{ offer: Offer; products: Product[] }>(`/offers/${slug}`, { revalidate }),
  banners: (revalidate = 120, placement: "hero" | "promo" = "hero") => api<Banner[]>("/banners", { query: { placement }, revalidate }),
  shopInfo: (revalidate = 300) => api<ShopInfo>("/shop/info", { revalidate }),
  zones: (revalidate = 300) => api<DeliveryZone[]>("/delivery/zones", { revalidate }),
  deliveryFee: (district: string, subtotal: number) =>
    api<{ district: string; fee: number }>("/delivery/fee", { query: { district, subtotal } }),
  reviews: (slug: string, page = 1) =>
    api<ReviewsOut>(`/products/${slug}/reviews`, { query: { page, page_size: 10 } }),
};
