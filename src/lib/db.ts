import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { connectToDatabase } from './mongodb';
import { ProductModel, OrderModel, CustomerModel, WebsiteContentModel, CouponModel, CustomShoeModel } from './models';

const execAsync = util.promisify(exec);

// Define DB Types
export interface Review {
  id?: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase?: boolean;
  image?: string;
}

export interface Colorway {
  name: string;
  hex: string;
  threeColor: string; // Hex for Three.js rendering
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPrice: number;
  discountPercentage: number;
  availableSizes: number[];
  availableColors: Colorway[];
  material: string;
  gender: string;
  stock: number;
  sku: string;
  rating: number;
  reviews: Review[];
  tags: string[];
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTrending?: boolean;
  isSale: boolean;
  images: string[];
  mainImage: string;
}

export interface OrderItem {
  productId: string;
  customizationId?: string;
  name: string;
  brand: string;
  size: number;
  color: string;
  colorHex: string;
  quantity: number;
  price: number;
}

export interface Address {
  flat: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: Address;
  landmark?: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryCharges: number;
  total: number;
  paymentMethod?: 'COD' | 'UPI' | 'CARD' | 'NETBANKING';
  paymentStatus?: 'Pending' | 'Paid';
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';
  date: string;
}

export interface Customer {
  id?: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  address: Address;
  savedAddresses?: Address[];
  wishlist?: string[];
  totalOrders: number;
  totalSpending: number;
  registrationDate: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  expiryDate?: string;
  isActive: boolean;
}

export interface CustomShoe {
  customizationId: string;
  upperColor: string;
  soleColor: string;
  laceColor: string;
  logoColor: string;
  calculatedPrice: number;
  createdAt: string;
}

export interface WebsiteContent {
  heroTitle: string;
  heroSubtitle: string;
  heroTagline: string;
  aboutText: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  policies: {
    shipping: string;
    returns: string;
    privacy: string;
    terms: string;
  };
}

export interface DatabaseSchema {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  coupons?: Coupon[];
  customShoes?: CustomShoe[];
  websiteContent: WebsiteContent;
}

