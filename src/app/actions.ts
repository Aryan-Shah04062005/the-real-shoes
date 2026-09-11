'use server';

import { 
  Product, 
  Order, 
  Customer, 
  WebsiteContent, 
  OrderItem,
  AuditLog,
  getFullDb,
  getProductsList,
  getProductById,
  saveProduct,
  deleteProduct,
  archiveProduct,
  restoreProduct,
  checkDuplicateProduct,
  isValidProductImage,
  addAuditLog,
  getAuditLogsList,
  getOrdersList,
  saveOrder,
  deleteOrder,
  saveCustomer,
  getCustomersList,
  getWebsiteContent,
  saveWebsiteContent,
  getDatabaseStatus
} from '@/lib/db';
import { loginAdmin, logoutAdmin, isAdminAuthenticated } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Helper to safely revalidate Next.js cache
function safeRevalidatePath(originalPath: string, type?: 'layout' | 'page') {
  try {
    if (type) {
      revalidatePath(originalPath, type);
    } else {
      revalidatePath(originalPath);
    }
  } catch {
    // Ignore when executed outside Next.js request context
  }
}

// Helper to check authentication in server actions
async function requireAdmin() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    throw new Error('Unauthorized access');
  }
}

// 1. Admin Authentication Actions
export async function loginAdminAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  
  const success = await loginAdmin(username, password);
  if (success) {
    await addAuditLog(username || 'Admin', 'Admin Login', 'Dashboard Session', 'Successfully logged in to Admin Dashboard');
    safeRevalidatePath('/', 'layout');
    return { success: true };
  }
  return { success: false, error: 'Invalid username or password.' };
}

export async function logoutAdminAction() {
  await addAuditLog('Admin', 'Admin Logout', 'Dashboard Session', 'Logged out of Admin Dashboard');
  await logoutAdmin();
  safeRevalidatePath('/', 'layout');
  return { success: true };
}

// 2. Checkout & Order Placement Action
export async function placeOrderAction(customerData: {
  name: string;
  email: string;
  phone: string;
  flat: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  landmark?: string;
  notes?: string;
  paymentMethod?: string;
  couponCode?: string;
  discountAmount?: number;
}, items: {
  productId: string;
  customizationId?: string;
  size: number;
  color: string;
  quantity: number;
}[]) {
  try {
    const products = await getProductsList();
    const orderItems: OrderItem[] = [];
    let subtotal = 0;
    
    // Validate stock and construct items
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return { success: false, error: `Product not found.` };
      }

      if (product.status === 'ARCHIVED' || product.status === 'HIDDEN' || product.status === 'DRAFT') {
        return { success: false, error: `${product.name} is no longer available for purchase.` };
      }

      // Check size-specific stock if defined
      const availableSizeStock = product.sizeStock?.[item.size] ?? product.stock;
      if (availableSizeStock < item.quantity || product.stock < item.quantity) {
        return { success: false, error: `Insufficient stock for ${product.name} (UK ${item.size}). Only ${availableSizeStock} left.` };
      }
      
      const selectedColorway = product.availableColors?.find(c => c.name === item.color);
      const colorHex = selectedColorway ? selectedColorway.hex : '#ffffff';
      
      // Update sizeStock and total stock
      if (!product.sizeStock) {
        product.sizeStock = {};
        for (const s of product.availableSizes || [7, 8, 9, 10, 11]) {
          product.sizeStock[s] = Math.floor(product.stock / (product.availableSizes?.length || 1));
        }
      }
      product.sizeStock[item.size] = Math.max(0, (product.sizeStock[item.size] || 0) - item.quantity);
      product.stock = Math.max(0, product.stock - item.quantity);
      if (product.stock === 0) {
        product.status = 'OUT_OF_STOCK';
      }

      await saveProduct(product);
      
      const itemPrice = product.price;
      subtotal += itemPrice * item.quantity;
      
      orderItems.push({
        productId: product.id,
        customizationId: item.customizationId,
        name: product.name,
        brand: product.brand,
        size: item.size,
        color: item.color,
        colorHex: colorHex,
        quantity: item.quantity,
        price: itemPrice
      });
    }
    
    // Pricing details
    const discount = customerData.discountAmount || 0;
    const deliveryCharges = subtotal > 3000 || subtotal === 0 ? 0 : 99;
    const total = Math.max(0, subtotal - discount + deliveryCharges);
    
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderId = `TR-2026-${randomNum}`;
    
    const newOrder: Order = {
      id: orderId,
      customerName: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      address: {
        flat: customerData.flat,
        street: customerData.street,
        city: customerData.city,
        state: customerData.state,
        zip: customerData.zip,
        country: customerData.country
      },
      landmark: customerData.landmark,
      notes: customerData.notes,
      items: orderItems,
      subtotal: subtotal,
      discount: discount,
      couponCode: customerData.couponCode,
      deliveryCharges: deliveryCharges,
      total: total,
      paymentMethod: (customerData.paymentMethod as any) || 'COD',
      paymentStatus: customerData.paymentMethod === 'COD' ? 'Pending' : 'Paid',
      status: 'Confirmed',
      date: new Date().toISOString().split('T')[0]
    };
    
    await saveOrder(newOrder);
    
    // Update or insert customer
    const customers = await getCustomersList();
    const existingCust = customers.find(c => c.email.toLowerCase() === customerData.email.toLowerCase() || c.phone === customerData.phone);
    if (existingCust) {
      existingCust.totalOrders += 1;
      existingCust.totalSpending += total;
      await saveCustomer(existingCust);
    } else {
      await saveCustomer({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: newOrder.address,
        totalOrders: 1,
        totalSpending: total,
        registrationDate: new Date().toISOString().split('T')[0]
      });
    }
    
    safeRevalidatePath('/', 'layout');
    
    return { success: true, orderId };
  } catch (error: any) {
    return { success: false, error: error.message || 'Something went wrong.' };
  }
}

