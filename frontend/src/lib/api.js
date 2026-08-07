const rawApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

export function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function uploadMediaApi(file) {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_URL}/media/upload`, {
    method: "POST",
    headers: { ...getAuthHeader() },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Upload failed");
  return data.data.url;
}


export async function loginUserApi(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Invalid credentials");
  }
  localStorage.setItem("token", data.data.token);
  localStorage.setItem("user", JSON.stringify(data.data));
  return data.data;
}

export function logoutUserApi() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function getCurrentUserApi() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Unauthorized");
    const data = await res.json();
    return data.data;
  } catch (err) {
    logoutUserApi();
    return null;
  }
}

export async function fetchDashboardData() {
  try {
    const res = await fetch(`${API_URL}/dashboard`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch dashboard data");
    return await res.json();
  } catch (err) {
    console.warn("Backend offline or unreachable", err);
    return null;
  }
}

export async function fetchCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      headers: { ...getAuthHeader() },
    });
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
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create category");
  return await res.json();
}

export async function updateCategory(id, data) {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update category");
  return await res.json();
}

export async function deleteCategory(id) {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to delete category");
  return await res.json();
}

export async function addSubcategory(categoryId, data) {
  const res = await fetch(`${API_URL}/categories/${categoryId}/subcategories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add subcategory");
  return await res.json();
}

export async function deleteSubcategory(categoryId, subId) {
  const res = await fetch(`${API_URL}/categories/${categoryId}/subcategories/${subId}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to delete subcategory");
  return await res.json();
}

export async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/products`, {
      headers: { ...getAuthHeader() },
    });
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
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create product");
  return await res.json();
}

export async function updateProduct(id, data) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update product");
  return await res.json();
}

export async function deleteProduct(id) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to delete product");
  return await res.json();
}

