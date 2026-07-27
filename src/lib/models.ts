import mongoose, { Schema } from 'mongoose';

// 1. Product Schema
const ReviewSchema = new Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  date: { type: String, required: true }
});

const ColorSchema = new Schema({
  name: { type: String, required: true },
  hex: { type: String, required: true },
  threeColor: { type: String, required: true }
});

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
  isSale: { type: Boolean, required: true, default: false }
}, { timestamps: true });

// 2. Order Schema
const OrderItemSchema = new Schema({
  productId: { type: String, required: true },
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
  deliveryCharges: { type: Number, required: true },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'],
    default: 'Pending'
  },
  date: { type: String, required: true }
}, { timestamps: true });

// 3. Customer Schema
const CustomerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  phone: { type: String, required: true, index: true },
  address: AddressSchema,
  totalOrders: { type: Number, required: true, default: 0 },
  totalSpending: { type: Number, required: true, default: 0 },
  registrationDate: { type: String, required: true }
}, { timestamps: true });

// 4. Website Content Schema
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

// Prevent overwrite compilation errors in development
export const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export const CustomerModel = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
export const WebsiteContentModel = mongoose.models.WebsiteContent || mongoose.model('WebsiteContent', WebsiteContentSchema);