// Ensure db.json exists with initial data
const getInitialData = (): DatabaseSchema => {
  return {
    products: [
      {
        id: 'genesis-3d',
        name: 'THE REAL Genesis',
        brand: 'THE REAL',
        category: 'Running',
        description: 'Step into your reality with our flagship running shoe. Genesis blends cutting-edge comfort with futuristic design, featuring our signature responsive sole and aerodynamic knit upper.',
        price: 14999,
        originalPrice: 17999,
        discountPrice: 14999,
        discountPercentage: 17,
        availableSizes: [7, 8, 9, 10, 11, 12],
        availableColors: [
          { name: 'Royal Blue', hex: '#0a58ca', threeColor: '#0a58ca' },
          { name: 'Silver Shadow', hex: '#c0c0c0', threeColor: '#c0c0c0' },
          { name: 'Carbon Black', hex: '#111827', threeColor: '#111827' }
        ],
        material: 'Recycled Flyknit & TPU Sole',
        gender: 'Unisex',
        stock: 35,
        sku: 'TR-GEN-001',
        rating: 4.8,
        reviews: [
          { name: 'John Doe', rating: 5, comment: 'Absolutely incredible comfort. The responsive sole makes a massive difference in bounce!', date: '2026-07-20' },
          { name: 'Sarah K.', rating: 4, comment: 'Extremely stylish and lightweight. Perfect for daily wear.', date: '2026-07-24' }
        ],
        tags: ['Premium', 'Running', 'Responsive'],
        images: ['/images/shoes/genesis_blue.png', '/images/shoes/genesis_silver.png', '/images/shoes/genesis_black.png'],
        mainImage: '/images/shoes/genesis_blue.png',
        isNewArrival: true,
        isBestSeller: true,
        isSale: true
      },
      {
        id: 'horizon-light',
        name: 'THE REAL Horizon Light',
        brand: 'THE REAL',
        category: 'Lifestyle',
        description: 'Designed for lightweight daily pacing. Horizon Light incorporates a translucent mesh grid with premium leather overlays, making it the perfect blend of structural integrity and minimalist style.',
        price: 11999,
        originalPrice: 11999,
        discountPrice: 11999,
        discountPercentage: 0,
        availableSizes: [8, 9, 10, 11],
        availableColors: [
          { name: 'Silver Shadow', hex: '#c0c0c0', threeColor: '#c0c0c0' },
          { name: 'Royal Blue', hex: '#0a58ca', threeColor: '#0a58ca' }
        ],
        material: 'Engineered Mono-Mesh & Premium Leather',
        gender: 'Unisex',
        stock: 18,
        sku: 'TR-HOR-002',
        rating: 4.6,
        reviews: [
          { name: 'Aman S.', rating: 5, comment: 'Love the premium look. Fits like a glove.', date: '2026-07-15' }
        ],
        tags: ['Lightweight', 'Lifestyle', 'Casual'],
        images: ['/images/shoes/horizon_light.png', '/images/shoes/horizon_blue.png'],
        mainImage: '/images/shoes/horizon_light.png',
        isNewArrival: true,
        isBestSeller: false,
        isSale: false
      },
      {
        id: 'apex-runner',
        name: 'THE REAL Apex Runner',
        brand: 'THE REAL',
        category: 'Sport',
        description: 'Dominate your athletic targets with the Apex Runner. Designed with carbon fiber shank plates and multi-directional traction grips to ensure explosive power outputs and maximum stride control.',
        price: 16999,
        originalPrice: 19999,
        discountPrice: 16999,
        discountPercentage: 15,
        availableSizes: [7, 8, 9, 10, 11, 12],
        availableColors: [
          { name: 'Carbon Black', hex: '#111827', threeColor: '#111827' },
          { name: 'Royal Blue', hex: '#0a58ca', threeColor: '#0a58ca' },
          { name: 'Silver Shadow', hex: '#c0c0c0', threeColor: '#c0c0c0' }
        ],
        material: 'Carbon Fiber Shank, Mesh & High-Grip Rubber',
        gender: 'Men',
        stock: 12,
        sku: 'TR-APX-003',
        rating: 4.9,
        reviews: [
          { name: 'Vikram R.', rating: 5, comment: 'Hands down the best running shoes I have owned. Worth every dollar.', date: '2026-07-22' }
        ],
        tags: ['Athletic', 'Carbon Fiber', 'Sport', 'Performance'],
        images: ['/images/shoes/apex_black.png', '/images/shoes/apex_blue.png'],
        mainImage: '/images/shoes/apex_black.png',
        isNewArrival: false,
        isBestSeller: true,
        isSale: true
      },
      {
        id: 'stealth-black',
        name: 'THE REAL Stealth Black',
        brand: 'THE REAL',
        category: 'Lifestyle',
        description: 'Embrace the darkness. Stealth Black offers an all-black matte appearance with reflective elements that catch light under motion. Seamless construction prevents chafing.',
        price: 10999,
        originalPrice: 10999,
        discountPrice: 10999,
        discountPercentage: 0,
        availableSizes: [8, 9, 10, 11],
        availableColors: [
          { name: 'Carbon Black', hex: '#111827', threeColor: '#111827' }
        ],
        material: 'Matte Knit & Reflective Mesh overlays',
        gender: 'Men',
        stock: 5, // Low stock on purpose to test alerts!
        sku: 'TR-STL-004',
        rating: 4.5,
        reviews: [
          { name: 'David M.', rating: 4, comment: 'Looks amazing, very clean. The reflective stripes are a neat touch.', date: '2026-07-18' }
        ],
        tags: ['Stealth', 'Reflective', 'Casual'],
        images: ['/images/shoes/stealth_black.png'],
        mainImage: '/images/shoes/stealth_black.png',
        isNewArrival: false,
        isBestSeller: false,
        isSale: false
      },
      {
        id: 'retro-classic',
        name: 'THE REAL Retro Classic',
        brand: 'THE REAL',
        category: 'Casual',
        description: 'A timeless vintage-inspired silhouette reimagined for the modern era. Handcrafted from top-grade leather, detailed with classic stitching, and finished with a comfortable memory foam insole.',
        price: 8999,
        originalPrice: 11999,
        discountPrice: 8999,
        discountPercentage: 25,
        availableSizes: [6, 7, 8, 9, 10, 11],
        availableColors: [
          { name: 'Silver Shadow', hex: '#c0c0c0', threeColor: '#e5e7eb' }, // Off-white style
          { name: 'Royal Blue', hex: '#0a58ca', threeColor: '#0a58ca' }
        ],
        material: 'Genuine Full-Grain Leather & Gum Sole',
        gender: 'Women',
        stock: 22,
        sku: 'TR-RTR-005',
        rating: 4.7,
        reviews: [
          { name: 'Emily G.', rating: 5, comment: 'So comfy and they look great with everything. Will buy the blue ones too.', date: '2026-07-25' }
        ],
        tags: ['Vintage', 'Classic', 'Leather', 'Retro'],
        images: ['/images/shoes/retro_white.png', '/images/shoes/retro_blue.png'],
        mainImage: '/images/shoes/retro_white.png',
        isNewArrival: false,
        isBestSeller: false,
        isSale: true
      }
    ],
    orders: [],
    customers: [
      {
        name: 'Aryan Shah',
        email: 'aryan@thereal.com',
        phone: '+919999999999',
        address: {
          flat: 'Penthouse A',
          street: 'Premium Skyline Heights',
          city: 'Mumbai',
          state: 'Maharashtra',
          zip: '400001',
          country: 'India'
        },
        totalOrders: 0,
        totalSpending: 0,
        registrationDate: '2026-07-27'
      }
    ],
    websiteContent: {
      heroTitle: 'THE REAL',
      heroSubtitle: 'Step Into Your Reality',
      heroTagline: 'Experience footwear engineered with premium aesthetics, responsive cushioning, and modern layouts.',
      aboutText: 'THE REAL was founded in 2026 by Aryan Shah to disrupt the sneaker space. We believe in providing premium design, extreme structural comfort, and a digital visual experience that brings the shoes to you. Our focus is quality, technology, and style.',
      contactEmail: 'aryan@thereal.com',
      contactPhone: '+919876543210',
      contactAddress: 'Skyline Premium Tower, Level 15, BKC, Mumbai, MH, India',
      policies: {
        shipping: 'We offer free premium shipping on all orders over ₹10,000 nationwide. Otherwise, a standard delivery fee of ₹299 applies. Orders are dispatched within 24-48 hours and typically arrive within 3-5 business days. Express shipping options are available at checkout.',
        returns: 'If you are not completely satisfied with your purchase, you may return the unworn shoes in their original packaging within 30 days of receipt for a full refund or exchange.',
        privacy: 'Your privacy is paramount. We encrypt all payment details, protect personal shipping info, and never share customer data with third parties.',
        terms: 'By purchasing from THE REAL, you agree to our terms of service, which include using our sizing guides, confirming address details before ordering, and agreeing to our return conditions.'
      }
    }
  };
};