// 3. Admin Product Management Actions
export async function saveProductAction(productData: Partial<Product> & { id?: string }) {
  await requireAdmin();
  
  if (!productData.name || !productData.name.trim()) {
    return { success: false, error: 'Product name is required.' };
  }
  if (productData.price === undefined || productData.price < 0) {
    return { success: false, error: 'A valid selling price is required.' };
  }
  if (productData.stock !== undefined && productData.stock < 0) {
    return { success: false, error: 'Stock cannot be negative.' };
  }

  let mainImg = (productData.mainImage || (productData.images && productData.images[0]) || '').trim();
  if (!mainImg) {
    mainImg = 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=1000&q=80';
  }

  const originalPrice = productData.originalPrice ?? productData.price ?? 0;
  const price = productData.price ?? originalPrice;
  const discountPercentage = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  
  let savedProd: Product;

  const existing = productData.id ? await getProductById(productData.id) : null;

  if (existing) {
    // Edit existing product in database
    const totalStock = productData.stock ?? existing.stock;
    const status = totalStock === 0 ? 'OUT_OF_STOCK' : (productData.status || existing.status || 'ACTIVE');

    savedProd = {
      ...existing,
      ...productData,
      price,
      originalPrice,
      discountPrice: price,
      discountPercentage,
      stock: totalStock,
      status,
      updatedAt: new Date().toISOString()
    } as Product;
    
    await saveProduct(savedProd);
    await addAuditLog('Admin', 'Updated Product', savedProd.name, `Price: ₹${price}, Stock: ${totalStock}, Status: ${status}`);
  } else {
    // Add new product (including preview products imported from Amazon/Flipkart)
    const id = productData.id || ((productData.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 6));
    const sku = productData.sku || ('TR-' + (productData.brand || 'REAL').substring(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900));
    const totalStock = productData.stock ?? 10;
    const status = totalStock === 0 ? 'OUT_OF_STOCK' : (productData.status || 'ACTIVE');
    
    // Check duplicates
    if (productData.sourceUrl) {
      const dupCheck = await checkDuplicateProduct(productData.sourceUrl, sku, productData.name, productData.brand);
      if (dupCheck.exists && dupCheck.existingProduct && dupCheck.existingProduct.id !== id) {
        return { success: false, isDuplicate: true, existingProduct: dupCheck.existingProduct, error: 'This product has already been imported or created.' };
      }
    }

    savedProd = {
      id,
      name: productData.name.trim(),
      brand: productData.brand?.trim() || 'THE REAL',
      category: productData.category?.trim() || 'Casual',
      description: productData.description?.trim() || '',
      price: price,
      originalPrice: originalPrice,
      discountPrice: price,
      discountPercentage: discountPercentage,
      availableSizes: productData.availableSizes || [7, 8, 9, 10, 11],
      availableColors: productData.availableColors || [{ name: 'Royal Blue', hex: '#0a58ca', threeColor: '#0a58ca' }],
      material: productData.material || 'Premium Fabrics',
      gender: productData.gender || 'Unisex',
      stock: totalStock,
      sizeStock: productData.sizeStock || { 7: 2, 8: 3, 9: 3, 10: 2 },
      sku: sku,
      rating: productData.rating || 5.0,
      reviews: productData.reviews || [],
      tags: productData.tags || [],
      images: (productData.images && productData.images.length > 0) ? productData.images : [mainImg],
      mainImage: mainImg,
      isNewArrival: productData.isNewArrival ?? true,
      isBestSeller: productData.isBestSeller ?? false,
      isTrending: productData.isTrending ?? true,
      isFeatured: productData.isFeatured ?? true,
      isSale: productData.isSale ?? false,
      status: status,
      sourcePlatform: productData.sourcePlatform || 'MANUAL',
      sourceUrl: productData.sourceUrl || '',
      sourceProductId: productData.sourceProductId || '',
      sourcePrice: productData.sourcePrice || price,
      updatedAt: new Date().toISOString()
    };
    
    await saveProduct(savedProd);
    await addAuditLog('Admin', 'Created Product', savedProd.name, `SKU: ${sku}, Price: ₹${price}, Source: ${savedProd.sourcePlatform}`);
  }
  
  safeRevalidatePath('/', 'layout');
  safeRevalidatePath('/shop');
  safeRevalidatePath('/admin/dashboard');
  safeRevalidatePath('/product/' + savedProd.id);
  return { success: true, product: savedProd };
}

export async function getDatabaseStatusAction() {
  await requireAdmin();
  return await getDatabaseStatus();
}

export async function deleteProductAction(productId: string) {
  await requireAdmin();
  const product = await getProductById(productId);
  if (!product) return { success: false, error: 'Product not found.' };

  const res = await deleteProduct(productId);
  if (!res.success) return { success: false, error: 'Unable to delete product. Please try again.' };
  
  const actionName = res.mode === 'archived' ? 'Archived Product (Order Preserved)' : 'Deleted Product';
  await addAuditLog('Admin', actionName, product.name, `ID: ${productId}, Mode: ${res.mode}`);

  safeRevalidatePath('/', 'layout');
  safeRevalidatePath('/shop');
  safeRevalidatePath('/admin/dashboard');
  return { success: true, mode: res.mode };
}

