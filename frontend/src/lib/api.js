const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function fetchDashboardData() {
  try {
    const res = await fetch(`${API_URL}/dashboard`);
    if (!res.ok) throw new Error("Failed to fetch dashboard data");
    return await res.json();
  } catch (err) {
    console.warn("Backend offline or unreachable, fallback active", err);
    return null;
  }
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