let inMemoryDbCache: DatabaseSchema | null = null;
const PRIMARY_DB_PATH = path.join(process.cwd(), 'src/lib/db.json');
const TMP_DB_PATH = path.join('/tmp', 'db.json');

export const readDB = (): DatabaseSchema => {
  if (inMemoryDbCache) {
    return inMemoryDbCache;
  }

  let dbData: DatabaseSchema | null = null;

  // Try reading from /tmp/db.json first (if updated in current runtime)
  try {
    if (fs.existsSync(TMP_DB_PATH)) {
      const data = fs.readFileSync(TMP_DB_PATH, 'utf8');
      dbData = JSON.parse(data) as DatabaseSchema;
    }
  } catch (err) {
    console.error('Error reading /tmp/db.json:', err);
  }

  // Try reading from PRIMARY_DB_PATH
  if (!dbData) {
    try {
      if (fs.existsSync(PRIMARY_DB_PATH)) {
        const data = fs.readFileSync(PRIMARY_DB_PATH, 'utf8');
        dbData = JSON.parse(data) as DatabaseSchema;
      }
    } catch (error) {
      console.error('Error reading DB from primary path:', error);
    }
  }

  const initial = getInitialData();

  if (!dbData) {
    dbData = initial;
  } else {
    // Ensure all default flagship products exist alongside imported products
    for (const initProd of initial.products) {
      if (!dbData.products.some(p => p.id === initProd.id)) {
        dbData.products.push(initProd);
      }
    }
    if (!dbData.websiteContent) dbData.websiteContent = initial.websiteContent;
    if (!dbData.customers) dbData.customers = initial.customers;
    if (!dbData.orders) dbData.orders = initial.orders;
  }

  inMemoryDbCache = dbData;
  return dbData;
};