export async function archiveProductAction(productId: string) {
  await requireAdmin();
  const product = await getProductById(productId);
  if (!product) return { success: false, error: 'Product not found.' };

  const success = await archiveProduct(productId);
  if (!success) return { success: false, error: 'Unable to archive product. Please try again.' };

  await addAuditLog('Admin', 'Archived Product', product.name, `ID: ${productId}`);

  safeRevalidatePath('/', 'layout');
  safeRevalidatePath('/shop');
  safeRevalidatePath('/admin/dashboard');
  return { success: true };
}

export async function restoreProductAction(productId: string) {
  await requireAdmin();
  const product = await getProductById(productId);
  if (!product) return { success: false, error: 'Product not found.' };

  const success = await restoreProduct(productId);
  if (!success) return { success: false, error: 'Unable to restore product. Please try again.' };

  await addAuditLog('Admin', 'Restored Product', product.name, `ID: ${productId}`);

  safeRevalidatePath('/', 'layout');
  safeRevalidatePath('/shop');
  safeRevalidatePath('/admin/dashboard');
  return { success: true };
}

export async function bulkProductAction(action: 'archive' | 'delete' | 'status' | 'stock' | 'flag', productIds: string[], payload?: any) {
  await requireAdmin();
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return { success: false, error: 'No products selected.' };
  }

  let count = 0;

  for (const id of productIds) {
    if (!id) continue;

    if (action === 'delete') {
      const res = await deleteProduct(id);
      if (res.success) {
        count++;
      }
    } else {
      const product = await getProductById(id);
      if (!product) continue;

      if (action === 'archive') {
        await archiveProduct(id);
        await addAuditLog('Admin', 'Bulk Archive', product.name, `ID: ${id}`);
        count++;
      } else if (action === 'status' && payload?.status) {
        product.status = payload.status;
        await saveProduct(product);
        await addAuditLog('Admin', 'Bulk Status Update', product.name, `New Status: ${payload.status}`);
        count++;
      } else if (action === 'stock' && payload?.stock !== undefined) {
        product.stock = Math.max(0, payload.stock);
        if (product.stock === 0) product.status = 'OUT_OF_STOCK';
        await saveProduct(product);
        await addAuditLog('Admin', 'Bulk Stock Update', product.name, `New Stock: ${product.stock}`);
        count++;
      } else if (action === 'flag' && payload) {
        if (payload.isNewArrival !== undefined) product.isNewArrival = payload.isNewArrival;
        if (payload.isBestSeller !== undefined) product.isBestSeller = payload.isBestSeller;
        if (payload.isTrending !== undefined) product.isTrending = payload.isTrending;
        if (payload.isFeatured !== undefined) product.isFeatured = payload.isFeatured;
        await saveProduct(product);
        await addAuditLog('Admin', 'Bulk Flag Update', product.name, `Flags updated`);
        count++;
      }
    }
  }

  if (count > 0) {
    await addAuditLog('Admin', `Bulk ${action.toUpperCase()}`, `${count} products`, `IDs: ${productIds.join(', ')}`);
  }

  safeRevalidatePath('/', 'layout');
  safeRevalidatePath('/shop');
  safeRevalidatePath('/admin/dashboard');

  return { success: true, count };
}

export async function getAuditLogsAction() {
  await requireAdmin();
  return await getAuditLogsList();
}

// 4. Admin Order Management Actions
export async function updateOrderStatusAction(orderId: string, status: Order['status']) {
  await requireAdmin();
  const orders = await getOrdersList();
  const order = orders.find(o => o.id === orderId);
  if (!order) return { success: false, error: 'Order not found.' };
  
  order.status = status;
  await saveOrder(order);
  
  safeRevalidatePath('/', 'layout');
  return { success: true };
}

export async function deleteOrderAction(orderId: string) {
  await requireAdmin();
  const success = await deleteOrder(orderId);
  if (!success) return { success: false, error: 'Order not found.' };
  
  safeRevalidatePath('/', 'layout');
  return { success: true };
}

// 5. Admin Stock Management Actions
export async function adjustStockAction(productId: string, quantityChange: number) {
  await requireAdmin();
  const product = await getProductById(productId);
  if (!product) return { success: false, error: 'Product not found.' };
  
  product.stock = Math.max(0, product.stock + quantityChange);
  await saveProduct(product);
  
  safeRevalidatePath('/', 'layout');
  return { success: true };
}

// 6. Admin Website CMS Actions
export async function updateWebsiteContentAction(contentData: Partial<WebsiteContent>) {
  await requireAdmin();
  const current = await getWebsiteContent();
  
  const updated = {
    ...current,
    ...contentData
  } as WebsiteContent;
  
  await saveWebsiteContent(updated);
  safeRevalidatePath('/', 'layout');
  return { success: true };
}

// 7. Product Review Actions
export async function addProductReviewAction(productId: string, review: { name: string; rating: number; comment: string }) {
  const product = await getProductById(productId);
  if (!product) return { success: false, error: 'Product not found.' };
  
  const newReview = {
    name: review.name || 'Anonymous User',
    rating: review.rating || 5,
    comment: review.comment || '',
    date: new Date().toISOString().split('T')[0]
  };
  
  product.reviews.unshift(newReview);
  
  // Re-compute average rating
  const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
  product.rating = parseFloat((totalRating / product.reviews.length).toFixed(1));
  
  await saveProduct(product);
  safeRevalidatePath('/', 'layout');
  return { success: true };
}

