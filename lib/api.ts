const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

async function upload<T = unknown>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  adminLogin: (email: string, password: string) =>
    request<{ access_token: string; user: { name: string; email: string } }>("/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // Dashboard
  getStats: () => request<Record<string, unknown>>("/dashboard/stats"),

  // Categories
  getCategories: () => request<Category[]>("/categories/all"),
  createCategory: (data: Partial<Category>) => request<Category>("/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id: number, data: Partial<Category>) => request<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id: number) => request(`/categories/${id}`, { method: "DELETE" }),

  // Curated for Businesses — industries
  getBusinessCategories: () => request<BusinessCategory[]>("/business-categories/all"),
  getBusinessCategory: (id: number) => request<BusinessCategory>(`/business-categories/${id}`),
  createBusinessCategory: (data: BusinessCategoryCreate) =>
    request<BusinessCategory>("/business-categories", { method: "POST", body: JSON.stringify(data) }),
  updateBusinessCategory: (id: number, data: BusinessCategoryUpdate) =>
    request<BusinessCategory>(`/business-categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBusinessCategory: (id: number) =>
    request(`/business-categories/${id}`, { method: "DELETE" }),
  uploadCategoryImage: (id: number, file: File) => { const fd = new FormData(); fd.append("file", file); return upload(`/uploads/categories/${id}/image`, fd); },
  uploadBusinessCategoryHero: (id: number, file: File) => { const fd = new FormData(); fd.append("file", file); return upload<{ image_url: string }>(`/uploads/business-categories/${id}/hero`, fd); },
  uploadBusinessCategoryCard: (id: number, file: File) => { const fd = new FormData(); fd.append("file", file); return upload<{ image_url: string }>(`/uploads/business-categories/${id}/card`, fd); },

  // SubCategories
  createSubCategory: (data: Partial<SubCategory>) => request<SubCategory>("/categories/subcategories", { method: "POST", body: JSON.stringify(data) }),
  updateSubCategory: (id: number, data: Partial<SubCategory>) => request<SubCategory>(`/categories/subcategories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSubCategory: (id: number) => request(`/categories/subcategories/${id}`, { method: "DELETE" }),

  // Products
  getProducts: (subcategoryId?: number) => request<Product[]>(`/products/all${subcategoryId ? `?subcategory_id=${subcategoryId}` : ""}`),
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  // `business_category_ids` is write-only — the backend stores it in the M2M
  // junction table and surfaces the resolved objects in `business_categories`
  // on the way out.
  createProduct: (data: Partial<Product> & { business_category_ids?: number[] }) =>
    request<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: number, data: Partial<Product> & { business_category_ids?: number[] }) =>
    request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id: number) => request(`/products/${id}`, { method: "DELETE" }),
  uploadProductImage: (productId: number, file: File, isPrimary = false, variantId?: number) => {
    const fd = new FormData(); fd.append("file", file);
    const params = new URLSearchParams({ is_primary: String(isPrimary) });
    if (variantId) params.set("variant_id", String(variantId));
    return upload(`/uploads/products/${productId}/images?${params.toString()}`, fd);
  },
  uploadProductImagesBatch: (productId: number, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    return upload<ProductImage[]>(`/uploads/products/${productId}/images/batch`, fd);
  },
  setImageVariant: (productId: number, imageId: number, variantId: number | null) => {
    const url = variantId === null
      ? `/uploads/products/${productId}/images/${imageId}/variant`
      : `/uploads/products/${productId}/images/${imageId}/variant?variant_id=${variantId}`;
    return request<ProductImage>(url, { method: "PUT" });
  },
  deleteProductImage: (productId: number, imageId: number) => request(`/uploads/products/${productId}/images/${imageId}`, { method: "DELETE" }),
  addVariant: (productId: number, data: Partial<Variant>) => request<Variant>(`/products/${productId}/variants`, { method: "POST", body: JSON.stringify(data) }),
  updateVariant: (productId: number, variantId: number, data: Partial<Variant>) => request<Variant>(`/products/${productId}/variants/${variantId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteVariant: (productId: number, variantId: number) => request(`/products/${productId}/variants/${variantId}`, { method: "DELETE" }),
  getBrands: () => request<string[]>("/products/brands"),

  // Coupons (promo codes)
  listCoupons: () => request<Coupon[]>("/coupons"),
  createCoupon: (data: CouponCreate) => request<Coupon>("/coupons", { method: "POST", body: JSON.stringify(data) }),
  updateCoupon: (
    id: number,
    data: { valid_until?: string; is_active?: boolean; assigned_user_ids?: number[] | null },
  ) => request<Coupon>(`/coupons/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCoupon: (id: number) => request<{ ok: boolean }>(`/coupons/${id}`, { method: "DELETE" }),

  // Page-level SEO overrides (for static routes like /faqs, /about-us)
  listPageSeo: () => request<PageSeo[]>("/page-seo"),
  createPageSeo: (data: PageSeoCreate) => request<PageSeo>("/page-seo", { method: "POST", body: JSON.stringify(data) }),
  updatePageSeo: (id: number, data: PageSeoUpdate) => request<PageSeo>(`/page-seo/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePageSeo: (id: number) => request<void>(`/page-seo/${id}`, { method: "DELETE" }),

  // Static (footer-linked) editable pages — fixed set of 8 slugs, seeded by migration.
  listStaticPages: () => request<StaticPage[]>("/static-pages"),
  updateStaticPage: (id: number, data: StaticPageUpdate) => request<StaticPage>(`/static-pages/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  addDiscountSlab: (productId: number, data: { variant_id?: number | null; min_quantity: number; price_per_unit?: number; discount_percentage?: number }) => request<DiscountSlab>(`/products/${productId}/discounts`, { method: "POST", body: JSON.stringify(data) }),
  updateDiscountSlab: (productId: number, slabId: number, data: { variant_id?: number | null; min_quantity?: number; price_per_unit?: number }) => request<DiscountSlab>(`/products/${productId}/discounts/${slabId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDiscountSlab: (productId: number, slabId: number) => request(`/products/${productId}/discounts/${slabId}`, { method: "DELETE" }),
  setPrimaryImage: (productId: number, imageId: number) => request<void>(`/uploads/products/${productId}/images/${imageId}/primary`, { method: "PUT" }),

  // Users
  getUsers: () => request<User[]>("/users"),

  deleteUser: (id: number) => request(`/users/${id}`, { method: "DELETE" }),

  // Company Profiles
  getCompanyProfiles: () => request<CompanyProfile[]>("/company-profile/all"),
  getUserCompanyProfile: (userId: number) => request<CompanyProfile>(`/company-profile/user/${userId}`),

  // Orders
  getOrders: () => request<Order[]>("/orders"),
  updateOrderStatus: (id: number, status: string, note?: string) =>
    request(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status, note }) }),
  deleteOrder: (id: number) => request(`/orders/${id}`, { method: "DELETE" }),

  // Abandoned checkouts — customers who started a payment but no Order was materialized
  // (usually because Cashfree webhook never arrived). Used to find and rescue them.
  getAbandonedCheckouts: () =>
    request<Array<{
      pending_checkout_id: number;
      user_id: number;
      user_email: string | null;
      user_name: string | null;
      user_phone: string | null;
      cf_order_id: string | null;
      cf_payment_session_id: string | null;
      created_at: string | null;
      expires_at: string | null;
    }>>("/payments/admin/pending-checkouts"),
  recoverAbandonedCheckout: (pendingId: number) =>
    request<{ status: string; order_id?: number; payment_status?: string; total_amount?: number }>(
      `/payments/admin/recover/${pendingId}`,
      { method: "POST" },
    ),
  // Invoice — returns binary PDF blob (not JSON)
  downloadInvoice: async (orderId: number): Promise<Blob> => {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/orders/${orderId}/invoice`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Invoice download failed");
    }
    return res.blob();
  },
  resendInvoiceEmail: (orderId: number) =>
    request<{ detail: string }>(`/orders/${orderId}/resend-invoice`, { method: "POST" }),

  // Admin: Edit user
  updateUser: (userId: number, data: Partial<{ name: string; email: string; phone: string; is_active: boolean; is_admin: boolean }>) =>
    request<User>(`/users/${userId}`, { method: "PUT", body: JSON.stringify(data) }),

  // Admin: Addresses (any user)
  getUserAddresses: (userId: number) => request<Address[]>(`/addresses/admin/user/${userId}`),
  createUserAddress: (userId: number, data: Partial<Address>) =>
    request<Address>(`/addresses/admin/user/${userId}`, { method: "POST", body: JSON.stringify(data) }),
  updateAddress: (addressId: number, data: Partial<Address>) =>
    request<Address>(`/addresses/admin/${addressId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAddress: (addressId: number) =>
    request<void>(`/addresses/admin/${addressId}`, { method: "DELETE" }),

  // Admin: Update a user's company profile
  updateUserCompanyProfile: (userId: number, data: Partial<CompanyProfile>) =>
    request<CompanyProfile>(`/company-profile/user/${userId}`, { method: "PUT", body: JSON.stringify(data) }),

  // Wallet & Referrals
  getAllWallets: () => request<WalletInfo[]>("/wallet/all"),
  creditWallet: (userId: number, amount: number, description: string) =>
    request<{ message: string; balance: number }>(`/wallet/credit/${userId}`, { method: "POST", body: JSON.stringify({ amount, description }) }),
  getAllReferrals: () => request<ReferralInfo[]>("/referrals/all"),

  // Reviews
  getReviews: () => request<Review[]>("/reviews/all"),
  approveReview: (id: number) => request<Review>(`/reviews/${id}/approve`, { method: "PUT" }),
  rejectReview: (id: number) => request<Review>(`/reviews/${id}/reject`, { method: "PUT" }),
  deleteReview: (id: number) => request(`/reviews/${id}`, { method: "DELETE" }),

  // Reports & Exports
  getSalesSummary: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const qs = params.toString();
    return request<SalesSummary>(`/reports/sales-summary${qs ? `?${qs}` : ""}`);
  },
  getGstSummary: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const qs = params.toString();
    return request<GstSummary>(`/reports/gst-summary${qs ? `?${qs}` : ""}`);
  },
  // CSV downloads — return blob URL and filename for the caller to trigger download
  downloadOrdersCsv: async (start?: string, end?: string, status?: string) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    if (status) params.set("status", status);
    return downloadCsv(`/reports/orders.csv${params.toString() ? `?${params.toString()}` : ""}`);
  },
  downloadGstCsv: async (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    return downloadCsv(`/reports/gst.csv${params.toString() ? `?${params.toString()}` : ""}`);
  },
  downloadProductsCsv: async () => downloadCsv("/reports/products.csv"),
};

// Helper: fetch a CSV endpoint with auth, trigger a browser download
async function downloadCsv(path: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Download failed (${res.status})`);
  }
  // Extract filename from Content-Disposition if present
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : "claybag-export.csv";
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Report types
export interface SalesSummary {
  start: string;
  end: string;
  total_revenue: number;
  order_count: number;
  avg_order_value: number;
  daily_revenue: { date: string; revenue: number; orders: number }[];
  top_products: { id: number; name: string; units_sold: number; revenue: number }[];
  top_customers: { id: number; name: string; email: string; orders: number; spent: number }[];
}

export interface GstSummary {
  start: string;
  end: string;
  total_taxable: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  by_state: { state: string; taxable: number; cgst: number; sgst: number; igst: number; orders: number }[];
  by_hsn: { hsn: string; rate: number; taxable: number; tax: number; units: number }[];
}

// Types
export interface SeoFields {
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  og_image?: string | null;
  seo_canonical?: string | null;
  seo_noindex?: boolean | null;
}
export interface Category extends SeoFields { id: number; name: string; slug: string; icon: string; image_url?: string; is_active: boolean; subcategories: SubCategory[]; }
export interface SubCategory extends SeoFields { id: number; name: string; slug: string; category_id: number; image_url?: string; is_active: boolean; }

// Curated for Businesses — industries/business verticals (flat, admin-managed).
export interface BusinessCategory extends SeoFields {
  id: number;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  hero_image_url?: string | null;
  card_image_url?: string | null;
  display_order: number;
  is_active: boolean;
  product_count: number;
  created_at?: string;
}
export interface BusinessCategoryCreate extends SeoFields {
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  hero_image_url?: string | null;
  card_image_url?: string | null;
  display_order?: number;
  is_active?: boolean;
}
export interface BusinessCategoryUpdate extends SeoFields {
  name?: string;
  slug?: string;
  tagline?: string | null;
  description?: string | null;
  hero_image_url?: string | null;
  card_image_url?: string | null;
  display_order?: number;
  is_active?: boolean;
}
// Brief reference used inside Product.business_categories.
export interface BusinessCategoryRef { id: number; name: string; slug: string; }
export interface Product extends SeoFields { id: number; name: string; slug?: string; description?: string; specifications?: string; use_cases?: string; materials?: string; delivery_info?: string; design_upload_info?: string; min_order_qty?: number | null; moq_unit?: string | null; pricing_mode?: "per_unit" | "per_area" | string | null; variant_mode_override?: string | null; option_label?: string | null; variant_mode?: string; branding_info?: string; branding_methods?: string[]; size_chart_url?: string; hsn_code?: string | null; gst_rate?: number | null; brand?: string | null; subcategory_id: number; base_price: number; compare_price?: number | null; is_active: boolean; has_variants: boolean; is_featured: boolean; is_new_arrival?: boolean; is_enquiry_only?: boolean; price_range_max?: number | null; images: ProductImage[]; variants: Variant[]; discount_slabs: DiscountSlab[]; business_categories?: BusinessCategoryRef[]; }
export interface PageSeo extends SeoFields { id: number; route: string; label?: string | null; created_at?: string | null; updated_at?: string | null; }
export interface PageSeoCreate extends SeoFields { route: string; label?: string | null; }
export interface PageSeoUpdate extends SeoFields { label?: string | null; }
export interface StaticPage extends SeoFields {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  sidebar_label?: string | null;
  body_markdown: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string | null;
}
export interface StaticPageUpdate extends SeoFields {
  title?: string;
  subtitle?: string | null;
  sidebar_label?: string | null;
  body_markdown?: string;
  is_active?: boolean;
}
export interface ProductImage { id: number; image_url: string; is_primary: boolean; sort_order: number; variant_id?: number | null; }
export interface Variant { id: number; variant_type: string; variant_value: string; variant_unit?: string | null; price_adjustment: number; option_price?: number | null; option_mrp?: number | null; stock: number; sku?: string; color_hex?: string | null; }
export interface DiscountSlab { id: number; variant_id?: number | null; min_quantity: number; price_per_unit?: number | null; discount_percentage?: number | null; }
export interface User { id: number; name: string; email: string; phone?: string; is_admin: boolean; is_active: boolean; created_at: string; }
export interface Order { id: number; order_number?: string; user_id: number; status: string; total_amount: number; shipping_name: string; shipping_phone: string; shipping_address: string; shipping_city: string; shipping_state?: string; shipping_pincode: string; notes?: string; taxable_amount?: number | null; cgst_amount?: number; sgst_amount?: number; igst_amount?: number; coupon_id?: number | null; coupon_discount?: number; coins_applied?: number; referral_discount?: number; created_at: string; items: OrderItem[]; tracking: TrackingEntry[]; }
export interface OrderItem { id: number; product_id: number; product_name?: string; product_slug?: string; product_image?: string; variant_id?: number; variant_label?: string; quantity: number; unit_price: number; total_price: number; discount_applied: number; dimension_length?: number | null; dimension_breadth?: number | null; computed_area?: number | null; area_rate?: number | null; }
export interface TrackingEntry { id: number; status: string; note?: string; created_at: string; }
export interface Review { id: number; user_id: number; product_id: number; rating: number; comment?: string; is_approved: boolean; created_at: string; user_name: string; product_name: string; }
export interface CompanyProfile { id: number; user_id: number; company_name: string; business_type: string; gst_number?: string; registered_address?: string; contact_person?: string; description?: string; created_at: string; updated_at?: string; }
export interface Address { id: number; label: string; name: string; phone: string; address: string; city: string; state?: string | null; pincode: string; is_default: boolean; created_at?: string; }
export interface WalletInfo { id: number; user_id: number; user_name?: string; user_email?: string; balance: number; created_at?: string; }
export interface ReferralInfo { id: number; referrer_name?: string; referrer_email?: string; referred_name?: string; referred_email?: string; referral_code: string; status: string; coins_credited: boolean; created_at?: string; completed_at?: string; }
export interface CouponAssignee { id: number; name: string; email: string; }
export interface Coupon {
  id: number;
  code: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  min_order_amount: number | null;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  usage_limit: number | null;
  usage_limit_per_user: number | null;
  first_n_orders_only: number | null;
  usage_count: number;
  used_at: string | null;
  used_by_order_id: number | null;
  created_at: string;
  status: "active" | "scheduled" | "expired" | "used" | "exhausted" | "disabled";
  assigned_user_ids: number[];
  assigned_users: CouponAssignee[];
}
export interface CouponCreate {
  code: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  min_order_amount?: number | null;
  valid_from: string;
  valid_until: string;
  usage_limit?: number | null;
  usage_limit_per_user?: number | null;
  first_n_orders_only?: number | null;
  assigned_user_ids?: number[];
}
