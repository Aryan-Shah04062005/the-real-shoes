import mongoose, { Schema } from 'mongoose';

// 1. Review Schema
const ReviewSchema = new Schema({
  id: { type: String },
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  date: { type: String, required: true },
  verifiedPurchase: { type: Boolean, default: true },
  image: { type: String }
});

const ColorSchema = new Schema({
  name: { type: String, required: true },
  hex: { type: String, required: true },
  threeColor: { type: String, required: true }
});

// 2. Product Schema
const ProductSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  discountPrice: { type: Number, required: true },
  discountPercentage: { type: Number, required: true },
  availableSizes: [{ type: Number }],
  availableColors: [ColorSchema],
  material: { type: String, required: true },
  gender: { type: String, required: true },
  stock: { type: Number, required: true },
  sku: { type: String, required: true, unique: true },
  rating: { type: Number, required: true, default: 5 },
  reviews: [ReviewSchema],
  tags: [{ type: String }],
  images: [{ type: String }],
  mainImage: { type: String, required: true },
  isNewArrival: { type: Boolean, required: true, default: false },
  isBestSeller: { type: Boolean, required: true, default: false },
  isTrending: { type: Boolean, required: true, default: false },
  isFeatured: { type: Boolean, required: true, default: false },
  isSale: { type: Boolean, required: true, default: false },
  status: { type: String, enum: ['ACTIVE', 'DRAFT', 'HIDDEN', 'OUT_OF_STOCK', 'ARCHIVED'], default: 'ACTIVE' },
  sourcePlatform: { type: String, enum: ['AMAZON', 'FLIPKART', 'MANUAL', 'THE_REAL'], default: 'THE_REAL' },
  sourceUrl: { type: String },
  sourceProductId: { type: String },
  sourcePrice: { type: Number },
  sizeStock: { type: Map, of: Number },
  updatedAt: { type: String }
}, { timestamps: true });

// 3. Order Item Schema
const OrderItemSchema = new Schema({
  productId: { type: String, required: true },
  customizationId: { type: String },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  size: { type: Number, required: true },
  color: { type: String, required: true },
  colorHex: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
});

const AddressSchema = new Schema({
  flat: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true }
});

// 4. Order Schema
const OrderSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: AddressSchema,
  landmark: { type: String },
  notes: { type: String },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, required: true, default: 0 },
  couponCode: { type: String },
  deliveryCharges: { type: Number, required: true },
  total: { type: Number, required: true },
  paymentMethod: { type: String, default: 'COD' },
  paymentStatus: { type: String, default: 'Pending' },
  status: { 
    type: String, 
    required: true, 
    enum: ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Pending'
  },
  date: { type: String, required: true }
}, { timestamps: true });

// 5. Customer Schema
const CustomerSchema = new Schema({
  id: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, index: true, unique: true },
  password: { type: String },
  phone: { type: String, required: true },
  address: AddressSchema,
  savedAddresses: [AddressSchema],
  wishlist: [{ type: String }],
  totalOrders: { type: Number, required: true, default: 0 },
  totalSpending: { type: Number, required: true, default: 0 },
  registrationDate: { type: String, required: true }
}, { timestamps: true });

// 6. Coupon Schema
const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number },
  expiryDate: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 7. Custom Shoe Schema
const CustomShoeSchema = new Schema({
  customizationId: { type: String, required: true, unique: true },
  upperColor: { type: String, required: true },
  soleColor: { type: String, required: true },
  laceColor: { type: String, required: true },
  logoColor: { type: String, required: true },
  calculatedPrice: { type: Number, required: true },
  createdAt: { type: String, required: true }
}, { timestamps: true });

// 8. Website Content Schema
const PoliciesSchema = new Schema({
  shipping: { type: String, required: true },
  returns: { type: String, required: true },
  privacy: { type: String, required: true },
  terms: { type: String, required: true }
});

const WebsiteContentSchema = new Schema({
  heroTitle: { type: String, required: true },
  heroSubtitle: { type: String, required: true },
  heroTagline: { type: String, required: true },
  aboutText: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true },
  contactAddress: { type: String, required: true },
  policies: PoliciesSchema
}, { timestamps: true });

// 9. Audit Log Schema
const AuditLogSchema = new Schema({
  id: { type: String, required: true, unique: true },
  admin: { type: String, required: true },
  action: { type: String, required: true },
  target: { type: String, required: true },
  details: { type: String },
  timestamp: { type: String, required: true }
}, { timestamps: true });

export const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export const CustomerModel = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
export const CouponModel = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
export const CustomShoeModel = mongoose.models.CustomShoe || mongoose.model('CustomShoe', CustomShoeSchema);
export const WebsiteContentModel = mongoose.models.WebsiteContent || mongoose.model('WebsiteContent', WebsiteContentSchema);
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