export const writeDB = (data: DatabaseSchema): boolean => {
  inMemoryDbCache = data;
  let written = false;

  // Try writing to primary DB path (local development)
  try {
    fs.mkdirSync(path.dirname(PRIMARY_DB_PATH), { recursive: true });
    fs.writeFileSync(PRIMARY_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    written = true;
  } catch (error) {
    // Expected on read-only file systems (e.g. Vercel serverless)
    console.warn('Primary DB path read-only, falling back to /tmp/db.json');
  }

  // Try writing to /tmp/db.json (serverless writable directory)
  try {
    fs.mkdirSync(path.dirname(TMP_DB_PATH), { recursive: true });
    fs.writeFileSync(TMP_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    written = true;
  } catch (tmpError) {
    console.error('Error writing to /tmp/db.json:', tmpError);
  }

  // Automatically sync updated db.json to GitHub repository in background
  syncDbToGitHub().catch((err) => console.warn('Background GitHub sync bypassed:', err));

  return true;
};

export async function syncDbToGitHub(): Promise<boolean> {
  // 1. Local environment git commit & push
  try {
    const gitDir = path.join(process.cwd(), '.git');
    if (fs.existsSync(gitDir)) {
      await execAsync(`git add "${PRIMARY_DB_PATH}" && git commit -m "Admin live update product catalog" && git push origin main`);
      console.log('Successfully committed and pushed db.json live to GitHub repository!');
      return true;
    }
  } catch (err) {
    console.warn('Local git commit/push bypassed or not supported:', err);
  }

  // 2. GitHub REST API commit (for Vercel serverless environment)
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
  if (token) {
    try {
      const repo = 'Aryan-Shah04062005/the-real-shoes';
      const filePath = 'src/lib/db.json';
      const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;

      const getRes = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'TheRealShoes-App',
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (getRes.ok) {
        const fileData = await getRes.json();
        const sha = fileData.sha;
        const currentDb = readDB();
        const contentBase64 = Buffer.from(JSON.stringify(currentDb, null, 2)).toString('base64');

        const putRes = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'TheRealShoes-App',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Admin live update product catalog via Admin Panel',
            content: contentBase64,
            sha: sha,
            branch: 'main'
          })
        });

        if (putRes.ok) {
          console.log('Successfully updated db.json on GitHub via REST API!');
          return true;
        }
      }
    } catch (apiErr) {
      console.error('Failed to update db.json via GitHub REST API:', apiErr);
    }
  }

  return false;
}

// ----------------------------------------------------
// HYBRID DATABASE ADAPTER INTERFACES
// ----------------------------------------------------

async function isMongoDBConnected(): Promise<boolean> {
  if (!process.env.MONGODB_URI) return false;
  const conn = await connectToDatabase();
  return conn !== null;
}

// Seed helper if database is fresh
async function seedMongoDBIfNeeded() {
  const count = await ProductModel.countDocuments();
  if (count === 0) {
    console.log('MongoDB is empty. Seeding with default product sets and CMS structures...');
    const initial = getInitialData();
    
    // Insert products
    await ProductModel.insertMany(initial.products);
    
    // Insert customers
    await CustomerModel.insertMany(initial.customers);
    
    // Insert website copy
    await WebsiteContentModel.create(initial.websiteContent);
    console.log('MongoDB database seeding successfully completed.');
  }
}

// 1. Get entire database state (for stats compilation)
export async function getFullDb(): Promise<DatabaseSchema> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    await seedMongoDBIfNeeded();
    const products = await ProductModel.find({}).sort({ createdAt: -1 }).lean() as unknown as Product[];
    const orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean() as unknown as Order[];
    const customers = await CustomerModel.find({}).sort({ createdAt: -1 }).lean() as unknown as Customer[];
    let websiteContent = await WebsiteContentModel.findOne({}).lean() as unknown as WebsiteContent;
    if (!websiteContent) {
      const initial = getInitialData();
      websiteContent = initial.websiteContent;
      await WebsiteContentModel.create(initial.websiteContent);
    }
    return { products, orders, customers, websiteContent };
  } else {
    return readDB();
  }
}