export async function fetchDecantingLogs() {
  try {
    const res = await fetch(`${API_URL}/decanting`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch decanting logs");
    return await res.json();
  } catch (err) {
    console.warn("Decanting API error", err);
    return { success: false, data: [] };
  }
}

export async function createDecantingLog(data) {
  const res = await fetch(`${API_URL}/decanting`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to record decanting process");
  }
  return json;
}

export async function fetchMills() {
  try {
    const res = await fetch(`${API_URL}/mills`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch Textile Mills");
    return await res.json();
  } catch (err) {
    console.warn("Mills API error", err);
    return { success: false, data: [] };
  }
}

export async function createMill(data) {
  const res = await fetch(`${API_URL}/mills`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to create Textile Mill profile");
  }
  return json;
}

export async function updateMill(id, data) {
  const res = await fetch(`${API_URL}/mills/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to update Textile Mill profile");
  }
  return json;
}

export async function deleteMill(id) {
  const res = await fetch(`${API_URL}/mills/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to delete Textile Mill profile");
  return await res.json();
}

export async function fetchChallans() {
  try {
    const res = await fetch(`${API_URL}/challans`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch Delivery Challans");
    return await res.json();
  } catch (err) {
    console.warn("Challans API error", err);
    return { success: false, data: [] };
  }
}

export async function createChallan(data) {
  const res = await fetch(`${API_URL}/challans`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to issue Delivery Challan");
  }
  return json;
}

export async function updateChallanStatus(id, data) {
  const res = await fetch(`${API_URL}/challans/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to update Challan status");
  }
  return json;
}

export async function fetchPosSales() {
  try {
    const res = await fetch(`${API_URL}/pos/sales`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch POS Sales");
    return await res.json();
  } catch (err) {
    console.warn("POS API error", err);
    return { success: false, data: [] };
  }
}

export async function createPosSale(data) {
  const res = await fetch(`${API_URL}/pos/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to complete POS sale transaction");
  }
  return json;
}

export async function fetchLedgerEntries(millId = "") {
  try {
    const url = millId ? `${API_URL}/ledger?millId=${millId}` : `${API_URL}/ledger`;
    const res = await fetch(url, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch Ledger entries");
    return await res.json();
  } catch (err) {
    console.warn("Ledger API error", err);
    return { success: false, data: [] };
  }
}

export async function createPaymentEntry(data) {
  const res = await fetch(`${API_URL}/ledger/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to record payment entry");
  }
  return json;
}

export async function fetchAgingReport() {
  try {
    const res = await fetch(`${API_URL}/ledger/aging`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch Aging report");
    return await res.json();
  } catch (err) {
    console.warn("Aging API error", err);
    return { success: false, data: [] };
  }
}

export async function uploadImageToCloudinary(file, title = "") {
  const formData = new FormData();
  formData.append("image", file);
  if (title) formData.append("title", title);

  const res = await fetch(`${API_URL}/media/upload`, {
    method: "POST",
    headers: { ...getAuthHeader() },
    body: formData,
  });

  if (!res.ok) throw new Error("Image upload failed");
  return await res.json();
}

export async function fetchMediaList() {
  const res = await fetch(`${API_URL}/media`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to fetch media list");
  return await res.json();
}

export async function fetchCashTransactionsApi(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/cash?${query}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch cash transactions");
    return await res.json();
  } catch (err) {
    console.warn("Cash transactions API error", err);
    return { success: false, data: [] };
  }
}

export async function createCashTransactionApi(payload) {
  const res = await fetch(`${API_URL}/cash`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to record cash transaction");
  }
  return data;
}

export async function fetchPartyCashSummaryApi() {
  try {
    const res = await fetch(`${API_URL}/cash/party-summary`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch party cash summary");
    return await res.json();
  } catch (err) {
    console.warn("Party cash summary API error", err);
    return { success: false, data: [] };
  }
}

export async function deleteCashTransactionApi(id) {
  const res = await fetch(`${API_URL}/cash/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to delete cash transaction");
  }
  return data;
}

export async function fetchSalesReportApi(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/sales-reports/sales?${query}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch sales report");
    return await res.json();
  } catch (err) {
    console.warn("Sales report API error", err);
    return { success: false, summary: { totalSalesRevenue: 0, posSalesTotal: 0, challanSalesTotal: 0, totalSalesCount: 0 }, data: { posSales: [], challans: [] } };
  }
}

export async function fetchPurchasesApi(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/sales-reports/purchases?${query}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch stock purchases");
    return await res.json();
  } catch (err) {
    console.warn("Purchases API error", err);
    return { success: false, data: [], totalCost: 0 };
  }
}

export async function createPurchaseApi(payload) {
  const res = await fetch(`${API_URL}/sales-reports/purchases`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to record purchase entry");
  }
  return data;
}

export async function fetchPartySalesRecordApi() {
  try {
    const res = await fetch(`${API_URL}/sales-reports/party-sales`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch party sales records");
    return await res.json();
  } catch (err) {
    console.warn("Party sales API error", err);
    return { success: false, data: [] };
  }
}

export async function fetchProfitLossApi(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/profit-loss?${query}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch profit and loss summary");
    return await res.json();
  } catch (err) {
    console.warn("Profit and Loss API error", err);
    return { success: false, data: { totalSalesRevenue: 0, grossProfit: 0, operatingExpenses: 0, netProfit: 0, marginPercentage: 0 } };
  }
}

export async function fetchSuppliersApi(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/suppliers?${query}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch suppliers");
    return await res.json();
  } catch (err) {
    console.warn("Suppliers API error", err);
    return { success: false, data: [] };
  }
}

export async function createSupplierApi(payload) {
  const res = await fetch(`${API_URL}/suppliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to create supplier profile");
  }
  return data;
}

export async function createSupplierPaymentApi(payload) {
  const res = await fetch(`${API_URL}/suppliers/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to record supplier payment");
  }
  return data;
}

export async function fetchSupplierLedgerApi(supplierId = "") {
  try {
    const endpoint = supplierId ? `${API_URL}/suppliers/ledger/${supplierId}` : `${API_URL}/suppliers/ledger`;
    const res = await fetch(endpoint, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch supplier ledger");
    return await res.json();
  } catch (err) {
    console.warn("Supplier ledger API error", err);
    return { success: false, data: [] };
  }
}

export async function fetchTrialBalanceApi() {
  try {
    const res = await fetch(`${API_URL}/financial-reports/trial-balance`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch Trial Balance");
    return await res.json();
  } catch (err) {
    console.warn("Trial Balance API error", err);
    return { success: false, summary: { totalDebit: 0, totalCredit: 0, isBalanced: true }, data: [] };
  }
}

export async function fetchDetailedPartyLedgerApi(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/financial-reports/party-ledger?${query}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch party ledger details");
    return await res.json();
  } catch (err) {
    console.warn("Detailed party ledger API error", err);
    return { success: false, data: [] };
  }
}

export async function fetchUsersApi() {
  try {
    const res = await fetch(`${API_URL}/users`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return await res.json();
  } catch (err) {
    console.warn("Users API error", err);
    return { success: false, data: [] };
  }
}

export async function createUserApi(payload) {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to create user account");
  }
  return data;
}

export async function updateUserPermissionsApi(id, payload) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update user permissions");
  }
  return data;
}

export async function deleteUserApi(id) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to delete user account");
  }
  return data;
}

