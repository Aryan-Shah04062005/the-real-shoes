'use server';

import { 
  Product, 
  Order, 
  Customer, 
  WebsiteContent, 
  OrderItem,
  getFullDb,
  getProductsList,
  getProductById,
  saveProduct,
  deleteProduct,
  getOrdersList,
  saveOrder,
  deleteOrder,
  saveCustomer,
  getCustomersList,
  getWebsiteContent,
  saveWebsiteContent
} from '@/lib/db';
import { loginAdmin, logoutAdmin, isAdminAuthenticated } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import path from 'path';
import { promises as fsPromises } from 'fs';

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
    revalidatePath('/', 'layout');
    return { success: true };
  }
  return { success: false, error: 'Invalid username or password.' };
}

export async function logoutAdminAction() {
  await logoutAdmin();
  revalidatePath('/', 'layout');
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
      
      if (product.stock < item.quantity) {
        return { success: false, error: `Insufficient stock for ${product.name}. Only ${product.stock} left.` };
      }
      
      const selectedColorway = product.availableColors?.find(c => c.name === item.color);
      const colorHex = selectedColorway ? selectedColorway.hex : '#ffffff';
      
      // Update stock
      product.stock -= item.quantity;
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
    
    revalidatePath('/', 'layout');
    
    return { success: true, orderId };
  } catch (error: any) {
    return { success: false, error: error.message || 'Something went wrong.' };
  }
}