// 2. Product operations
export async function getProductsList(): Promise<Product[]> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    await seedMongoDBIfNeeded();
    return await ProductModel.find({}).sort({ createdAt: -1 }).lean() as unknown as Product[];
  } else {
    return readDB().products;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    await seedMongoDBIfNeeded();
    const p = await ProductModel.findOne({ id }).lean();
    return p ? (p as unknown as Product) : null;
  } else {
    const products = readDB().products;
    return products.find(p => p.id === id) || null;
  }
}

export async function saveProduct(productData: Product): Promise<void> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    await seedMongoDBIfNeeded();
    const exists = await ProductModel.findOne({ id: productData.id });
    if (exists) {
      await ProductModel.updateOne({ id: productData.id }, productData);
    } else {
      await ProductModel.create(productData);
    }
  } else {
    const db = readDB();
    const index = db.products.findIndex(p => p.id === productData.id);
    if (index !== -1) {
      db.products[index] = productData;
    } else {
      db.products.unshift(productData);
    }
    writeDB(db);
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    await seedMongoDBIfNeeded();
    const res = await ProductModel.deleteOne({ id });
    return res.deletedCount > 0;
  } else {
    const db = readDB();
    const index = db.products.findIndex(p => p.id === id);
    if (index === -1) return false;
    db.products.splice(index, 1);
    writeDB(db);
    return true;
  }
}

// 3. Order operations
export async function getOrdersList(): Promise<Order[]> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    return await OrderModel.find({}).sort({ createdAt: -1 }).lean() as unknown as Order[];
  } else {
    return readDB().orders;
  }
}

export async function saveOrder(orderData: Order): Promise<void> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    const exists = await OrderModel.findOne({ id: orderData.id });
    if (exists) {
      await OrderModel.updateOne({ id: orderData.id }, orderData);
    } else {
      await OrderModel.create(orderData);
    }
  } else {
    const db = readDB();
    const index = db.orders.findIndex(o => o.id === orderData.id);
    if (index !== -1) {
      db.orders[index] = orderData;
    } else {
      db.orders.unshift(orderData);
    }
    writeDB(db);
  }
}

export async function deleteOrder(id: string): Promise<boolean> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    const res = await OrderModel.deleteOne({ id });
    return res.deletedCount > 0;
  } else {
    const db = readDB();
    const index = db.orders.findIndex(o => o.id === id);
    if (index === -1) return false;
    db.orders.splice(index, 1);
    writeDB(db);
    return true;
  }
}

// 4. Customer operations
export async function getCustomersList(): Promise<Customer[]> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    return await CustomerModel.find({}).sort({ createdAt: -1 }).lean() as unknown as Customer[];
  } else {
    return readDB().customers;
  }
}

export async function saveCustomer(customerData: Customer): Promise<void> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    const exists = await CustomerModel.findOne({ email: customerData.email });
    if (exists) {
      await CustomerModel.updateOne({ email: customerData.email }, customerData);
    } else {
      await CustomerModel.create(customerData);
    }
  } else {
    const db = readDB();
    const index = db.customers.findIndex(c => c.email.toLowerCase() === customerData.email.toLowerCase());
    if (index !== -1) {
      db.customers[index] = customerData;
    } else {
      db.customers.push(customerData);
    }
    writeDB(db);
  }
}

// 5. CMS Web content operations
export async function getWebsiteContent(): Promise<WebsiteContent> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    await seedMongoDBIfNeeded();
    const content = await WebsiteContentModel.findOne({}).lean();
    if (content) return content as unknown as WebsiteContent;
    
    const initial = getInitialData();
    await WebsiteContentModel.create(initial.websiteContent);
    return initial.websiteContent;
  } else {
    return readDB().websiteContent;
  }
}

export async function saveWebsiteContent(cmsData: WebsiteContent): Promise<void> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    await seedMongoDBIfNeeded();
    const exists = await WebsiteContentModel.findOne({});
    if (exists) {
      await WebsiteContentModel.updateOne({}, cmsData);
    } else {
      await WebsiteContentModel.create(cmsData);
    }
  } else {
    const db = readDB();
    db.websiteContent = cmsData;
    writeDB(db);
  }
}