export async function fetchAuditLogsApi(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/audit?${query}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch audit logs");
    return await res.json();
  } catch (err) {
    console.warn("Audit log API error", err);
    return { success: false, data: [] };
  }
}

export async function fetchExpensesApi(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/expenses?${query}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch expenses");
    return await res.json();
  } catch (err) {
    console.warn("Expenses API error", err);
    return { success: false, count: 0, totalAmount: 0, data: [] };
  }
}

export async function createExpenseApi(payload) {
  const res = await fetch(`${API_URL}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to record expense voucher");
  }
  return data;
}

export async function deleteExpenseApi(id) {
  const res = await fetch(`${API_URL}/expenses/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to delete expense record");
  }
  return data;
}

export async function fetchEmployeesApi(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/employees?${query}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch employees");
    return await res.json();
  } catch (err) {
    console.warn("Employees API error", err);
    return { success: false, count: 0, total: 0, page: 1, pages: 1, data: [] };
  }
}

export async function createEmployeeApi(payload) {
  const res = await fetch(`${API_URL}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to create employee profile");
  }
  return data;
}

export async function updateEmployeeApi(id, payload) {
  const res = await fetch(`${API_URL}/employees/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update employee profile");
  }
  return data;
}

export async function deleteEmployeeApi(id) {
  const res = await fetch(`${API_URL}/employees/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to delete employee profile");
  }
  return data;
}

export async function recordEmployeeAdvanceApi(payload) {
  const res = await fetch(`${API_URL}/employees/advance`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to record advance cash");
  }
  return data;
}

export async function fetchSalaryVouchersApi(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/salaries?${query}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch salary vouchers");
    return await res.json();
  } catch (err) {
    console.warn("Salary vouchers API error", err);
    return { success: false, count: 0, total: 0, page: 1, pages: 1, data: [] };
  }
}

export async function generateSalaryVoucherApi(payload) {
  const res = await fetch(`${API_URL}/salaries`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to generate salary voucher");
  }
  return data;
}

export async function fetchNotificationsApi() {
  try {
    const res = await fetch(`${API_URL}/notifications`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return await res.json();
  } catch (err) {
    console.warn("Notifications API error", err);
    return { success: false, data: [], unreadCount: 0 };
  }
}

export async function markNotificationReadApi(id) {
  const res = await fetch(`${API_URL}/notifications/read/${id}`, {
    method: "PUT",
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to update notification");
  return data;
}

export async function deleteNotificationApi(id) {
  const res = await fetch(`${API_URL}/notifications/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to delete notification");
  return data;
}

export async function clearAllNotificationsApi() {
  const res = await fetch(`${API_URL}/notifications/clear-all`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to clear notifications");
  return data;
}

export async function fetchSystemLogsApi() {
  try {
    const res = await fetch(`${API_URL}/system-logs`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch system logs");
    return await res.json();
  } catch (err) {
    console.warn("System logs API error", err);
    return { success: false, count: 0, data: [] };
  }
}

export async function createSystemLogApi(payload) {
  try {
    const res = await fetch(`${API_URL}/system-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.warn("Failed to create system log", err);
    return { success: false };
  }
}

export async function clearSystemLogsApi() {
  const res = await fetch(`${API_URL}/system-logs/clear-all`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to clear system logs");
  return data;
}

export async function deleteSingleSystemLogApi(id) {
  const res = await fetch(`${API_URL}/system-logs/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to delete system log");
  return data;
}

export async function eraseAllDataApi(password) {
  const res = await fetch(`${API_URL}/data-reset/erase-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to reset application data");
  return data;
}

export async function eraseModuleDataApi(password, moduleKey) {
  const res = await fetch(`${API_URL}/data-reset/erase-module`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ password, moduleKey }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to erase module data");
  return data;
}







