// Stable deterministic mock data — no randomness so values don't change on every import

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Sports', 'Food', 'Tools', 'Furniture', 'Toys'];
const PRODUCT_WORDS = ['Widget', 'Gadget', 'Tool', 'Kit', 'Pack', 'Module', 'Unit', 'Device'];
const PRODUCT_PREFIXES = ['Pro', 'Ultra', 'Basic', 'Max', 'Plus', 'Lite', 'Smart', 'Quick'];
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Support', 'Design'];
const ROLES_EMP = ['Junior', 'Mid-Level', 'Senior', 'Lead', 'Manager', 'Director'];
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const FIRST_NAMES = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack', 'Karen', 'Leo', 'Mia', 'Noah', 'Olivia', 'Paul'];
const LAST_NAMES = ['Smith', 'Jones', 'Brown', 'Davis', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson'];

export const products = Array.from({ length: 500 }, (_, i) => ({
  id: i + 1,
  name: `${PRODUCT_PREFIXES[i % PRODUCT_PREFIXES.length]} ${PRODUCT_WORDS[i % PRODUCT_WORDS.length]} ${i + 1}`,
  category: CATEGORIES[i % CATEGORIES.length],
  price: Math.round((10 + (i * 7.3) % 490) * 100) / 100,
  stock: (i * 13) % 1000,
  status: ['active', 'inactive', 'draft'][i % 3],
  sku: `SKU-${String(i + 1).padStart(5, '0')}`,
  rating: Math.round(((i * 0.7) % 4 + 1) * 10) / 10,
  sold: (i * 17) % 500,
  createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
}));

export const employees = Array.from({ length: 200 }, (_, i) => ({
  id: i + 1,
  firstName: FIRST_NAMES[i % FIRST_NAMES.length],
  lastName: LAST_NAMES[i % LAST_NAMES.length],
  email: `${FIRST_NAMES[i % FIRST_NAMES.length].toLowerCase()}${i + 1}@company.com`,
  department: DEPARTMENTS[i % DEPARTMENTS.length],
  role: ROLES_EMP[i % ROLES_EMP.length],
  salary: 35000 + (i * 450) % 85000,
  status: i % 9 === 0 ? 'inactive' : 'active',
  joinDate: new Date(Date.now() - i * 20 * 24 * 60 * 60 * 1000).toISOString(),
  initials: FIRST_NAMES[i % FIRST_NAMES.length][0] + LAST_NAMES[i % LAST_NAMES.length][0],
}));

export const orders = Array.from({ length: 300 }, (_, i) => ({
  id: i + 1,
  orderNumber: `ORD-${String(i + 1).padStart(6, '0')}`,
  customer: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`,
  email: `customer${i + 1}@example.com`,
  status: ORDER_STATUSES[i % ORDER_STATUSES.length],
  total: Math.round((20 + (i * 11.7) % 980) * 100) / 100,
  items: (i % 5) + 1,
  product: products[i % products.length].name,
  createdAt: new Date(Date.now() - i * 8 * 60 * 60 * 1000).toISOString(),
}));

export const generateNotification = (id) => ({
  id,
  type: ['info', 'warning', 'success', 'error'][id % 4],
  title: ['New user registered', 'System update available', 'Backup completed', 'Login failed', 'Order placed', 'Low stock alert'][id % 6],
  message: `Notification message #${id} — this arrived at ${new Date().toLocaleTimeString()}`,
  read: id % 3 === 0,
  createdAt: new Date().toISOString(),
});

export const initialNotifications = Array.from({ length: 20 }, (_, i) => generateNotification(i + 1));

// Simulated async fetch with delay
export const fakeApi = {
  getProducts: () => new Promise(res => setTimeout(() => res(products), 700)),
  getOrders: () => new Promise(res => setTimeout(() => res(orders), 800)),
  getEmployees: () => new Promise(res => setTimeout(() => res(employees), 600)),
  // Simulates a waterfall: after getOrders, you fetch customer details one by one
  getCustomerDetails: (email) => new Promise(res =>
    setTimeout(() => res({ email, address: '123 Main St', phone: '555-0100', tier: ['gold', 'silver', 'bronze'][email.length % 3] }), 300)
  ),
};