// 6. Coupon operations
const DEFAULT_COUPONS: Coupon[] = [
  {
    code: 'REAL10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 1000,
    isActive: true
  },
  {
    code: 'WELCOME100',
    discountType: 'fixed',
    discountValue: 500,
    minOrderValue: 2000,
    isActive: true
  }
];

export async function getCouponsList(): Promise<Coupon[]> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    const list = await CouponModel.find({}).lean() as unknown as Coupon[];
    if (list && list.length > 0) return list;
    await CouponModel.insertMany(DEFAULT_COUPONS);
    return DEFAULT_COUPONS;
  } else {
    const db = readDB();
    if (!db.coupons || db.coupons.length === 0) {
      db.coupons = DEFAULT_COUPONS;
      writeDB(db);
    }
    return db.coupons;
  }
}

export async function validateCoupon(code: string, subtotal: number): Promise<{ valid: boolean; coupon?: Coupon; error?: string; discountAmount?: number }> {
  const coupons = await getCouponsList();
  const found = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);
  if (!found) {
    return { valid: false, error: 'Invalid coupon code.' };
  }
  if (subtotal < found.minOrderValue) {
    return { valid: false, error: `Minimum order amount of ₹${found.minOrderValue} required for coupon ${found.code}.` };
  }
  let discountAmount = 0;
  if (found.discountType === 'percentage') {
    discountAmount = Math.round((subtotal * found.discountValue) / 100);
    if (found.maxDiscountAmount && discountAmount > found.maxDiscountAmount) {
      discountAmount = found.maxDiscountAmount;
    }
  } else {
    discountAmount = found.discountValue;
  }
  return { valid: true, coupon: found, discountAmount };
}

export async function saveCoupon(couponData: Coupon): Promise<void> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    await CouponModel.updateOne({ code: couponData.code.toUpperCase() }, couponData, { upsert: true });
  } else {
    const db = readDB();
    if (!db.coupons) db.coupons = [];
    const idx = db.coupons.findIndex(c => c.code.toUpperCase() === couponData.code.toUpperCase());
    if (idx !== -1) {
      db.coupons[idx] = couponData;
    } else {
      db.coupons.push(couponData);
    }
    writeDB(db);
  }
}

export async function deleteCoupon(code: string): Promise<boolean> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    const res = await CouponModel.deleteOne({ code: code.toUpperCase() });
    return res.deletedCount > 0;
  } else {
    const db = readDB();
    if (!db.coupons) return false;
    const idx = db.coupons.findIndex(c => c.code.toUpperCase() === code.toUpperCase());
    if (idx === -1) return false;
    db.coupons.splice(idx, 1);
    writeDB(db);
    return true;
  }
}

// 7. Custom Shoe operations
export async function saveCustomShoe(customShoe: CustomShoe): Promise<void> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    await CustomShoeModel.create(customShoe);
  } else {
    const db = readDB();
    if (!db.customShoes) db.customShoes = [];
    db.customShoes.push(customShoe);
    writeDB(db);
  }
}

export async function getCustomShoe(customizationId: string): Promise<CustomShoe | null> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    const shoe = await CustomShoeModel.findOne({ customizationId }).lean();
    return shoe as unknown as CustomShoe | null;
  } else {
    const db = readDB();
    return db.customShoes?.find(s => s.customizationId === customizationId) || null;
  }
}

// 8. Product Review operations
export async function addReviewToProduct(productId: string, review: Review): Promise<Product | null> {
  const product = await getProductById(productId);
  if (!product) return null;
  product.reviews = product.reviews || [];
  product.reviews.unshift(review);
  // Recalculate average rating
  const totalStars = product.reviews.reduce((sum, r) => sum + r.rating, 0);
  product.rating = Number((totalStars / product.reviews.length).toFixed(1));
  await saveProduct(product);
  return product;
}

// 9. Order Status operations
export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<Order | null> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    const updated = await OrderModel.findOneAndUpdate({ id: orderId }, { status }, { new: true }).lean();
    return updated as unknown as Order | null;
  } else {
    const db = readDB();
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return null;
    order.status = status;
    writeDB(db);
    return order;
  }
}
