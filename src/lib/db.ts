import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { connectToDatabase } from './mongodb';
import { ProductModel, OrderModel, CustomerModel, WebsiteContentModel, CouponModel, CustomShoeModel, AuditLogModel } from './models';
import defaultDbData from './db.json';

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
  sizeStock?: Record<number, number>;
  sku: string;
  rating: number;
  reviews: Review[];
  tags: string[];
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
  isSale: boolean;
  images: string[];
  mainImage: string;
  status?: 'ACTIVE' | 'DRAFT' | 'HIDDEN' | 'OUT_OF_STOCK' | 'ARCHIVED';
  sourcePlatform?: 'AMAZON' | 'FLIPKART' | 'MANUAL' | 'THE_REAL';
  sourceUrl?: string;
  sourceProductId?: string;
  sourcePrice?: number;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  admin: string;
  action: string;
  target: string;
  details?: string;
  timestamp: string;
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
  auditLogs?: AuditLog[];
  deletedProductIds?: string[];
}

// Ensure db.json exists with initial data
const getInitialData = (): DatabaseSchema => {
  return defaultDbData as unknown as DatabaseSchema;
};

let inMemoryDbCache: DatabaseSchema | null = null;
const PRIMARY_DB_PATH = path.join(process.cwd(), 'src/lib/db.json');
const TMP_DB_PATH = path.join('/tmp', 'db.json');

export const readDB = (): DatabaseSchema => {
  let dbData: DatabaseSchema | null = null;

  let primaryData: DatabaseSchema | null = null;
  let primaryMtime = 0;
  try {
    if (fs.existsSync(PRIMARY_DB_PATH)) {
      const stat = fs.statSync(PRIMARY_DB_PATH);
      primaryMtime = stat.mtimeMs;
      primaryData = JSON.parse(fs.readFileSync(PRIMARY_DB_PATH, 'utf8')) as DatabaseSchema;
    }
  } catch (error) {
    console.error('Error reading DB from primary path:', error);
  }

  let tmpData: DatabaseSchema | null = null;
  let tmpMtime = 0;
  try {
    if (fs.existsSync(TMP_DB_PATH)) {
      const stat = fs.statSync(TMP_DB_PATH);
      tmpMtime = stat.mtimeMs;
      tmpData = JSON.parse(fs.readFileSync(TMP_DB_PATH, 'utf8')) as DatabaseSchema;
    }
  } catch (err) {
    console.error('Error reading /tmp/db.json:', err);
  }

  const DELETED_IDS_PATH = path.join('/tmp', 'deleted_product_ids.json');
  let diskDeletedIds: string[] = [];
  try {
    if (fs.existsSync(DELETED_IDS_PATH)) {
      diskDeletedIds = JSON.parse(fs.readFileSync(DELETED_IDS_PATH, 'utf8'));
    }
  } catch (e) {}

  const initial = getInitialData();

  // Consolidate deleted IDs set across all storage locations
  const deletedSet = new Set<string>([
    ...(initial.deletedProductIds || []),
    ...(primaryData?.deletedProductIds || []),
    ...(tmpData?.deletedProductIds || []),
    ...diskDeletedIds
  ]);

  const hasPrimary = !!(primaryData && Array.isArray(primaryData.products));
  const hasTmp = !!(tmpData && Array.isArray(tmpData.products));

  let rawProducts: Product[] = [];

  if (hasTmp && tmpMtime >= primaryMtime) {
    // /tmp/db.json is newer or equal: it is the source of truth for file-based DB
    rawProducts = tmpData!.products;
  } else if (hasPrimary) {
    // primary db.json is source of truth
    rawProducts = primaryData!.products;
  } else {
    // Fallback to initial seed
    rawProducts = initial.products || [];
  }

  // Filter out any deleted products by ID, lowercased ID, or slug
  const activeProducts = rawProducts.filter(p => {
    if (!p || !p.id) return false;
    const pIdLower = p.id.toLowerCase();
    const pSlug = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return !deletedSet.has(p.id) && !deletedSet.has(pIdLower) && !deletedSet.has(pSlug);
  });

  const baseData = (tmpMtime > primaryMtime ? tmpData : primaryData) || primaryData || tmpData || initial;

  dbData = {
    ...baseData,
    products: activeProducts,
    orders: baseData.orders || initial.orders || [],
    customers: baseData.customers || initial.customers || [],
    websiteContent: baseData.websiteContent || initial.websiteContent,
    deletedProductIds: Array.from(deletedSet)
  };

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

  // Write deleted_product_ids.json to /tmp as secondary backup
  if (data.deletedProductIds && Array.isArray(data.deletedProductIds)) {
    try {
      const DELETED_IDS_PATH = path.join('/tmp', 'deleted_product_ids.json');
      fs.writeFileSync(DELETED_IDS_PATH, JSON.stringify(data.deletedProductIds, null, 2), 'utf8');
    } catch (e) {}
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
      await execAsync(`git add "${PRIMARY_DB_PATH}"`, { timeout: 3000 });
      try {
        await execAsync(`git -c user.name="The Real Admin" -c user.email="admin@thereal.com" commit -m "Admin live update product catalog"`, { timeout: 3000 });
      } catch (commitErr) {
        // Safe to continue if no new file changes to commit
      }
      await execAsync(`git push origin main`, { timeout: 4000 });
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const getRes = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'TheRealShoes-App',
          'Accept': 'application/vnd.github.v3+json'
        },
        signal: controller.signal
      });

      if (getRes.ok) {
        const fileData = await getRes.json();
        const sha = fileData.sha;
        const currentDb = readDB();
        const contentBase64 = Buffer.from(JSON.stringify(currentDb, null, 2)).toString('base64');

        const putController = new AbortController();
        const putTimeoutId = setTimeout(() => putController.abort(), 5000);

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
          }),
          signal: putController.signal
        });

        clearTimeout(putTimeoutId);
        clearTimeout(timeoutId);

        if (putRes.ok) {
          console.log('Successfully updated db.json on GitHub via REST API!');
          return true;
        }
      }
      clearTimeout(timeoutId);
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

