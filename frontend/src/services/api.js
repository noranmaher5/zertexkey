import axios from 'axios';

// إنشاء نسخة Axios مع الإعدادات الافتراضية
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERCEPTORS (المراقبات)
// ─────────────────────────────────────────────────────────────────────────────

// إضافة توكن الـ JWT تلقائياً لكل طلب يخرج من التطبيق
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('dv_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// التعامل مع الأخطاء عالمياً (مثل انتهاء صلاحية التوكن 401)
API.interceptors.response.use(
  (res) => res,
  (err) => {
    // إذا كان الخطأ 401 (غير مصرح) ولم يكن الطلب هو التحقق من المستخدم الحالي
    if (err.response?.status === 401 && err.config?.url !== '/auth/me') {
      localStorage.removeItem('dv_token');
      localStorage.removeItem('dv_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH API (التحقق والهوية)
// ─────────────────────────────────────────────────────────────────────────────
export const authAPI = {
  // تسجيل حساب جديد
  register: (data) => API.post('/auth/register', data),
  
  // تسجيل الدخول التقليدي
  login: (data) => API.post('/auth/login', data),
  
  // تسجيل الدخول بواسطة جوجل
  googleAuth: (data) => API.post('/auth/google', data),
  
  // التحقق من الـ OTP المرسل للإيميل (المسار الجديد)
  verify2FA: (data) => API.post('/auth/verify-2fa', data),
  
  // جلب بيانات المستخدم المسجل حالياً
  getMe: () => API.get('/auth/me'),
  
  // تحديث بيانات الملف الشخصي
  updateProfile: (data) => API.put('/auth/update-profile', data),
  
  // تغيير كلمة المرور
  updatePassword: (data) => API.put('/auth/update-password', data),
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT API (المنتجات)
// ─────────────────────────────────────────────────────────────────────────────
export const productAPI = {
  // جلب كل المنتجات مع الفلترة
  getAll: (params) => API.get('/products', { params }),
  
  // جلب منتج واحد بالـ ID
  getOne: (id) => API.get(`/products/${id}`),
  
  // إضافة منتج جديد (للمشرفين)
  create: (data) => API.post('/products', data),
  
  // تحديث بيانات منتج
  update: (id, data) => API.put(`/products/${id}`, data),
  
  // حذف منتج
  delete: (id) => API.delete(`/products/${id}`),
  
  // إضافة تقييم لمنتج
  addReview: (id, data) => API.post(`/products/${id}/reviews`, data),
  
  // جلب إحصائيات الفئات
  getCategoryStats: () => API.get('/products/categories/stats'),
};

// ─────────────────────────────────────────────────────────────────────────────
// ORDER API (الطلبات)
// ─────────────────────────────────────────────────────────────────────────────
export const orderAPI = {
  // جلب طلبات المستخدم الحالي
  getMyOrders: () => API.get('/orders/my'),
  
  // جلب تفاصيل طلب محدد
  getOne: (id) => API.get(`/orders/${id}`),
  
  // جلب كل الطلبات (للمشرفين)
  getAll: (params) => API.get('/orders', { params }),
  
  // تحديث حالة الطلب (قيد التنفيذ، تم الشحن، إلخ)
  updateStatus: (id, status) => API.put(`/orders/${id}/status`, { status }),
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT API (الدفع عبر Stripe)
// ─────────────────────────────────────────────────────────────────────────────
export const paymentAPI = {
  // جلب إعدادات الدفع (Public Key)
  getConfig: () => API.get('/payments/config'),
  
  // إنشاء نية دفع جديدة (Payment Intent)
  createPaymentIntent: (items) => API.post('/payments/create-payment-intent', { items }),
  
  // تأكيد نجاح عملية الدفع
  confirmPayment: (id) => API.post(`/payments/confirm/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// DIGITAL CODES API (الأكواد الرقمية)
// ─────────────────────────────────────────────────────────────────────────────
export const codeAPI = {
  // إضافة كمية كبيرة من الأكواد دفعة واحدة
  addBulk: (data) => API.post('/codes/bulk', data),
  
  // جلب الأكواد التابعة لمنتج معين
  getByProduct: (id, params) => API.get(`/codes/product/${id}`, { params }),
  
  // جلب إحصائيات المخزون للأكواد
  getStats: () => API.get('/codes/stats'),
  
  // حذف كود معين
  delete: (id) => API.delete(`/codes/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN API (لوحة التحكم)
// ─────────────────────────────────────────────────────────────────────────────
export const adminAPI = {
  // جلب بيانات لوحة القيادة (Dashboard Overview)
  getDashboard: () => API.get('/admin/dashboard'),
  
  // جلب قائمة كل المستخدمين
  getUsers: (params) => API.get('/admin/users', { params }),
  
  // تغيير رتبة مستخدم (User, Admin, Editor)
  updateUserRole: (id, role) => API.put(`/admin/users/${id}/role`, { role }),
  
  // تفعيل أو تعطيل حساب مستخدم
  toggleUserStatus: (id) => API.put(`/admin/users/${id}/toggle-status`),
};

// ─────────────────────────────────────────────────────────────────────────────
// CART API (عربة التسوق - قاعدة البيانات)
// ─────────────────────────────────────────────────────────────────────────────
export const cartAPI = {
  // جلب محتويات العربة
  getCart: () => API.get('/cart'),
  
  // إضافة منتج للعربة
  addItem: (productId, quantity) => API.post('/cart/add', { productId, quantity }),
  
  // تحديث كمية منتج في العربة
  updateItem: (productId, quantity) => API.put('/cart/update', { productId, quantity }),
  
  // إزالة منتج من العربة
  removeItem: (productId) => API.delete(`/cart/remove/${productId}`),
  
  // تفريغ العربة بالكامل
  clearCart: () => API.delete('/cart/clear'),
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM API (حالة النظام)
// ─────────────────────────────────────────────────────────────────────────────
export const systemAPI = {
  // فحص ما إذا كان السيرفر يعمل (Health Check)
  health: () => API.get('/health'),
};

export default API;