// 8. Import Product from Amazon or Flipkart Link
export async function importProductFromUrlAction(url: string, targetPrice: number, category: string) {
  try {
    await requireAdmin();
  } catch (err) {
    return { success: false, error: 'Unauthorized administrative session.' };
  }

  if (!url || !url.trim()) {
    return { success: false, error: 'Product URL is required.' };
  }
  if (!targetPrice || targetPrice <= 0) {
    return { success: false, error: 'A valid Selling Price is required.' };
  }

  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  let title = '';
  let description = '';
  let mainImage = '';
  let brand = 'THE REAL';

  const isAmazon = /amazon\.|amzn\.to|amzn\.in/i.test(cleanUrl);
  const isFlipkart = /flipkart\.|fkrt\.it|dl\.flipkart\.com/i.test(cleanUrl);

  if (!isAmazon && !isFlipkart) {
    return { success: false, error: 'Only Amazon or Flipkart URLs are supported.' };
  }

  let sourceProductId = '';
  if (isFlipkart) {
    const itmMatch = cleanUrl.match(/\/p\/(itm[a-zA-Z0-9]+)/i) || cleanUrl.match(/(itm[a-zA-Z0-9]{10,})/i);
    if (itmMatch) {
      sourceProductId = itmMatch[1] || itmMatch[0];
    } else {
      const pidMatch = cleanUrl.match(/[?&]pid=([a-zA-Z0-9]+)/i);
      if (pidMatch) sourceProductId = pidMatch[1];
    }
  } else if (isAmazon) {
    const dpMatch = cleanUrl.match(/\/dp\/([A-Z0-9]{10})/i) || cleanUrl.match(/\/gp\/product\/([A-Z0-9]{10})/i);
    if (dpMatch) sourceProductId = dpMatch[1];
  }

  // Duplicate URL & ID check
  const dupCheck = await checkDuplicateProduct(cleanUrl, undefined, undefined, undefined, sourceProductId);
  if (dupCheck.exists && dupCheck.existingProduct) {
    return {
      success: true,
      isDuplicate: true,
      duplicateProduct: dupCheck.existingProduct,
      preview: null,
      error: 'This product link or ID has already been imported to your store.'
    };
  }

  // Sanitizer helper to remove Amazon & Flipkart names and promotional text
  const sanitizeTextOfStoreBrands = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/amazon\.in/gi, '')
      .replace(/amazon\.com/gi, '')
      .replace(/amazon\s+fashion/gi, '')
      .replace(/amazon/gi, '')
      .replace(/amzn\.to/gi, '')
      .replace(/amzn\.in/gi, '')
      .replace(/amzn/gi, '')
      .replace(/flipkart\.com/gi, '')
      .replace(/flipkart\.in/gi, '')
      .replace(/flipkart assured/gi, '')
      .replace(/flipkart/gi, '')
      .replace(/fkrt\.it/gi, '')
      .replace(/fkrt/gi, '')
      .replace(/buy\s+online\s+at\s+low\s+prices\s+in\s+india/gi, '')
      .replace(/at\s+low\s+prices/gi, '')
      .replace(/visit\s+the\s+store/gi, '')
      .replace(/on\s+sale\s+at/gi, '')
      .replace(/only\s+on/gi, '')
      .replace(/on\s+our\s+website/gi, '')
      .replace(/assured\s+quality/gi, '')
      .replace(/online\s+shopping/gi, '')
      .replace(/best\s+price\s+in\s+india/gi, '')
      .replace(/\s*\|\s*/g, ' ')
      .replace(/\s*-\s*/g, ' ')
      .replace(/\s*:\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  let finalUrl = cleanUrl;
  const extractedImages: string[] = [];
  let rawColorText = '';

  try {
    // Attempt standard HTTP request to scrape with redirect follow
    const res = await fetch(cleanUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      next: { revalidate: 0 } // Bypass Next.js fetch caching
    });

    if (res.ok) {
      finalUrl = res.url || cleanUrl;
      const html = await res.text();

      // Parse HTML with regex
      if (isAmazon) {
        // Amazon title regexes
        const titleMatch = html.match(/<span id="productTitle"[^>]*>\s*([^<]+)\s*<\/span>/i) || 
                           html.match(/<meta name="title" content="([^"]+)"/i) ||
                           html.match(/<meta property="og:title" content="([^"]+)"/i) ||
                           html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) title = titleMatch[1].trim();

        // Amazon description regexes
        const descMatch = html.match(/<meta name="description" content="([^"]+)"/i) ||
                          html.match(/<meta property="og:description" content="([^"]+)"/i) ||
                          html.match(/<div id="productDescription"[^>]*>\s*<p>\s*([^<]+)\s*<\/p>/i);
        if (descMatch) description = descMatch[1].trim();

        // Amazon image regexes & extraction of all high-res photos
        const imgMatch = html.match(/id="landingImage"[^>]*src="([^"]+)"/i) ||
                         html.match(/id="main-image"[^>]*src="([^"]+)"/i) ||
                         html.match(/data-old-hires="([^"]+)"/i) ||
                         html.match(/meta name="twitter:image" content="([^"]+)"/i) ||
                         html.match(/<meta property="og:image" content="([^"]+)"/i) ||
                         html.match(/"large":"([^"]+)"/i);
        if (imgMatch) mainImage = imgMatch[1].trim();
        
        // Extract all Amazon product photos
        const amazonImgMatches = html.matchAll(/"(https:\/\/(?:m\.media-amazon\.com|images-na\.ssl-images-amazon\.com)\/images\/I\/[^"]+\.(?:jpg|png|jpeg|webp))"/gi);
        for (const m of amazonImgMatches) {
          const imgUrl = m[1];
          if (!imgUrl.includes('icon') && !imgUrl.includes('sprite') && !imgUrl.includes('SS40') && !imgUrl.includes('SX38') && !extractedImages.includes(imgUrl)) {
            extractedImages.push(imgUrl);
          }
        }
        
        // Amazon brand regex
        const brandMatch = html.match(/<a id="bylineInfo"[^>]*>\s*Brand:\s*([^<]+)\s*<\/a>/i) ||
                           html.match(/Brand:\s*([^<]+)/i);
        if (brandMatch) brand = brandMatch[1].trim();

        // Amazon color scraper
        const amazonColorMatch = html.match(/<span class="selection">\s*([^<]+)\s*<\/span>/i) ||
                                 html.match(/"color_name":\s*"([^"]+)"/i) ||
                                 html.match(/Color:\s*<\/span>\s*<span[^>]*>\s*([^<]+)\s*<\/span>/i);
        if (amazonColorMatch) rawColorText = amazonColorMatch[1].trim();
      } else {
        const cleanHtml = html.replace(/\\u002f/gi, '/').replace(/\\u002F/gi, '/');

        // Flipkart title regexes (OpenGraph, Twitter card, Class tags, H1, Title)
        const titleMatch = cleanHtml.match(/<meta [^>]*property="og:title"[^>]*content="([^"]+)"/i) ||
                           cleanHtml.match(/<meta [^>]*content="([^"]+)"[^>]*property="og:title"/i) ||
                           cleanHtml.match(/<meta [^>]*name="twitter:title"[^>]*content="([^"]+)"/i) ||
                           cleanHtml.match(/<meta [^>]*content="([^"]+)"[^>]*name="twitter:title"/i) ||
                           cleanHtml.match(/<span [^>]*class="[^"]*B_NuCI[^"]*"[^>]*>\s*([^<]+)\s*<\/span>/i) ||
                           cleanHtml.match(/<span [^>]*class="[^"]*VU-423[^"]*"[^>]*>\s*([^<]+)\s*<\/span>/i) ||
                           cleanHtml.match(/<span [^>]*class="[^"]*_2lT163[^"]*"[^>]*>\s*([^<]+)\s*<\/span>/i) ||
                           cleanHtml.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/i) ||
                           cleanHtml.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) title = titleMatch[1].trim();

        // Flipkart description regexes
        const descMatch = cleanHtml.match(/<meta [^>]*property="og:description"[^>]*content="([^"]+)"/i) ||
                          cleanHtml.match(/<meta [^>]*content="([^"]+)"[^>]*property="og:description"/i) ||
                          cleanHtml.match(/<meta [^>]*name="description"[^>]*content="([^"]+)"/i) ||
                          cleanHtml.match(/<meta [^>]*content="([^"]+)"[^>]*name="description"/i) ||
                          cleanHtml.match(/<div [^>]*class="[^"]*_1mXERD[^"]*"[^>]*>\s*([^<]+)\s*<\/div>/i);
        if (descMatch) description = descMatch[1].trim();

        // Flipkart main image
        const imgMatch = cleanHtml.match(/<meta [^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                         cleanHtml.match(/<meta [^>]*content="([^"]+)"[^>]*property="og:image"/i) ||
                         cleanHtml.match(/<meta [^>]*name="twitter:image"[^>]*content="([^"]+)"/i) ||
                         cleanHtml.match(/<meta [^>]*content="([^"]+)"[^>]*name="twitter:image"/i) ||
                         cleanHtml.match(/"image":\s*\[?"(https:\/\/rukminim[0-9]\.flixcart\.com\/image\/[^"]+)"/i) ||
                         cleanHtml.match(/<img [^>]*src="(https:\/\/rukminim[0-9]\.flixcart\.com\/image\/[^"]+)"/i);
        if (imgMatch) mainImage = imgMatch[1].trim();

        // Extract all Flipkart product photos directly (including JSON-LD, escaped JSON, xif0q CDN, etc.)
        const rawImageMatches = cleanHtml.match(/(?:https?:\\?\/\\?\/|\/\/)[^"'\s<>{}]+?(?:rukminim|flixcart|xif0q)[^"'\s<>{}\\]*/gi) || [];
        rawImageMatches.forEach(m => {
          let imgUrl = m.replace(/\\u002f/gi, '/').replace(/\\/g, '').replace(/&quot;/g, '').split('?')[0].split('"')[0].split("'")[0];
          if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
          imgUrl = imgUrl.replace(/\/image\/\{@width\}\/\{@height\}/g, '/image/832/832');
          imgUrl = imgUrl.replace(/\/image\/\d+\/\d+/g, '/image/832/832');
          if ((imgUrl.includes('/image/') || imgUrl.includes('xif0q')) &&
              !imgUrl.includes('/www/') && !imgUrl.includes('logo') && !imgUrl.includes('icon') &&
              !imgUrl.includes('splash') && !imgUrl.includes('placeholder') && !imgUrl.endsWith('.svg') &&
              !extractedImages.includes(imgUrl)) {
            extractedImages.push(imgUrl);
          }
        });

        // Flipkart brand regex
        const brandMatch = cleanHtml.match(/<span [^>]*class="[^"]*G6XhY1[^"]*"[^>]*>\s*([^<]+)\s*<\/span>/i) ||
                           cleanHtml.match(/<span [^>]*class="[^"]*m7-21p[^"]*"[^>]*>\s*([^<]+)\s*<\/span>/i) ||
                           cleanHtml.match(/<span [^>]*class="[^"]*_2Wk1fc[^"]*"[^>]*>\s*([^<]+)\s*<\/span>/i);
        if (brandMatch) brand = brandMatch[1].trim();

        // Flipkart color scraper
        const flipkartColorMatch = cleanHtml.match(/<div [^>]*class="[^"]*_2C41vz[^"]*"[^>]*>\s*([^<]+)\s*<\/div>/i) ||
                                   cleanHtml.match(/"color":\s*"([^"]+)"/i) ||
                                   cleanHtml.match(/<td>\s*Color\s*<\/td>\s*<td>\s*([^<]+)\s*<\/td>/i);
        if (flipkartColorMatch) rawColorText = flipkartColorMatch[1].trim();
      }

      // Upgrade Flipkart low-res image thumbnails to high-res (e.g. 128/128 -> 832/832)
      if (mainImage && mainImage.includes('rukminim')) {
        mainImage = mainImage.replace(/\/image\/\d+\/\d+/, '/image/832/832');
      }

      // Apply initial sanitization
      title = sanitizeTextOfStoreBrands(title);
      description = sanitizeTextOfStoreBrands(description);
      brand = sanitizeTextOfStoreBrands(brand);
    }
  } catch (scrapeErr) {
    console.error('Failed to parse URL html, invoking fallback parser:', scrapeErr);
  }

  // Resilient Search Fallback for Flipkart: If direct scrape returned no product images or blocked title, query Flipkart search endpoint!
  if (isFlipkart && (extractedImages.length === 0 || !title || title.toLowerCase().includes('flipkart.com') || title.toLowerCase().includes('online shopping'))) {
    try {
      const targetUrl = (finalUrl || cleanUrl).split('?')[0];
      const urlObj = new URL(targetUrl);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const pIdx = pathParts.indexOf('p');
      let rawSlug = '';
      if (pIdx > 0) {
        rawSlug = pathParts[pIdx - 1];
      } else {
        rawSlug = pathParts.find(p => p.length > 5 && !p.includes('.') && p !== 'p' && !p.startsWith('itm')) || '';
      }

      if (rawSlug) {
        const slugQuery = rawSlug.replace(/[-_]+/g, ' ').trim();
        if (!title || title.toLowerCase().includes('flipkart.com') || title.toLowerCase().includes('online shopping')) {
          title = slugQuery.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }

        const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(slugQuery)}`;
        const sRes = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
          }
        });
        if (sRes.ok) {
          const sRaw = await sRes.text();
          const sHtml = sRaw.replace(/\\u002f/gi, '/').replace(/\\u002F/gi, '/');
          const sMatches = sHtml.match(/https?:\/\/[^"'\s<>{}]+(?:rukminim|flixcart)[^"'\s<>{}]+/gi) || [];
          sMatches.forEach(m => {
            let imgUrl = m.split('?')[0].split('"')[0].split("'")[0].replace(/\\/g, '');
            imgUrl = imgUrl.replace(/\/image\/\{@width\}\/\{@height\}/g, '/image/832/832');
            imgUrl = imgUrl.replace(/\/image\/\d+\/\d+/g, '/image/832/832');
            if ((imgUrl.includes('/image/') || imgUrl.includes('xif0q')) &&
                !imgUrl.includes('/www/') && !imgUrl.includes('logo') && !imgUrl.includes('icon') &&
                !imgUrl.includes('splash') && !imgUrl.includes('placeholder') && !imgUrl.endsWith('.svg') &&
                !extractedImages.includes(imgUrl)) {
              extractedImages.push(imgUrl);
            }
          });
        }
      }
    } catch (searchErr) {
      console.error('Flipkart search fallback error:', searchErr);
    }
  }

  // Resilient Fallback: If scraper is blocked or returns generic values, parse the URL path!
  if (!title || title.toLowerCase().includes('robot check') || title.toLowerCase().includes('security check') || title.toLowerCase().includes('captcha')) {
    try {
      const targetUrl = (finalUrl || cleanUrl).split('?')[0];
      const urlObj = new URL(targetUrl);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      if (isAmazon) {
        // Amazon URL typical form: /Nike-Mens-Air-Max-Running/dp/B08XXX or /dp/B08XXX
        const dpIdx = pathParts.indexOf('dp');
        let rawSlug = '';
        if (dpIdx > 0) {
          rawSlug = pathParts[dpIdx - 1];
        } else {
          rawSlug = pathParts.find(p => p.length > 8 && !p.includes('.') && p !== 'dp') || '';
        }
        
        if (rawSlug) {
          title = rawSlug.replace(/[-_]+/g, ' ');
        }
      } else if (isFlipkart) {
        // Flipkart URL typical form: /puma-smashic-comfort-casual-sneakers-men/p/itm5d13a96860dbd
        const pIdx = pathParts.indexOf('p');
        let rawSlug = '';
        if (pIdx > 0) {
          rawSlug = pathParts[pIdx - 1];
        } else {
          rawSlug = pathParts.find(p => p.length > 8 && !p.includes('.') && p !== 'p' && !p.startsWith('itm')) || '';
        }
        
        if (rawSlug) {
          title = rawSlug.replace(/[-_]+/g, ' ');
        }
      }
    } catch (parseUrlErr) {
      console.error('Failed to extract slug from URL:', parseUrlErr);
    }
  }

  // Cleanup title
  if (title) {
    title = sanitizeTextOfStoreBrands(title);
    
    // Decode percent encodings, clean HTML entities, uppercase words
    title = decodeURIComponent(title)
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
      
    // Capitalize first letter of each word
    title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  // Final fallback values if everything failed
  if (!title || title.length < 3) {
    title = isAmazon ? 'Imported Premium Sneaker' : 'Imported Elite Sneaker';
  }

  // Deduce Brand name from title
  const brandKeywords = ['Nike', 'Adidas', 'Puma', 'Reebok', 'Asics', 'Skechers', 'Under Armour', 'New Balance', 'Converse', 'Vans'];
  const matchedBrand = brandKeywords.find(b => title.toLowerCase().includes(b.toLowerCase()));
  if (matchedBrand) {
    brand = matchedBrand;
  } else if (brand === 'THE REAL' && title.split(' ').length > 0) {
    brand = title.split(' ')[0];
  }

  brand = sanitizeTextOfStoreBrands(brand);
  if (!brand || brand.trim().length === 0) {
    brand = 'THE REAL';
  }

  if (!description || description.length < 10) {
    description = `Step into premium sizing and absolute comfort with the ${title}. Reimagined with modern responsive cushioning, lightweight dynamic overlays, and a clean aerodynamic layout designed to power your day-to-day pacing.`;
  } else {
    description = sanitizeTextOfStoreBrands(description);
  }

  const brandImageFallbacks: Record<string, string> = {
    'reebok': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1000&q=80',
    'nike': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&q=80',
    'adidas': 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=1000&q=80',
    'puma': 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1000&q=80',
    'asics': 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=1000&q=80',
    'skechers': 'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=1000&q=80',
    'new balance': 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=1000&q=80',
    'converse': 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=1000&q=80',
    'vans': 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=1000&q=80'
  };

  const matchedBrandKey = Object.keys(brandImageFallbacks).find(k => brand.toLowerCase().includes(k) || title.toLowerCase().includes(k));
  const fallbackImg = matchedBrandKey ? brandImageFallbacks[matchedBrandKey] : 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=1000&q=80';

  const validScrapedImages = extractedImages.filter(img => img && img.startsWith('http'));
  if (!mainImage || !mainImage.startsWith('http')) {
    if (validScrapedImages.length > 0) {
      mainImage = validScrapedImages[0];
    } else {
      mainImage = fallbackImg;
    }
  }

  if (!validScrapedImages.includes(mainImage)) {
    validScrapedImages.unshift(mainImage);
  }

  // Build full images list
  const allImages = validScrapedImages.length > 0 ? validScrapedImages.slice(0, 6) : [mainImage];
  if (!allImages.includes(mainImage) && mainImage.startsWith('http')) {
    allImages.unshift(mainImage);
  }
  const finalMainImage = allImages[0] || mainImage;

  // Process and Map extracted colors
  const colorMap: Record<string, string> = {
    'black': '#111827',
    'white': '#ffffff',
    'off white': '#f3f4f6',
    'blue': '#0a58ca',
    'navy': '#1e3a8a',
    'red': '#dc2626',
    'green': '#16a34a',
    'grey': '#6b7280',
    'gray': '#6b7280',
    'silver': '#c0c0c0',
    'yellow': '#eab308',
    'orange': '#f97316',
    'pink': '#ec4899',
    'brown': '#78350f',
    'tan': '#d97706',
    'beige': '#fef3c7',
    'gold': '#d97706',
    'multicolor': '#8b5cf6',
    'teal': '#0d9488',
    'maroon': '#881337',
    'purple': '#7e22ce'
  };

  const parsedColors: { name: string; hex: string; threeColor: string }[] = [];
  const cleanColorText = sanitizeTextOfStoreBrands(rawColorText);

  if (cleanColorText) {
    const parts = cleanColorText.split(/[\/,]/);
    for (const rawPart of parts) {
      const cleaned = rawPart.trim().replace(/[^a-zA-Z0-9\s-]/g, '');
      if (cleaned && cleaned.length >= 3) {
        const lower = cleaned.toLowerCase();
        let matchedHex = '#0a58ca';
        for (const [key, hex] of Object.entries(colorMap)) {
          if (lower.includes(key)) {
            matchedHex = hex;
            break;
          }
        }
        const formattedName = cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        if (!parsedColors.some(c => c.name.toLowerCase() === formattedName.toLowerCase())) {
          parsedColors.push({
            name: formattedName,
            hex: matchedHex,
            threeColor: matchedHex
          });
        }
      }
    }
  }

  // Search title/description for color keywords if direct scraper didn't return valid colors
  if (parsedColors.length === 0) {
    const combinedText = (title + ' ' + description).toLowerCase();
    for (const [key, hex] of Object.entries(colorMap)) {
      if (combinedText.includes(key) && key !== 'multi') {
        const formattedName = key.charAt(0).toUpperCase() + key.slice(1);
        if (!parsedColors.some(c => c.name.toLowerCase() === formattedName.toLowerCase())) {
          parsedColors.push({
            name: formattedName,
            hex: hex,
            threeColor: hex
          });
        }
      }
    }
  }

  // Fallback defaults if no colors discovered
  if (parsedColors.length === 0) {
    parsedColors.push(
      { name: 'Royal Blue', hex: '#0a58ca', threeColor: '#0a58ca' },
      { name: 'Silver Shadow', hex: '#c0c0c0', threeColor: '#c0c0c0' },
      { name: 'Carbon Black', hex: '#111827', threeColor: '#111827' }
    );
  }

  const sourcePlatform = isAmazon ? 'AMAZON' : 'FLIPKART';
  const sku = 'TR-IMP-' + Math.floor(100 + Math.random() * 900) + '-' + brand.substring(0, 3).toUpperCase();
  const productId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ('imported-' + Date.now());
  const originalPrice = Math.round(targetPrice * 1.25);
  const discountPercentage = Math.round(((originalPrice - targetPrice) / originalPrice) * 100);

  const previewProduct: Product = {
    id: productId,
    name: title,
    brand: brand,
    category: category || 'Sneakers',
    description: description,
    price: targetPrice,
    originalPrice: originalPrice,
    discountPrice: targetPrice,
    discountPercentage: discountPercentage,
    availableSizes: [7, 8, 9, 10, 11],
    availableColors: parsedColors,
    material: 'Engineered Synthetic Blend & Responsive Sole',
    gender: 'Unisex',
    stock: 20,
    sizeStock: { 7: 4, 8: 6, 9: 6, 10: 4 },
    sku: sku,
    rating: parseFloat((4.4 + Math.random() * 0.5).toFixed(1)),
    reviews: [],
    tags: ['Imported', brand, category],
    images: allImages,
    mainImage: finalMainImage,
    isNewArrival: true,
    isBestSeller: false,
    isTrending: true,
    isFeatured: false,
    isSale: true,
    status: 'ACTIVE',
    sourcePlatform: sourcePlatform as any,
    sourceUrl: cleanUrl,
    sourceProductId: sourceProductId,
    sourcePrice: targetPrice,
    updatedAt: new Date().toISOString()
  };

  return { success: true, isDuplicate: false, duplicateProduct: null, preview: previewProduct };
}

// 9. Upload Product Image Action
export async function uploadProductImageAction(base64Data: string, filename: string) {
  try {
    await requireAdmin();
    
    // Extract base64 content
    const base64Content = base64Data.split(';base64,').pop();
    if (!base64Content) {
      return { success: false, error: 'Invalid image data.' };
    }
    
    const buffer = Buffer.from(base64Content, 'base64');
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public/images/uploads');
    await fsPromises.mkdir(uploadDir, { recursive: true });
    
    // Generate unique name
    const ext = path.extname(filename) || '.png';
    const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, '-');
    const uniqueName = `upload-${Date.now()}-${base}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);
    
    // Write buffer to file
    await fsPromises.writeFile(filePath, buffer);
    
    const relativeUrl = `/images/uploads/${uniqueName}`;
    return { success: true, url: relativeUrl };
  } catch (error: any) {
    console.error('Image upload error:', error);
    return { success: false, error: error.message || 'Failed to upload image.' };
  }
}