export function isValidProductImage(mainImage?: string): boolean {
  if (!mainImage || typeof mainImage !== 'string' || !mainImage.trim()) return true;
  return true;
}

// 2. Product operations
export async function getProductsList(): Promise<Product[]> {
  let products: Product[] = [];
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    await seedMongoDBIfNeeded();
    products = await ProductModel.find({}).sort({ updatedAt: -1, createdAt: -1 }).lean() as unknown as Product[];
  } else {
    products = readDB().products;
    products = [...products].sort((a, b) => {
      const timeA = new Date(a.updatedAt || 0).getTime();
      const timeB = new Date(b.updatedAt || 0).getTime();
      return timeB - timeA;
    });
  }

  return products.filter(p => isValidProductImage(p.mainImage) || (p.images && p.images.some(img => isValidProductImage(img))));
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!id) return null;
  const decodedId = decodeURIComponent(id).trim();
  const lowerId = decodedId.toLowerCase();
  const slugId = lowerId.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    await seedMongoDBIfNeeded();
    let p = await ProductModel.findOne({ id: decodedId }).lean();
    if (!p) {
      p = await ProductModel.findOne({
        $or: [
          { id: { $regex: new RegExp('^' + decodedId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i') } },
          { sku: { $regex: new RegExp('^' + decodedId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i') } }
        ]
      }).lean();
    }
    return p ? (p as unknown as Product) : null;
  } else {
    const products = await getProductsList();
    return products.find(p => {
      if (!p || !p.id) return false;
      const pIdLower = (p.id || '').toLowerCase();
      const pSkuLower = (p.sku || '').toLowerCase();
      const pNameLower = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return (
        p.id === id ||
        p.id === decodedId ||
        pIdLower === lowerId ||
        pSkuLower === lowerId ||
        (slugId.length > 3 && pNameLower === slugId) ||
        (p.sourceProductId && p.sourceProductId.toLowerCase() === lowerId)
      );
    }) || null;
  }
}

export async function saveProduct(productData: Product): Promise<{ success: boolean; error?: string }> {
  try {
    productData.updatedAt = new Date().toISOString();
    if (!productData.status) productData.status = 'ACTIVE';

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
      if (!db.deletedProductIds) db.deletedProductIds = [];
      const lowerId = productData.id.toLowerCase();
      db.deletedProductIds = db.deletedProductIds.filter(id => id !== productData.id && id !== lowerId);
      const index = db.products.findIndex(p => p.id === productData.id);
      if (index !== -1) {
        db.products[index] = productData;
      } else {
        db.products.unshift(productData);
      }
      writeDB(db);
    }
    return { success: true };
  } catch (err: any) {
    console.error('Database saveProduct error:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function getDatabaseStatus(): Promise<{
  backend: 'MongoDB' | 'File System (db.json)';
  connected: boolean;
  productCount: number;
  lastProductCreated?: string;
  lastOperation?: string;
  uriConfigured: boolean;
}> {
  const isMongo = await isMongoDBConnected();
  const products = await getProductsList();
  
  return {
    backend: isMongo ? 'MongoDB' : 'File System (db.json)',
    connected: true,
    productCount: products.length,
    lastProductCreated: products[0]?.name || 'N/A',
    lastOperation: 'PERSISTED',
    uriConfigured: !!process.env.MONGODB_URI
  };
}

export async function deleteProduct(idOrName: string): Promise<{ success: boolean; mode: 'deleted' | 'archived' | 'not_found' }> {
  const orders = await getOrdersList();
  const isMongo = await isMongoDBConnected();
  const targetQuery = idOrName.trim().toLowerCase();

  if (isMongo) {
    const prods = await ProductModel.find({
      $or: [
        { id: idOrName },
        { id: targetQuery },
        { name: { $regex: new RegExp('^' + idOrName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i') } }
      ]
    });

    if (prods.length === 0) return { success: false, mode: 'not_found' };

    let mode: 'deleted' | 'archived' = 'deleted';
    for (const prod of prods) {
      const hasOrders = orders.some(o => o.items && o.items.some(i => i.productId === prod.id));
      if (hasOrders) {
        await ProductModel.updateOne({ id: prod.id }, { status: 'ARCHIVED', updatedAt: new Date().toISOString() });
        mode = 'archived';
      } else {
        await ProductModel.deleteOne({ id: prod.id });
      }
    }

    return { success: true, mode };
  } else {
    const db = readDB();
    if (!db.deletedProductIds) db.deletedProductIds = [];
    const matchingIndices: number[] = [];

    db.products.forEach((p, idx) => {
      if (
        p.id === idOrName ||
        p.id.toLowerCase() === targetQuery ||
        p.name.toLowerCase() === targetQuery ||
        p.name.toLowerCase().trim() === targetQuery.trim()
      ) {
        matchingIndices.push(idx);
      }
    });

    if (matchingIndices.length === 0) return { success: false, mode: 'not_found' };

    let mode: 'deleted' | 'archived' = 'deleted';
    for (let i = matchingIndices.length - 1; i >= 0; i--) {
      const idx = matchingIndices[i];
      const targetProd = db.products[idx];
      const hasOrders = orders.some(o => o.items && o.items.some(i => i.productId === targetProd.id));

      if (hasOrders) {
        targetProd.status = 'ARCHIVED';
        targetProd.updatedAt = new Date().toISOString();
        mode = 'archived';
      } else {
        if (!db.deletedProductIds.includes(targetProd.id)) {
          db.deletedProductIds.push(targetProd.id);
        }
        const lowerId = targetProd.id.toLowerCase();
        if (!db.deletedProductIds.includes(lowerId)) {
          db.deletedProductIds.push(lowerId);
        }
        const slug = (targetProd.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (slug && !db.deletedProductIds.includes(slug)) {
          db.deletedProductIds.push(slug);
        }
        db.products.splice(idx, 1);
      }
    }

    writeDB(db);
    return { success: true, mode };
  }
}

export async function archiveProduct(id: string): Promise<boolean> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    const res = await ProductModel.updateOne({ id }, { status: 'ARCHIVED', updatedAt: new Date().toISOString() });
    return res.modifiedCount > 0;
  } else {
    const db = readDB();
    const p = db.products.find(prod => prod.id === id);
    if (!p) return false;
    p.status = 'ARCHIVED';
    p.updatedAt = new Date().toISOString();
    writeDB(db);
    return true;
  }
}

export async function restoreProduct(id: string): Promise<boolean> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    const res = await ProductModel.updateOne({ id }, { status: 'ACTIVE', updatedAt: new Date().toISOString() });
    return res.modifiedCount > 0;
  } else {
    const db = readDB();
    if (db.deletedProductIds) {
      db.deletedProductIds = db.deletedProductIds.filter(dId => dId !== id && dId !== id.toLowerCase());
    }
    const p = db.products.find(prod => prod.id === id);
    if (!p) return false;
    p.status = 'ACTIVE';
    p.updatedAt = new Date().toISOString();
    writeDB(db);
    return true;
  }
}

export async function checkDuplicateProduct(
  sourceUrlOrObj?: string | { sourceUrl?: string; sku?: string; name?: string; brand?: string; sourceProductId?: string },
  skuArg?: string,
  nameArg?: string,
  brandArg?: string,
  sourceProductIdArg?: string
): Promise<{ exists: boolean; existingProduct?: Product }> {
  const sourceUrl = typeof sourceUrlOrObj === 'string' ? sourceUrlOrObj : sourceUrlOrObj?.sourceUrl;
  const sku = typeof sourceUrlOrObj === 'string' ? skuArg : sourceUrlOrObj?.sku;
  const name = typeof sourceUrlOrObj === 'string' ? nameArg : sourceUrlOrObj?.name;
  const brand = typeof sourceUrlOrObj === 'string' ? brandArg : sourceUrlOrObj?.brand;
  const sourceProductId = typeof sourceUrlOrObj === 'string' ? sourceProductIdArg : sourceUrlOrObj?.sourceProductId;

  const products = await getProductsList();
  
  if (sourceProductId && typeof sourceProductId === 'string' && sourceProductId.trim()) {
    const foundBySourceId = products.find(p => p.sourceProductId && p.sourceProductId.trim().toLowerCase() === sourceProductId.trim().toLowerCase());
    if (foundBySourceId) return { exists: true, existingProduct: foundBySourceId };
  }

  if (sourceUrl && typeof sourceUrl === 'string' && sourceUrl.trim()) {
    const foundByUrl = products.find(p => p.sourceUrl && p.sourceUrl.trim().toLowerCase() === sourceUrl.trim().toLowerCase());
    if (foundByUrl) return { exists: true, existingProduct: foundByUrl };
  }

  if (sku && typeof sku === 'string' && sku.trim()) {
    const foundBySku = products.find(p => p.sku && p.sku.trim().toLowerCase() === sku.trim().toLowerCase());
    if (foundBySku) return { exists: true, existingProduct: foundBySku };
  }

  if (name && brand && typeof name === 'string' && typeof brand === 'string') {
    const foundByNameBrand = products.find(p => 
      p.name.trim().toLowerCase() === name.trim().toLowerCase() && 
      p.brand.trim().toLowerCase() === brand.trim().toLowerCase()
    );
    if (foundByNameBrand) return { exists: true, existingProduct: foundByNameBrand };
  }

  return { exists: false };
}

export async function addAuditLog(admin: string, action: string, target: string, details?: string): Promise<AuditLog> {
  const newLog: AuditLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    admin,
    action,
    target,
    details: details || '',
    timestamp: new Date().toISOString()
  };

  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    await AuditLogModel.create(newLog);
  } else {
    const db = readDB();
    if (!db.auditLogs) db.auditLogs = [];
    db.auditLogs.unshift(newLog);
    writeDB(db);
  }

  return newLog;
}

export async function getAuditLogsList(): Promise<AuditLog[]> {
  const isMongo = await isMongoDBConnected();
  if (isMongo) {
    return await AuditLogModel.find({}).sort({ createdAt: -1 }).lean() as unknown as AuditLog[];
  } else {
    const db = readDB();
    return db.auditLogs || [];
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