// 3. Admin Product Management Actions
export async function saveProductAction(productData: Partial<Product> & { id?: string }) {
  await requireAdmin();
  
  if (productData.id) {
    // Edit existing product
    const existing = await getProductById(productData.id);
    if (!existing) return { success: false, error: 'Product not found.' };
    
    const originalPrice = productData.originalPrice ?? existing.originalPrice;
    const price = productData.price ?? existing.price;
    const discountPercentage = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    
    const updatedProduct = {
      ...existing,
      ...productData,
      discountPercentage,
      discountPrice: price
    } as Product;
    
    await saveProduct(updatedProduct);
  } else {
    // Add new product
    const id = (productData.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const sku = 'TR-' + (productData.brand || 'REAL').substring(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
    const price = productData.price || 0;
    const originalPrice = productData.originalPrice || price;
    const discountPercentage = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    
    const newProduct: Product = {
      id,
      name: productData.name || 'Unnamed Product',
      brand: productData.brand || 'THE REAL',
      category: productData.category || 'Casual',
      description: productData.description || '',
      price: price,
      originalPrice: originalPrice,
      discountPrice: price,
      discountPercentage: discountPercentage,
      availableSizes: productData.availableSizes || [8, 9, 10],
      availableColors: productData.availableColors || [{ name: 'Royal Blue', hex: '#0a58ca', threeColor: '#0a58ca' }],
      material: productData.material || 'Premium Fabrics',
      gender: productData.gender || 'Unisex',
      stock: productData.stock ?? 10,
      sku: sku,
      rating: 5.0,
      reviews: [],
      tags: productData.tags || [],
      images: productData.images || ['/images/shoes/genesis_blue.png'],
      mainImage: productData.mainImage || (productData.images && productData.images[0]) || '/images/shoes/genesis_blue.png',
      isNewArrival: productData.isNewArrival ?? true,
      isBestSeller: productData.isBestSeller ?? false,
      isSale: productData.isSale ?? false
    };
    
    await saveProduct(newProduct);
  }
  
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function deleteProductAction(productId: string) {
  await requireAdmin();
  const success = await deleteProduct(productId);
  if (!success) return { success: false, error: 'Product not found.' };
  
  revalidatePath('/', 'layout');
  return { success: true };
}

// 4. Admin Order Management Actions
export async function updateOrderStatusAction(orderId: string, status: Order['status']) {
  await requireAdmin();
  const orders = await getOrdersList();
  const order = orders.find(o => o.id === orderId);
  if (!order) return { success: false, error: 'Order not found.' };
  
  order.status = status;
  await saveOrder(order);
  
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function deleteOrderAction(orderId: string) {
  await requireAdmin();
  const success = await deleteOrder(orderId);
  if (!success) return { success: false, error: 'Order not found.' };
  
  revalidatePath('/', 'layout');
  return { success: true };
}

// 5. Admin Stock Management Actions
export async function adjustStockAction(productId: string, quantityChange: number) {
  await requireAdmin();
  const product = await getProductById(productId);
  if (!product) return { success: false, error: 'Product not found.' };
  
  product.stock = Math.max(0, product.stock + quantityChange);
  await saveProduct(product);
  
  revalidatePath('/', 'layout');
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
  revalidatePath('/', 'layout');
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
  revalidatePath('/', 'layout');
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

  // Sanitizer helper to remove Amazon & Flipkart names and promotional text
  const sanitizeTextOfStoreBrands = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/amazon\.in/gi, '')
      .replace(/amazon\.com/gi, '')
      .replace(/amazon/gi, '')
      .replace(/flipkart\.com/gi, '')
      .replace(/flipkart assured/gi, '')
      .replace(/flipkart/gi, '')
      .replace(/buy\s+online\s+at\s+low\s+prices\s+in\s+india/gi, '')
      .replace(/at\s+low\s+prices/gi, '')
      .replace(/visit\s+the\s+store/gi, '')
      .replace(/on\s+sale\s+at/gi, '')
      .replace(/only\s+on/gi, '')
      .replace(/on\s+our\s+website/gi, '')
      .replace(/assured\s+quality/gi, '')
      .replace(/\s*\|\s*/g, ' ')
      .replace(/\s*-\s*/g, ' ')
      .replace(/\s*:\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  let finalUrl = cleanUrl;

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

        // Amazon image regexes (including landingImage and zoom/dynamic image parsing)
        const imgMatch = html.match(/id="landingImage"[^>]*src="([^"]+)"/i) ||
                         html.match(/id="main-image"[^>]*src="([^"]+)"/i) ||
                         html.match(/data-old-hires="([^"]+)"/i) ||
                         html.match(/meta name="twitter:image" content="([^"]+)"/i) ||
                         html.match(/<meta property="og:image" content="([^"]+)"/i) ||
                         html.match(/"large":"([^"]+)"/i);
        if (imgMatch) mainImage = imgMatch[1].trim();
        
        // Amazon brand regex
        const brandMatch = html.match(/<a id="bylineInfo"[^>]*>\s*Brand:\s*([^<]+)\s*<\/a>/i) ||
                           html.match(/Brand:\s*([^<]+)/i);
        if (brandMatch) brand = brandMatch[1].trim();
      } else {
        // Flipkart title regexes (OpenGraph, Twitter card, Class tags, H1, Title)
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) ||
                           html.match(/<meta name="twitter:title" content="([^"]+)"/i) ||
                           html.match(/<meta name="title" content="([^"]+)"/i) ||
                           html.match(/<span [^>]*class="[^"]*B_NuCI[^"]*"[^>]*>\s*([^<]+)\s*<\/span>/i) ||
                           html.match(/<span [^>]*class="[^"]*VU-423[^"]*"[^>]*>\s*([^<]+)\s*<\/span>/i) ||
                           html.match(/<span [^>]*class="[^"]*_2lT163[^"]*"[^>]*>\s*([^<]+)\s*<\/span>/i) ||
                           html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/i) ||
                           html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) title = titleMatch[1].trim();

        // Flipkart description regexes
        const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i) ||
                          html.match(/<meta name="description" content="([^"]+)"/i) ||
                          html.match(/<div [^>]*class="[^"]*_1mXERD[^"]*"[^>]*>\s*([^<]+)\s*<\/div>/i);
        if (descMatch) description = descMatch[1].trim();

        // Flipkart image regexes (OpenGraph, Twitter card, JSON-LD, Rukminim CDN)
        const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/i) ||
                         html.match(/<meta name="twitter:image" content="([^"]+)"/i) ||
                         html.match(/"image":\s*\[?"(https:\/\/rukminim[0-9]\.flixcart\.com\/image\/[^"]+)"/i) ||
                         html.match(/<img [^>]*src="(https:\/\/rukminim[0-9]\.flixcart\.com\/image\/[^"]+)"/i) ||
                         html.match(/<img [^>]*src="([^"]+)"[^>]*class="[^"]*_396cs4[^"]*"/i) ||
                         html.match(/<img [^>]*class="[^"]*_396cs4[^"]*"[^>]*src="([^"]+)"/i) ||
                         html.match(/<img [^>]*src="([^"]+)"[^>]*class="[^"]*_2r_l1t[^"]*"/i);
        if (imgMatch) mainImage = imgMatch[1].trim();

        // Flipkart brand regex
        const brandMatch = html.match(/<span [^>]*class="[^"]*G6XhY1[^"]*"[^>]*>\s*([^<]+)\s*<\/span>/i) ||
                           html.match(/<span [^>]*class="[^"]*m7-21p[^"]*"[^>]*>\s*([^<]+)\s*<\/span>/i) ||
                           html.match(/<span [^>]*class="[^"]*_2Wk1fc[^"]*"[^>]*>\s*([^<]+)\s*<\/span>/i);
        if (brandMatch) brand = brandMatch[1].trim();
      }

      // Upgrade Flipkart low-res image thumbnails to high-res (e.g. 128/128 -> 832/832)
      if (mainImage && mainImage.includes('rukminim')) {
        mainImage = mainImage.replace(/\/image\/\d+\/\d+\//, '/image/832/832/');
      }

      // Apply initial sanitization
      title = sanitizeTextOfStoreBrands(title);
      description = sanitizeTextOfStoreBrands(description);
      brand = sanitizeTextOfStoreBrands(brand);
    }
  } catch (scrapeErr) {
    console.error('Failed to parse URL html, invoking fallback parser:', scrapeErr);
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

  if (!mainImage || !mainImage.startsWith('http')) {
    // Choose a fallback base image based on category
    if (category.toLowerCase() === 'running') {
      mainImage = '/images/shoes/genesis_blue.png';
    } else if (category.toLowerCase() === 'sport') {
      mainImage = '/images/shoes/apex_black.png';
    } else if (category.toLowerCase() === 'casual') {
      mainImage = '/images/shoes/retro_white.png';
    } else {
      mainImage = '/images/shoes/horizon_light.png';
    }
  }

  // Create the new product object
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 6);
  const originalPrice = Math.round(targetPrice * 1.25);
  const discountPercentage = 20;

  // Derive available colors
  const availableColors = [
    { name: 'Royal Blue', hex: '#0a58ca', threeColor: '#0a58ca' },
    { name: 'Silver Shadow', hex: '#c0c0c0', threeColor: '#c0c0c0' },
    { name: 'Carbon Black', hex: '#111827', threeColor: '#111827' }
  ];

  const newProduct: Product = {
    id,
    name: title,
    brand: brand,
    category: category,
    description: description,
    price: targetPrice,
    originalPrice: originalPrice,
    discountPrice: targetPrice,
    discountPercentage: discountPercentage,
    availableSizes: [7, 8, 9, 10, 11],
    availableColors: availableColors,
    material: 'Engineered Synthetic Blend & Responsive Sole',
    gender: 'Unisex',
    stock: 20,
    sku: 'TR-IMP-' + Math.floor(100 + Math.random() * 900) + '-' + brand.substring(0, 3).toUpperCase(),
    rating: parseFloat((4.4 + Math.random() * 0.5).toFixed(1)),
    reviews: [
      { name: 'Aryan Shah', rating: 5, comment: 'Imported product verification: Elite build quality and responsive sole profile.', date: new Date().toISOString().split('T')[0] }
    ],
    tags: ['Imported', brand, category],
    images: [mainImage],
    mainImage: mainImage,
    isNewArrival: true,
    isBestSeller: false,
    isSale: true
  };

  await saveProduct(newProduct);

  revalidatePath('/', 'layout');
  revalidatePath('/shop');

  return { success: true, product: newProduct };
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
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function deleteCouponAction(code: string) {
  await requireAdmin();
  const { deleteCoupon } = await import('@/lib/db');
  const success = await deleteCoupon(code);
  revalidatePath('/', 'layout');
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

  revalidatePath('/product/' + productId);
  revalidatePath('/shop');
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