// 10. Coupon Server Actions
export async function validateCouponAction(code: string, subtotal: number) {
  const { validateCoupon } = await import('@/lib/db');
  return await validateCoupon(code, subtotal);
}

export async function getCouponsAction() {
  const { getCouponsList } = await import('@/lib/db');
  return await getCouponsList();
}

export async function saveCouponAction(couponData: any) {
  await requireAdmin();
  const { saveCoupon } = await import('@/lib/db');
  await saveCoupon(couponData);
  safeRevalidatePath('/', 'layout');
  return { success: true };
}

export async function deleteCouponAction(code: string) {
  await requireAdmin();
  const { deleteCoupon } = await import('@/lib/db');
  const success = await deleteCoupon(code);
  safeRevalidatePath('/', 'layout');
  return { success };
}

// 11. Order Tracking & Order Status Actions
export async function trackOrderAction(orderId: string, emailOrPhone: string) {
  const { getOrdersList } = await import('@/lib/db');
  const orders = await getOrdersList();
  const query = emailOrPhone.trim().toLowerCase();
  
  const found = orders.find(o => 
    o.id.toLowerCase() === orderId.trim().toLowerCase() && 
    (o.email.toLowerCase() === query || o.phone.toLowerCase() === query)
  );

  if (!found) {
    return { success: false, error: 'Order not found. Please check your Order ID and Email/Phone number.' };
  }
  return { success: true, order: found };
}

