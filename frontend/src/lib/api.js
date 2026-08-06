const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function fetchDashboardData() {
  try {
    const res = await fetch(`${API_URL}/dashboard`);
    if (!res.ok) throw new Error("Failed to fetch dashboard data");
    return await res.json();
  } catch (err) {
    console.warn("Backend offline or unreachable", err);
    return null;
  }
}

export async function fetchCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    return await res.json();
  } catch (err) {
    console.warn("Category API error", err);
    return { success: false, data: [] };
  }
}

export async function createCategory(data) {
  const res = await fetch(`${API_URL}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create category");
  return await res.json();
}

export async function updateCategory(id, data) {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update category");
  return await res.json();
}

export async function deleteCategory(id) {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete category");
  return await res.json();
}

export async function addSubcategory(categoryId, data) {
  const res = await fetch(`${API_URL}/categories/${categoryId}/subcategories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add subcategory");
  return await res.json();
}

export async function deleteSubcategory(categoryId, subId) {
  const res = await fetch(`${API_URL}/categories/${categoryId}/subcategories/${subId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete subcategory");
  return await res.json();
}

export async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error("Failed to fetch products");
    return await res.json();
  } catch (err) {
    console.warn("Product API error", err);
    return { success: false, data: [] };
  }
}

export async function createProduct(data) {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create product");
  return await res.json();
}

export async function updateProduct(id, data) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update product");
  return await res.json();
}

export async function deleteProduct(id) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete product");
  return await res.json();
}

export async function uploadImageToCloudinary(file, title = "") {
  const formData = new FormData();
  formData.append("image", file);
  if (title) formData.append("title", title);

  const res = await fetch(`${API_URL}/media/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Image upload failed");
  return await res.json();
}

export async function fetchMediaList() {
  const res = await fetch(`${API_URL}/media`);
  if (!res.ok) throw new Error("Failed to fetch media list");
  return await res.json();
}
