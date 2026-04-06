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

async function upload(path: string, formData: FormData): Promise<unknown> {
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
  return res.json();
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
  uploadCategoryImage: (id: number, file: File) => { const fd = new FormData(); fd.append("file", file); return upload(`/uploads/categories/${id}/image`, fd); },

  // SubCategories
  createSubCategory: (data: Partial<SubCategory>) => request<SubCategory>("/categories/subcategories", { method: "POST", body: JSON.stringify(data) }),
  updateSubCategory: (id: number, data: Partial<SubCategory>) => request<SubCategory>(`/categories/subcategories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSubCategory: (id: number) => request(`/categories/subcategories/${id}`, { method: "DELETE" }),

  // Products
  getProducts: (subcategoryId?: number) => request<Product[]>(`/products/all${subcategoryId ? `?subcategory_id=${subcategoryId}` : ""}`),
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  createProduct: (data: Partial<Product>) => request<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: number, data: Partial<Product>) => request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id: number) => request(`/products/${id}`, { method: "DELETE" }),
  uploadProductImage: (productId: number, file: File, isPrimary = false) => {
    const fd = new FormData(); fd.append("file", file);
    return upload(`/uploads/products/${productId}/images?is_primary=${isPrimary}`, fd);
  },
  deleteProductImage: (productId: number, imageId: number) => request(`/uploads/products/${productId}/images/${imageId}`, { method: "DELETE" }),
  addVariant: (productId: number, data: Partial<Variant>) => request<Variant>(`/products/${productId}/variants`, { method: "POST", body: JSON.stringify(data) }),
  deleteVariant: (productId: number, variantId: number) => request(`/products/${productId}/variants/${variantId}`, { method: "DELETE" }),
  addDiscountSlab: (productId: number, data: { min_quantity: number; discount_percentage: number }) => request<DiscountSlab>(`/products/${productId}/discounts`, { method: "POST", body: JSON.stringify(data) }),
  deleteDiscountSlab: (productId: number, slabId: number) => request(`/products/${productId}/discounts/${slabId}`, { method: "DELETE" }),

  // Users
  getUsers: () => request<User[]>("/users"),

  // Orders
  getOrders: () => request<Order[]>("/orders"),
  updateOrderStatus: (id: number, status: string, note?: string) =>
    request(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status, note }) }),

  // Reviews
  getReviews: () => request<Review[]>("/reviews/all"),
  approveReview: (id: number) => request<Review>(`/reviews/${id}/approve`, { method: "PUT" }),
  rejectReview: (id: number) => request<Review>(`/reviews/${id}/reject`, { method: "PUT" }),
  deleteReview: (id: number) => request(`/reviews/${id}`, { method: "DELETE" }),
};

// Types
export interface Category { id: number; name: string; slug: string; icon: string; image_url?: string; is_active: boolean; subcategories: SubCategory[]; }
export interface SubCategory { id: number; name: string; slug: string; category_id: number; image_url?: string; is_active: boolean; }
export interface Product { id: number; name: string; description?: string; specifications?: string; use_cases?: string; materials?: string; delivery_info?: string; subcategory_id: number; base_price: number; is_active: boolean; has_variants: boolean; is_featured: boolean; images: ProductImage[]; variants: Variant[]; discount_slabs: DiscountSlab[]; }
export interface ProductImage { id: number; image_url: string; is_primary: boolean; sort_order: number; }
export interface Variant { id: number; variant_type: string; variant_value: string; price_adjustment: number; stock: number; sku?: string; }
export interface DiscountSlab { id: number; min_quantity: number; discount_percentage: number; }
export interface User { id: number; name: string; email: string; phone?: string; is_admin: boolean; is_active: boolean; created_at: string; }
export interface Order { id: number; user_id: number; status: string; total_amount: number; shipping_name: string; shipping_phone: string; shipping_address: string; shipping_city: string; shipping_pincode: string; notes?: string; created_at: string; items: OrderItem[]; tracking: TrackingEntry[]; }
export interface OrderItem { id: number; product_id: number; variant_id?: number; quantity: number; unit_price: number; total_price: number; discount_applied: number; }
export interface TrackingEntry { id: number; status: string; note?: string; created_at: string; }
export interface Review { id: number; user_id: number; product_id: number; rating: number; comment?: string; is_approved: boolean; created_at: string; user_name: string; product_name: string; }