// 12. Review Submission Action
export async function submitReviewAction(productId: string, reviewData: { name: string; rating: number; comment: string }) {
  if (!reviewData.name || !reviewData.comment || !reviewData.rating) {
    return { success: false, error: 'Please provide your name, rating, and comment.' };
  }

  const { addReviewToProduct } = await import('@/lib/db');
  const review = {
    id: 'rev-' + Date.now(),
    name: reviewData.name.trim(),
    rating: Number(reviewData.rating),
    comment: reviewData.comment.trim(),
    date: new Date().toISOString().split('T')[0],
    verifiedPurchase: true
  };

  const updatedProduct = await addReviewToProduct(productId, review);
  if (!updatedProduct) {
    return { success: false, error: 'Product not found.' };
  }

  safeRevalidatePath('/product/' + productId);
  safeRevalidatePath('/shop');
  return { success: true, product: updatedProduct };
}

// 13. Custom 3D Shoe Action
export async function saveCustomShoeAction(customData: {
  upperColor: string;
  soleColor: string;
  laceColor: string;
  logoColor: string;
  calculatedPrice: number;
}) {
  const { saveCustomShoe } = await import('@/lib/db');
  const customizationId = 'CUSTOM-REAL-' + Math.floor(10000 + Math.random() * 90000);
  const record = {
    customizationId,
    upperColor: customData.upperColor,
    soleColor: customData.soleColor,
    laceColor: customData.laceColor,
    logoColor: customData.logoColor,
    calculatedPrice: customData.calculatedPrice,
    createdAt: new Date().toISOString()
  };

  await saveCustomShoe(record);
  return { success: true, customizationId, record };
}

// 12. Validate Cart & Wishlist Product States against Live Database
export async function validateCartProductsAction(productIds: string[]): Promise<{ success: boolean; productsMap: Record<string, Product | null>; error?: string }> {
  const productsMap: Record<string, Product | null> = {};
  if (!productIds || productIds.length === 0) {
    return { success: true, productsMap };
  }

  try {
    const allProducts = await getProductsList();
    for (const id of productIds) {
      const found = allProducts.find(p => p.id === id);
      productsMap[id] = found || null;
    }

    return { success: true, productsMap };
  } catch (err: any) {
    console.error('Error validating cart products:', err);
    return { success: false, productsMap, error: err.message };
  }
}



