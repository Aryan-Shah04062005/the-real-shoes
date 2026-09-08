'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DatabaseSchema, Product, Order, Customer, WebsiteContent, AuditLog } from '@/lib/db';
import {
  saveProductAction,
  deleteProductAction,
  archiveProductAction,
  restoreProductAction,
  bulkProductAction,
  getAuditLogsAction,
  updateOrderStatusAction,
  deleteOrderAction,
  adjustStockAction,
  updateWebsiteContentAction,
  logoutAdminAction,
  importProductFromUrlAction,
  uploadProductImageAction
} from '@/app/actions';
import {
  BarChart2,
  Package,
  ShoppingBag,
  Users,
  Layers,
  Settings,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  TrendingUp,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Info,
  DollarSign,
  Compass,
  Search,
  Eye,
  Minus,
  Upload,
  ShieldCheck,
  RefreshCw,
  Archive,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';

interface DashboardClientProps {
  initialDb: DatabaseSchema;
}

type TabType = 'overview' | 'products' | 'orders' | 'customers' | 'inventory' | 'cms' | 'audit_logs';

export default function DashboardClient({ initialDb }: DashboardClientProps) {
  const [db, setDb] = useState<DatabaseSchema>(initialDb);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Search & Filter states inside products tab
  const [productSearch, setProductSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');

  // Search states inside other tabs
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Bulk selection state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Active product edit state
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Delete confirmation modal state
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null);

  // Active order details overlay
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Status message overlays
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Importer states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importPrice, setImportPrice] = useState<string>('');
  const [importCategory, setImportCategory] = useState<string>('Running');
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  // Import Preview Modal state
  const [importPreviewProduct, setImportPreviewProduct] = useState<Partial<Product> | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{ duplicateProduct: Product; newPreview: Partial<Product> } | null>(null);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Color manager state
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#0a58ca');

  // Fetch audit logs when tab is selected
  useEffect(() => {
    if (activeTab === 'audit_logs') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const logs = await getAuditLogsAction();
      setAuditLogs(logs);
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const triggerStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const syncLocalState = (updatedSchema: Partial<DatabaseSchema>) => {
    setDb((prev) => ({
      ...prev,
      ...updatedSchema,
    }));
  };

  const handleLogout = async () => {
    await logoutAdminAction();
    window.dispatchEvent(new Event('admin-login-changed'));
    window.location.href = '/';
  };

  // Color Management Helpers
  const handleAddColor = () => {
    if (!editingProduct || !newColorName.trim()) {
      triggerStatus('error', 'Please enter a color name.');
      return;
    }
    const colorObj = {
      name: newColorName.trim(),
      hex: newColorHex,
      threeColor: newColorHex,
    };
    const currentColors = editingProduct.availableColors || [];
    setEditingProduct({
      ...editingProduct,
      availableColors: [...currentColors, colorObj]
    });
    setNewColorName('');
    setNewColorHex('#0a58ca');
    triggerStatus('success', `Added color "${colorObj.name}"`);
  };

  const handleRemoveColor = (indexToRemove: number) => {
    if (!editingProduct) return;
    const currentColors = editingProduct.availableColors || [];
    if (currentColors.length <= 1) {
      triggerStatus('error', 'A product must have at least one colorway.');
      return;
    }
    const updated = currentColors.filter((_, idx) => idx !== indexToRemove);
    setEditingProduct({
      ...editingProduct,
      availableColors: updated
    });
  };

  // Size stock adjustment helper
  const handleSizeStockChange = (size: number, stockQty: number) => {
    if (!editingProduct) return;
    const currentSizeStock = { ...(editingProduct.sizeStock || {}) };
    currentSizeStock[size] = Math.max(0, stockQty);

    const totalStock = Object.values(currentSizeStock).reduce((sum, val) => sum + (val || 0), 0);

    const sizesSet = new Set(editingProduct.availableSizes || []);
    if (stockQty > 0) {
      sizesSet.add(size);
    }
    const updatedAvailableSizes = Array.from(sizesSet).sort((a, b) => a - b);

    setEditingProduct({
      ...editingProduct,
      sizeStock: currentSizeStock,
      stock: totalStock,
      availableSizes: updatedAvailableSizes
    });
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      try {
        const response = await uploadProductImageAction(base64Data, file.name);
        if (response.success && response.url) {
          setEditingProduct((prev: any) => {
            if (!prev) return null;
            return {
              ...prev,
              mainImage: response.url,
              images: [response.url, ...(prev.images?.slice(1) || [])]
            };
          });
          triggerStatus('success', 'Image uploaded successfully!');
        } else {
          triggerStatus('error', response.error || 'Failed to upload image.');
        }
      } catch (err) {
        console.error(err);
        triggerStatus('error', 'Error uploading file.');
      } finally {
        setImageUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Import Product submit
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl || !importUrl.trim()) {
      setImportStatus('error');
      setImportMessage('Please provide a valid product URL.');
      return;
    }
    const targetPrice = Number(importPrice);
    if (isNaN(targetPrice) || targetPrice <= 0) {
      setImportStatus('error');
      setImportMessage('Please specify a valid target price.');
      return;
    }

    setImportStatus('loading');
    setImportMessage('Connecting to store and scraping product data...');

    try {
      const response = await importProductFromUrlAction(importUrl, targetPrice, importCategory);
      if (response.success) {
        setImportStatus('idle');
        setImportMessage('');
        setIsImportModalOpen(false);

        if (response.isDuplicate && response.duplicateProduct) {
          setDuplicateWarning({
            duplicateProduct: response.duplicateProduct,
            newPreview: response.preview || {
              name: response.duplicateProduct.name,
              brand: response.duplicateProduct.brand,
              price: targetPrice,
              mainImage: response.duplicateProduct.mainImage
            }
          });
        } else if (response.preview) {
          setImportPreviewProduct(response.preview);
        }
      } else {
        setImportStatus('error');
        setImportMessage(response.error || 'Failed to parse product. Check URL and try again.');
      }
    } catch (err) {
      console.error(err);
      setImportStatus('error');
      setImportMessage('An error occurred during scraping.');
    }
  };

  // Publish imported product from preview modal
  const handlePublishImportPreview = async () => {
    if (!importPreviewProduct) return;
    setIsSubmitting(true);

    const res = await saveProductAction({
      ...importPreviewProduct,
      status: 'ACTIVE'
    });
    setIsSubmitting(false);

    if (res.success && res.product) {
      triggerStatus('success', `Product "${res.product.name}" imported and published successfully!`);
      setDb(prev => ({
        ...prev,
        products: [res.product, ...prev.products]
      }));
      setImportPreviewProduct(null);
      setImportUrl('');
      setImportPrice('');
    } else {
      triggerStatus('error', res.error || 'Failed to publish product.');
    }
  };

  // Product Save action
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSubmitting(true);

    const res = await saveProductAction(editingProduct);
    setIsSubmitting(false);

    if (res.success && res.product) {
      triggerStatus('success', 'Product saved successfully!');
      
      const nextProducts = [...db.products];
      const idx = nextProducts.findIndex(p => p.id === res.product.id);
      if (idx > -1) {
        nextProducts[idx] = res.product;
      } else {
        nextProducts.unshift(res.product);
      }
      syncLocalState({ products: nextProducts });
      setEditingProduct(null);
      setIsAddingNew(false);
    } else {
      triggerStatus('error', res.error || 'Failed to save product.');
    }
  };

  // Delete product action (soft-archive vs hard delete handled by backend)
  const handleConfirmDeleteProduct = async () => {
    if (!deleteModalProduct) return;
    setIsSubmitting(true);

    const res = await deleteProductAction(deleteModalProduct.id);
    setIsSubmitting(false);

    if (res.success) {
      if (res.mode === 'archived') {
        triggerStatus('success', 'Product deleted from storefront. (Safely ARCHIVED in Admin as it was referenced in customer orders).');
        setDb(prev => ({
          ...prev,
          products: prev.products.map(p => p.id === deleteModalProduct.id ? { ...p, status: 'ARCHIVED' } : p)
        }));
      } else {
        triggerStatus('success', 'Product deleted successfully.');
        setDb(prev => ({
          ...prev,
          products: prev.products.filter(p => p.id !== deleteModalProduct.id)
        }));
      }
      setDeleteModalProduct(null);
      setSelectedProductIds(prev => prev.filter(id => id !== deleteModalProduct.id));
    } else {
      triggerStatus('error', res.error || 'Failed to delete product.');
    }
  };

  // Restore product action
  const handleRestoreProduct = async (id: string) => {
    setIsSubmitting(true);
    const res = await restoreProductAction(id);
    setIsSubmitting(false);

    if (res.success) {
      triggerStatus('success', 'Product restored to ACTIVE status and storefront!');
      setDb(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === id ? { ...p, status: 'ACTIVE' } : p)
      }));
    } else {
      triggerStatus('error', res.error || 'Failed to restore product.');
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: 'archive' | 'delete' | 'status', payload?: any) => {
    if (selectedProductIds.length === 0) return;

    if (action === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedProductIds.length} selected products?`)) return;
    }

    setIsSubmitting(true);
    const res = await bulkProductAction(action, selectedProductIds, payload);
    setIsSubmitting(false);

    if (res.success) {
      triggerStatus('success', `Bulk action completed on ${res.count} products.`);
      
      if (action === 'delete') {
        setDb(prev => ({
          ...prev,
          products: prev.products.filter(p => !selectedProductIds.includes(p.id))
        }));
      } else if (action === 'archive') {
        setDb(prev => ({
          ...prev,
          products: prev.products.map(p => selectedProductIds.includes(p.id) ? { ...p, status: 'ARCHIVED' } : p)
        }));
      } else if (action === 'status' && payload?.status) {
        setDb(prev => ({
          ...prev,
          products: prev.products.map(p => selectedProductIds.includes(p.id) ? { ...p, status: payload.status } : p)
        }));
      }
      setSelectedProductIds([]);
    } else {
      triggerStatus('error', res.error || 'Bulk action failed.');
    }
  };

  // Order actions
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    const res = await updateOrderStatusAction(orderId, status);
    if (res.success) {
      triggerStatus('success', `Order status updated to ${status}`);
      const nextOrders = db.orders.map(o => o.id === orderId ? { ...o, status } : o);
      syncLocalState({ orders: nextOrders });
      if (viewingOrder?.id === orderId) {
        setViewingOrder(prev => prev ? { ...prev, status } : null);
      }
    } else {
      triggerStatus('error', res.error || 'Failed to update order status.');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const res = await deleteOrderAction(orderId);
    if (res.success) {
      triggerStatus('success', 'Order record deleted.');
      syncLocalState({
        orders: db.orders.filter(o => o.id !== orderId)
      });
      setViewingOrder(null);
    } else {
      triggerStatus('error', res.error || 'Failed to delete order.');
    }
  };

  // Stock Adjustments
  const handleAdjustStock = async (productId: string, change: number) => {
    const res = await adjustStockAction(productId, change);
    if (res.success) {
      const nextProducts = db.products.map(p => {
        if (p.id === productId) {
          return { ...p, stock: Math.max(0, p.stock + change) };
        }
        return p;
      });
      syncLocalState({ products: nextProducts });
      triggerStatus('success', 'Inventory level updated.');
    } else {
      triggerStatus('error', res.error || 'Failed to adjust stock.');
    }
  };

  // CMS
  const [cmsForm, setCmsForm] = useState<WebsiteContent>(db.websiteContent);
  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await updateWebsiteContentAction(cmsForm);
    setIsSubmitting(false);

    if (res.success) {
      triggerStatus('success', 'Website settings saved.');
      syncLocalState({ websiteContent: cmsForm });
    } else {
      triggerStatus('error', 'Failed to save website configurations.');
    }
  };

  // COMPUTED STATS
  const stats = useMemo(() => {
    const totalProducts = db.products.length;
    const totalOrders = db.orders.length;
    const pendingOrders = db.orders.filter(o => o.status === 'Pending').length;
    const completedOrders = db.orders.filter(o => o.status === 'Delivered').length;
    const cancelledOrders = db.orders.filter(o => o.status === 'Cancelled').length;
    const totalCustomers = db.customers.length;
    const totalSales = db.orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    const lowStockCount = db.products.filter(p => p.stock <= 5).length;
    const archivedCount = db.products.filter(p => p.status === 'ARCHIVED').length;

    return {
      totalProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalCustomers,
      totalSales,
      lowStockCount,
      archivedCount
    };
  }, [db]);

  // Dynamic filter products list
  const filteredProductsList = useMemo(() => {
    let list = [...db.products];

    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter(p => (p.status || 'ACTIVE') === statusFilter);
    }

    if (sourceFilter !== 'ALL') {
      list = list.filter(p => (p.sourcePlatform || 'Manual') === sourceFilter);
    }

    if (categoryFilter !== 'ALL') {
      list = list.filter(p => p.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (brandFilter !== 'ALL') {
      list = list.filter(p => p.brand.toLowerCase() === brandFilter.toLowerCase());
    }

    return list;
  }, [db.products, productSearch, statusFilter, sourceFilter, categoryFilter, brandFilter]);

  const uniqueBrandsList = useMemo(() => {
    return Array.from(new Set(db.products.map(p => p.brand).filter(Boolean)));
  }, [db.products]);

  const uniqueCategoriesList = useMemo(() => {
    return Array.from(new Set(db.products.map(p => p.category).filter(Boolean)));
  }, [db.products]);

  const filteredOrdersList = useMemo(() => {
    if (!orderSearch.trim()) return db.orders;
    const q = orderSearch.toLowerCase();
    return db.orders.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.phone.includes(q)
    );
  }, [db.orders, orderSearch]);

  const filteredCustomersList = useMemo(() => {
    if (!customerSearch.trim()) return db.customers;
    const q = customerSearch.toLowerCase();
    return db.customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }, [db.customers, customerSearch]);

  const filteredAuditLogsList = useMemo(() => {
    if (!auditSearch.trim()) return auditLogs;
    const q = auditSearch.toLowerCase();
    return auditLogs.filter(log =>
      (log.admin || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.target || '').toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q)
    );
  }, [auditLogs, auditSearch]);

  // Toggle selection for bulk actions
  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProductsList.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProductsList.map(p => p.id));
    }
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row h-full min-h-screen text-slate-300">
      {/* SIDEBAR */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-premium-black flex flex-col justify-between py-4 md:py-6 shrink-0">
        <div className="space-y-4 md:space-y-6">
          {/* Logo segment */}
          <div className="px-4 md:px-6 pb-2 md:pb-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <span className="text-base md:text-lg font-black tracking-widest text-white uppercase block">THE REAL HQ</span>
              <span className="text-[10px] text-slate-500 font-light uppercase tracking-wider block">Control Console</span>
            </div>
            <button
              onClick={handleLogout}
              className="md:hidden flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold text-red-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:block space-y-1 px-4">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart2 },
              { id: 'products', name: 'Products', icon: Package, count: stats.archivedCount > 0 ? stats.archivedCount : undefined },
              { id: 'orders', name: 'Orders', icon: ShoppingBag, count: stats.pendingOrders },
              { id: 'customers', name: 'Customers', icon: Users },
              { id: 'inventory', name: 'Inventory', icon: Layers, count: stats.lowStockCount },
              { id: 'cms', name: 'Website CMS', icon: Settings },
              { id: 'audit_logs', name: 'Audit Logs', icon: ShieldCheck }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setEditingProduct(null);
                    setViewingOrder(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                    active ? 'bg-royal-blue text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4.5 w-4.5" />
                    {tab.name}
                  </span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${active ? 'bg-white text-royal-blue' : 'bg-royal-blue/20 text-royal-blue'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile Horizontal Pill Menu */}
          <nav className="flex md:hidden overflow-x-auto gap-2 px-4 pb-2">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart2 },
              { id: 'products', name: 'Products', icon: Package },
              { id: 'orders', name: 'Orders', icon: ShoppingBag, count: stats.pendingOrders },
              { id: 'customers', name: 'Customers', icon: Users },
              { id: 'inventory', name: 'Inventory', icon: Layers, count: stats.lowStockCount },
              { id: 'cms', name: 'CMS', icon: Settings },
              { id: 'audit_logs', name: 'Audit', icon: ShieldCheck }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setEditingProduct(null);
                    setViewingOrder(null);
                  }}
                  className={`flex items-center gap-2 shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${
                    active ? 'bg-royal-blue text-white shadow-md' : 'border border-white/10 bg-white/5 text-slate-400'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.name}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.2 text-[8px] font-bold ${active ? 'bg-white text-royal-blue' : 'bg-royal-blue text-white'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Bottom controls */}
        <div className="hidden md:block px-4 pt-6 border-t border-white/5 space-y-4">
          <div className="px-4 text-[10px] text-slate-500">
            <span>Signed: <strong className="text-slate-300 font-semibold">Aryan</strong></span>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout Session
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 bg-premium-dark p-6 sm:p-8 overflow-y-auto space-y-6">
        {/* Toast status alert */}
        {statusMessage && (
          <div className={`fixed top-6 right-6 z-50 rounded-2xl border px-6 py-4 flex items-center gap-3 shadow-2xl backdrop-blur-md transition-all ${
            statusMessage.type === 'success' ? 'border-green-500/30 bg-green-500/15 text-green-400' : 'border-red-500/30 bg-red-500/15 text-red-400'
          }`}>
            <CheckCircle className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">{statusMessage.text}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 text-left">
            <h2 className="text-xl font-black text-white uppercase tracking-wider">CONSOLE OVERVIEW</h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Sales</span>
                <span className="text-2xl font-black text-white block mt-2">₹{stats.totalSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Orders</span>
                <span className="text-2xl font-black text-royal-blue block mt-2">{stats.totalOrders}</span>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Low Stock Alert</span>
                <span className={`text-2xl font-black block mt-2 ${stats.lowStockCount > 0 ? 'text-orange-500' : 'text-slate-400'}`}>
                  {stats.lowStockCount}
                </span>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Customers</span>
                <span className="text-2xl font-black text-white block mt-2">{stats.totalCustomers}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue Summary</h3>
                <div className="h-64 w-full flex items-end justify-between pt-8 px-4 border-b border-slate-800">
                  {[
                    { month: 'Jan', val: 0.15 },
                    { month: 'Feb', val: 0.25 },
                    { month: 'Mar', val: 0.45 },
                    { month: 'Apr', val: 0.35 },
                    { month: 'May', val: 0.60 },
                    { month: 'Jun', val: 0.80 },
                    { month: 'Jul', val: 1.00 }
                  ].map((bar, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-grow mx-1">
                      <div className="w-full bg-slate-900 rounded-t-lg relative overflow-hidden" style={{ height: '180px' }}>
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-royal-blue to-cyan-500 rounded-t-lg"
                          style={{ height: `${bar.val * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{bar.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 glass-panel rounded-2xl p-6 border border-white/10 space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order States</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-4 w-4 text-royal-blue" />
                      Pending Validation
                    </span>
                    <span className="text-white font-bold">{stats.pendingOrders}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-400">
                      <Truck className="h-4 w-4 text-royal-blue" />
                      Completed Shipments
                    </span>
                    <span className="text-white font-bold">{stats.completedOrders}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-400">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Cancelled Orders
                    </span>
                    <span className="text-white font-bold">{stats.cancelledOrders}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS CRUD */}
        {activeTab === 'products' && (
          <div className="space-y-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">PRODUCT INVENTORY</h2>
                <span className="text-xs text-slate-500">Manage descriptions, size-level stock, status & import platform links</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => {
                    setImportUrl('');
                    setImportPrice('');
                    setImportCategory('Running');
                    setImportStatus('idle');
                    setImportMessage('');
                    setIsImportModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-200 transition-all"
                >
                  <Compass className="h-4 w-4 text-royal-blue" />
                  Import from Amazon/Flipkart
                </button>
                <button
                  onClick={() => {
                    setEditingProduct({
                      name: '',
                      brand: 'THE REAL',
                      category: 'Running',
                      status: 'ACTIVE',
                      description: '',
                      price: 9999,
                      originalPrice: 11999,
                      availableSizes: [7, 8, 9, 10, 11],
                      sizeStock: { 7: 2, 8: 3, 9: 3, 10: 2 },
                      availableColors: [{ name: 'Royal Blue', hex: '#0a58ca', threeColor: '#0a58ca' }],
                      material: 'Flyknit',
                      gender: 'Unisex',
                      stock: 10,
                      tags: [],
                      images: ['/images/shoes/genesis_blue.png'],
                      mainImage: '/images/shoes/genesis_blue.png',
                      isNewArrival: true,
                      isBestSeller: false,
                      isSale: false
                    });
                    setIsAddingNew(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-royal-blue hover:bg-royal-blue-hover px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </button>
              </div>
            </div>

            {/* PRODUCT EDIT FORM DRAWER */}
            {editingProduct && (
              <div className="glass-panel rounded-2xl p-6 border border-white/15 bg-slate-900/90 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-royal-blue">
                    {isAddingNew ? 'NEW PRODUCT CREATION' : `EDIT PRODUCT: ${editingProduct.name}`}
                  </h3>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setIsAddingNew(false);
                    }}
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Product Name</label>
                      <input
                        type="text"
                        required
                        value={editingProduct.name || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Brand</label>
                      <input
                        type="text"
                        required
                        value={editingProduct.brand || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Category</label>
                      <select
                        value={editingProduct.category || 'Running'}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white"
                      >
                        <option value="Running">Running</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Sport">Sport</option>
                        <option value="Casual">Casual</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Status</label>
                      <select
                        value={editingProduct.status || 'ACTIVE'}
                        onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white font-bold"
                      >
                        <option value="ACTIVE">ACTIVE (Visible on Storefront)</option>
                        <option value="DRAFT">DRAFT (Admin Only)</option>
                        <option value="HIDDEN">HIDDEN (Direct Link Only)</option>
                        <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                        <option value="ARCHIVED">ARCHIVED (Discontinued)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Selling Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={editingProduct.price || 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Original Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={editingProduct.originalPrice || 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Calculated Discount %</label>
                      <div className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-green-400 font-bold">
                        {editingProduct.originalPrice && editingProduct.originalPrice > (editingProduct.price || 0)
                          ? `${Math.round(((editingProduct.originalPrice - (editingProduct.price || 0)) / editingProduct.originalPrice) * 100)}% OFF`
                          : '0% OFF'}
                      </div>
                    </div>
                  </div>

                  {/* Size-Level Inventory Breakdown */}
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-2">
                      Size-Level Inventory Breakdown (Auto-sums Total Stock: <span className="text-white font-bold">{editingProduct.stock ?? 0}</span>)
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                      {[6, 7, 8, 9, 10, 11, 12].map((size) => {
                        const qty = editingProduct.sizeStock?.[size] ?? 0;
                        return (
                          <div key={size} className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">UK {size}</span>
                            <input
                              type="number"
                              min="0"
                              value={qty}
                              onChange={(e) => handleSizeStockChange(size, Number(e.target.value))}
                              className="w-full text-center rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs font-bold text-white focus:border-royal-blue focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Product Main Image URL / Upload</label>
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                      <div className="flex-grow">
                        <input
                          type="text"
                          required
                          placeholder="Paste image link (e.g. https://...)"
                          value={editingProduct.mainImage || ''}
                          onChange={(e) => {
                            let newUrl = e.target.value.trim();
                            if (newUrl && !newUrl.startsWith('http://') && !newUrl.startsWith('https://') && !newUrl.startsWith('/')) {
                              newUrl = 'https://' + newUrl;
                            }
                            setEditingProduct({ 
                              ...editingProduct, 
                              mainImage: newUrl,
                              images: [newUrl, ...(editingProduct.images?.slice(1) || [])]
                            });
                          }}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white placeholder-slate-500"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="product-image-file"
                        />
                        <label
                          htmlFor="product-image-file"
                          className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-all w-full sm:w-auto text-center"
                        >
                          <Upload className="h-4 w-4" />
                          {imageUploading ? 'Uploading...' : 'Upload File'}
                        </label>
                      </div>
                    </div>

                    {editingProduct.mainImage && (
                      <div className="mt-2.5 flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="h-16 w-16 rounded-lg bg-black/60 p-1 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                          <img 
                            src={editingProduct.mainImage} 
                            alt="Live Preview" 
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/images/shoes/genesis_blue.png';
                            }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-300 truncate flex-grow">
                          <span className="font-bold text-white block">Live Image Preview</span>
                          <span className="text-slate-400 font-mono text-[10px] truncate block">{editingProduct.mainImage}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Colors */}
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-2">
                      Available Colors ({editingProduct.availableColors?.length || 0})
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editingProduct.availableColors?.map((color, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white">
                          <span className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-sm shrink-0" style={{ backgroundColor: color.hex }} />
                          <span className="font-semibold">{color.name}</span>
                          <button type="button" onClick={() => handleRemoveColor(idx)} className="ml-1 text-slate-400 hover:text-red-400">
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2">
                        <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
                        <input type="text" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} className="w-24 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs text-white font-mono" />
                      </div>
                      <input
                        type="text"
                        placeholder="Color Name (e.g. Royal Blue)"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        className="flex-grow rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-white"
                      />
                      <button type="button" onClick={handleAddColor} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-royal-blue hover:bg-royal-blue-hover px-4 py-1.5 text-xs font-bold text-white transition-all shrink-0">
                        <Plus className="h-3.5 w-3.5" />
                        Add Color
                      </button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-6 flex-wrap border-t border-white/5 pt-4">
                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={editingProduct.isNewArrival || false} onChange={(e) => setEditingProduct({ ...editingProduct, isNewArrival: e.target.checked })} className="h-4 w-4 rounded border-white/10 bg-white/5 text-royal-blue" />
                      New Arrival Badge
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={editingProduct.isBestSeller || false} onChange={(e) => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })} className="h-4 w-4 rounded border-white/10 bg-white/5 text-royal-blue" />
                      Best Seller Badge
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={editingProduct.isSale || false} onChange={(e) => setEditingProduct({ ...editingProduct, isSale: e.target.checked })} className="h-4 w-4 rounded border-white/10 bg-white/5 text-royal-blue" />
                      On Sale Badge
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setIsAddingNew(false);
                      }}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-xl bg-royal-blue hover:bg-royal-blue-hover px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Product'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PRODUCT FILTERS & BULK ACTIONS TOOLBAR */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, SKU, brand..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white"
                  />
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white font-semibold"
                  >
                    <option value="ALL">Status: All Items</option>
                    <option value="ACTIVE">Status: ACTIVE</option>
                    <option value="DRAFT">Status: DRAFT</option>
                    <option value="HIDDEN">Status: HIDDEN</option>
                    <option value="OUT_OF_STOCK">Status: OUT OF STOCK</option>
                    <option value="ARCHIVED">Status: ARCHIVED</option>
                  </select>
                </div>

                {/* Source Filter */}
                <div>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white font-semibold"
                  >
                    <option value="ALL">Source: All Platforms</option>
                    <option value="Manual">Source: Manual Entry</option>
                    <option value="Amazon">Source: Amazon</option>
                    <option value="Flipkart">Source: Flipkart</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white font-semibold"
                  >
                    <option value="ALL">Category: All</option>
                    {uniqueCategoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div>
                  <select
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white font-semibold"
                  >
                    <option value="ALL">Brand: All</option>
                    {uniqueBrandsList.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bulk Action Bar (Visible when items selected) */}
              {selectedProductIds.length > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-royal-blue/30 bg-royal-blue/10 p-3 text-xs text-white animate-fade-in">
                  <div className="flex items-center gap-3 font-bold">
                    <CheckSquare className="h-4 w-4 text-royal-blue" />
                    <span>{selectedProductIds.length} items selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBulkAction('archive')}
                      className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-[11px] font-bold text-amber-400 hover:bg-amber-500/30"
                    >
                      Bulk Archive
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="rounded-lg bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-[11px] font-bold text-red-400 hover:bg-red-500/30"
                    >
                      Bulk Delete
                    </button>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBulkAction('status', { status: e.target.value });
                          e.target.value = '';
                        }
                      }}
                      className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white"
                    >
                      <option value="">Set Status...</option>
                      <option value="ACTIVE">Set to ACTIVE</option>
                      <option value="DRAFT">Set to DRAFT</option>
                      <option value="HIDDEN">Set to HIDDEN</option>
                      <option value="OUT_OF_STOCK">Set to OUT OF STOCK</option>
                      <option value="ARCHIVED">Set to ARCHIVED</option>
                    </select>
                    <button
                      onClick={() => setSelectedProductIds([])}
                      className="text-slate-400 hover:text-white px-2 py-1 text-xs"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
              )}

              {/* Product table */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-premium-dark/40">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 border-b border-white/10 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                    <tr>
                      <th className="px-4 py-4 text-center">
                        <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                          {selectedProductIds.length === filteredProductsList.length && filteredProductsList.length > 0 ? (
                            <CheckSquare className="h-4 w-4 text-royal-blue" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4">Sneaker / Brand</th>
                      <th className="px-4 py-4">SKU / Platform</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4 text-right">Price</th>
                      <th className="px-4 py-4 text-center">Stock</th>
                      <th className="px-4 py-4 text-center">Badges</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredProductsList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                          No products found matching filters.
                        </td>
                      </tr>
                    ) : (
                      filteredProductsList.map((product) => {
                        const isSelected = selectedProductIds.includes(product.id);
                        const status = product.status || 'ACTIVE';

                        return (
                          <tr key={product.id} className={`hover:bg-white/5 ${isSelected ? 'bg-royal-blue/10' : ''}`}>
                            <td className="px-4 py-4 text-center">
                              <button onClick={() => toggleSelectProduct(product.id)} className="text-slate-400 hover:text-white">
                                {isSelected ? <CheckSquare className="h-4 w-4 text-royal-blue" /> : <Square className="h-4 w-4" />}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-black/60 p-1 flex items-center justify-center shrink-0 border border-white/10">
                                  <img src={product.mainImage || '/images/shoes/genesis_blue.png'} alt={product.name} className="h-full w-full object-contain" />
                                </div>
                                <div>
                                  <span className="font-bold text-white uppercase block">{product.name}</span>
                                  <span className="text-[10px] text-slate-400">{product.brand} &bull; {product.category}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="space-y-0.5">
                                <span className="text-royal-blue font-mono font-medium block">{product.sku}</span>
                                {product.sourcePlatform && (
                                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">
                                    {product.sourcePlatform}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                status === 'ACTIVE'
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                  : status === 'ARCHIVED'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : status === 'OUT_OF_STOCK'
                                  ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right font-bold text-white">₹{product.price.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-4 text-center">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                product.stock === 0 ? 'bg-red-500/10 text-red-500' : product.stock <= 5 ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex justify-center gap-1.5 flex-wrap">
                                {product.isNewArrival && <span className="rounded bg-royal-blue/15 border border-royal-blue/20 text-royal-blue px-1.5 py-0.2 text-[8px] font-bold">NEW</span>}
                                {product.isBestSeller && <span className="rounded bg-amber-500/15 border border-amber-500/20 text-amber-500 px-1.5 py-0.2 text-[8px] font-bold">BEST</span>}
                                {product.isSale && <span className="rounded bg-red-500/15 border border-red-500/20 text-red-500 px-1.5 py-0.2 text-[8px] font-bold">SALE</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2 items-center">
                                {status === 'ARCHIVED' ? (
                                  <button
                                    onClick={() => handleRestoreProduct(product.id)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 px-2.5 py-1 text-[10px] font-bold text-green-400 transition-all"
                                    title="Restore product to active storefront"
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                    RESTORE
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingProduct(product);
                                        setIsAddingNew(false);
                                      }}
                                      className="text-slate-400 hover:text-white transition-colors p-1"
                                      title="Edit product details"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteModalProduct(product)}
                                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                      title="Delete Product"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">ORDER CONTROL PORTAL</h2>
              <span className="text-xs text-slate-500">Filter, edit, track and verify receipt transactions</span>
            </div>

            {viewingOrder && (
              <div className="glass-panel rounded-2xl p-6 border border-white/15 bg-slate-900 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-royal-blue">
                    ORDER INVOICE: {viewingOrder.id}
                  </h3>
                  <button onClick={() => setViewingOrder(null)} className="text-xs text-slate-500 hover:text-white">Close</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer Details</h4>
                    <p><strong className="text-white">Name:</strong> {viewingOrder.customerName}</p>
                    <p><strong className="text-white">Phone:</strong> {viewingOrder.phone}</p>
                    <p><strong className="text-white">Email:</strong> {viewingOrder.email}</p>
                    <p><strong className="text-white">Address:</strong><br />
                      {viewingOrder.address.flat}, {viewingOrder.address.street}<br />
                      {viewingOrder.address.city}, {viewingOrder.address.state} - {viewingOrder.address.zip}<br />
                      {viewingOrder.address.country}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order Configurations</h4>
                    <p><strong className="text-white">Total Value:</strong> ₹{viewingOrder.total.toLocaleString('en-IN')}</p>
                    <p><strong className="text-white">Status:</strong> <span className="text-royal-blue font-bold">{viewingOrder.status}</span></p>
                    
                    <div className="pt-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Set Active Status</label>
                      <select
                        value={viewingOrder.status}
                        onChange={(e) => handleUpdateOrderStatus(viewingOrder.id, e.target.value as any)}
                        className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="pt-3">
                      <button
                        onClick={() => handleDeleteOrder(viewingOrder.id)}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-red-400 transition-all"
                      >
                        Delete Order Record
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Items Summary</h4>
                  <div className="space-y-2 text-xs">
                    {viewingOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                        <span>
                          <strong className="text-white uppercase">{item.name}</strong> &bull; Size {item.size} &bull; Color {item.color}
                        </span>
                        <span className="font-semibold text-slate-400">
                          {item.quantity} x ₹{item.price.toLocaleString('en-IN')} = ₹{(item.quantity * item.price).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="relative">
              <div className="relative w-full max-w-sm mb-4">
                <input
                  type="text"
                  placeholder="Search order ID, Customer Name..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white"
                />
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-premium-dark/40">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 border-b border-white/10 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Items Qty</th>
                      <th className="px-6 py-4 text-right">Total Price</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredOrdersList.map((order) => (
                      <tr key={order.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 font-bold text-white uppercase tracking-wider">{order.id}</td>
                        <td className="px-6 py-4 font-medium">{order.customerName}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            order.status === 'Cancelled'
                              ? 'bg-red-500/10 text-red-500'
                              : order.status === 'Delivered'
                              ? 'bg-green-500/10 text-green-400'
                              : order.status === 'Pending'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-royal-blue/15 text-royal-blue'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-white">₹{order.total.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setViewingOrder(order)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOMERS REGISTER */}
        {activeTab === 'customers' && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">CUSTOMER DATABASE</h2>
              <span className="text-xs text-slate-500">Review consumer details, spending, and registrations</span>
            </div>

            <div className="relative">
              <div className="relative w-full max-w-sm mb-4">
                <input
                  type="text"
                  placeholder="Search customer name, email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white"
                />
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-premium-dark/40">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 border-b border-white/10 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Client Name</th>
                      <th className="px-6 py-4">Contact Info</th>
                      <th className="px-6 py-4">Register Date</th>
                      <th className="px-6 py-4 text-right">Orders placed</th>
                      <th className="px-6 py-4 text-right font-bold">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredCustomersList.map((cust, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="px-6 py-4 font-bold text-white">{cust.name}</td>
                        <td className="px-6 py-4 space-y-0.5">
                          <p className="font-semibold text-slate-300">{cust.email}</p>
                          <p className="text-slate-500">{cust.phone}</p>
                        </td>
                        <td className="px-6 py-4">{cust.registrationDate}</td>
                        <td className="px-6 py-4 text-right">{cust.totalOrders}</td>
                        <td className="px-6 py-4 text-right font-bold text-royal-blue">₹{cust.totalSpending.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: INVENTORY MANAGEMENT */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">STOCK & LOGISTICS CONTROL</h2>
              <span className="text-xs text-slate-500">Directly configure counts, review shortages, and set stock levels</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-premium-dark/40">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 border-b border-white/10 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                  <tr>
                    <th className="px-6 py-4">Sneaker</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Current Stock</th>
                    <th className="px-6 py-4 text-right">Quick Stock Adjustments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {db.products.map((product) => {
                    const isOut = product.stock === 0;
                    const isLow = product.stock <= 5;

                    return (
                      <tr key={product.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 font-bold text-white uppercase">{product.name}</td>
                        <td className="px-6 py-4 text-royal-blue font-medium">{product.sku}</td>
                        <td className="px-6 py-4 text-center">
                          {isOut ? (
                            <span className="rounded bg-red-500/10 border border-red-500/20 text-red-500 px-2 py-0.5 text-[9px] font-bold">OUT OF STOCK</span>
                          ) : isLow ? (
                            <span className="rounded bg-orange-500/10 border border-orange-500/20 text-orange-500 px-2 py-0.5 text-[9px] font-bold animate-pulse">LOW STOCK</span>
                          ) : (
                            <span className="rounded bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 text-[9px] font-bold">HEALTHY</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-white text-base">
                          {product.stock}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleAdjustStock(product.id, -1)}
                              className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 p-2 text-slate-400 hover:text-white transition-all"
                              title="Reduce Stock"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleAdjustStock(product.id, 5)}
                              className="rounded-lg border border-white/10 bg-royal-blue hover:bg-royal-blue-hover p-2 text-white transition-all flex items-center gap-1 font-bold text-[10px] px-3 uppercase"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add 5
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: WEBSITE CMS PAGE EDITOR */}
        {activeTab === 'cms' && (
          <div className="space-y-6 text-left max-w-4xl">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">WEBSITE SETTINGS CMS</h2>
              <span className="text-xs text-slate-500">Edit hero copies, found origin declarations, and store terms</span>
            </div>

            <form onSubmit={handleSaveCMS} className="glass-panel rounded-2xl p-6 border border-white/10 space-y-6">
              <h3 className="text-sm font-bold tracking-widest text-royal-blue uppercase border-b border-white/5 pb-3">
                Store Core Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Hero Title</label>
                  <input
                    type="text"
                    required
                    value={cmsForm.heroTitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, heroTitle: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Tagline</label>
                  <input
                    type="text"
                    required
                    value={cmsForm.heroSubtitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, heroSubtitle: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Hero Banner Description</label>
                <textarea
                  rows={2}
                  required
                  value={cmsForm.heroTagline}
                  onChange={(e) => setCmsForm({ ...cmsForm, heroTagline: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">About Us Description</label>
                <textarea
                  rows={3}
                  required
                  value={cmsForm.aboutText}
                  onChange={(e) => setCmsForm({ ...cmsForm, aboutText: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white resize-none"
                />
              </div>

              <h3 className="text-sm font-bold tracking-widest text-royal-blue uppercase border-b border-white/5 pt-4 pb-3">
                Store Policies
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Shipping Policy</label>
                  <textarea
                    rows={4}
                    required
                    value={cmsForm.policies.shipping}
                    onChange={(e) => setCmsForm({ ...cmsForm, policies: { ...cmsForm.policies, shipping: e.target.value } })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Returns Policy</label>
                  <textarea
                    rows={4}
                    required
                    value={cmsForm.policies.returns}
                    onChange={(e) => setCmsForm({ ...cmsForm, policies: { ...cmsForm.policies, returns: e.target.value } })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-royal-blue hover:bg-royal-blue-hover px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'SAVING CONFIGS...' : 'SAVE SETTINGS'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">SECURITY AUDIT LOGS</h2>
                <span className="text-xs text-slate-500">Immutable chronological log of all administrative actions & events</span>
              </div>
              <button
                onClick={fetchAuditLogs}
                disabled={isLoadingAudit}
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-all"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`} />
                Refresh Logs
              </button>
            </div>

            <div className="relative">
              <div className="relative w-full max-w-sm mb-4">
                <input
                  type="text"
                  placeholder="Search logs by action, user, details..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white"
                />
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-premium-dark/40">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 border-b border-white/10 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Entity</th>
                      <th className="px-6 py-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {filteredAuditLogsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-sans">
                          {isLoadingAudit ? 'Loading audit trail...' : 'No audit records found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogsList.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5">
                          <td className="px-6 py-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4 font-bold text-white">{log.admin}</td>
                          <td className="px-6 py-4">
                            <span className="rounded bg-royal-blue/15 border border-royal-blue/30 text-royal-blue px-2 py-0.5 text-[10px] font-bold">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{log.target}</td>
                          <td className="px-6 py-4 text-slate-400 font-sans text-xs">{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* AMAZON/FLIPKART IMPORT URL MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm text-left">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900/90 p-6 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-royal-blue flex items-center gap-2">
                <Compass className="h-4 w-4 text-royal-blue" />
                Import Product Link
              </h3>
              <button
                onClick={() => {
                  if (importStatus !== 'loading') {
                    setIsImportModalOpen(false);
                  }
                }}
                className="text-xs text-slate-500 hover:text-white transition-colors"
                disabled={importStatus === 'loading'}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Product Link (Amazon or Flipkart URL)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.amazon.in/... or https://www.flipkart.com/..."
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:outline-none focus:border-royal-blue/50 transition-colors"
                  disabled={importStatus === 'loading'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    Target Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 12999"
                    value={importPrice}
                    onChange={(e) => setImportPrice(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:outline-none focus:border-royal-blue/50 transition-colors"
                    disabled={importStatus === 'loading'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    Storefront Category
                  </label>
                  <select
                    value={importCategory}
                    onChange={(e) => setImportCategory(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-xs text-white focus:outline-none focus:border-royal-blue/50 transition-colors"
                    disabled={importStatus === 'loading'}
                  >
                    <option value="Running">Running</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Sport">Sport</option>
                    <option value="Casual">Casual</option>
                  </select>
                </div>
              </div>

              {importStatus !== 'idle' && (
                <div className={`rounded-xl border p-4 text-xs font-light leading-relaxed flex flex-col gap-1.5 ${
                  importStatus === 'loading'
                    ? 'border-royal-blue/20 bg-royal-blue/5 text-royal-blue'
                    : importStatus === 'success'
                    ? 'border-green-500/20 bg-green-500/5 text-green-400'
                    : 'border-red-500/20 bg-red-500/5 text-red-400'
                }`}>
                  <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    {importStatus === 'loading' && <span className="h-2 w-2 rounded-full bg-royal-blue animate-ping" />}
                    {importStatus === 'success' && <CheckCircle className="h-3.5 w-3.5" />}
                    {importStatus === 'error' && <AlertTriangle className="h-3.5 w-3.5" />}
                    {importStatus.toUpperCase()}
                  </div>
                  <div>{importMessage}</div>
                </div>
              )}

              <div className="flex justify-end border-t border-white/5 pt-4">
                <button
                  type="submit"
                  disabled={importStatus === 'loading'}
                  className="rounded-xl bg-royal-blue hover:bg-royal-blue-hover px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all disabled:opacity-50 shadow-lg shadow-royal-blue/20"
                >
                  {importStatus === 'loading' ? 'SCRAPING DETAILS...' : 'SCRAPE & PREVIEW'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT PREVIEW MODAL */}
      {importPreviewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md text-left">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black uppercase tracking-widest text-royal-blue flex items-center gap-2">
                  <Compass className="h-5 w-5 text-royal-blue" />
                  IMPORT PREVIEW & REVIEW
                </h3>
                <p className="text-xs text-slate-400">Verify scraped product details before importing to your live catalog</p>
              </div>
              <button onClick={() => setImportPreviewProduct(null)} className="text-xs text-slate-500 hover:text-white">
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500 block">Product Name</label>
                  <input
                    type="text"
                    value={importPreviewProduct.name || ''}
                    onChange={(e) => setImportPreviewProduct({ ...importPreviewProduct, name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500 block">Brand</label>
                  <input
                    type="text"
                    value={importPreviewProduct.brand || ''}
                    onChange={(e) => setImportPreviewProduct({ ...importPreviewProduct, brand: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500 block">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={importPreviewProduct.price || 0}
                    onChange={(e) => setImportPreviewProduct({ ...importPreviewProduct, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500 block">Original Price (₹)</label>
                  <input
                    type="number"
                    value={importPreviewProduct.originalPrice || 0}
                    onChange={(e) => setImportPreviewProduct({ ...importPreviewProduct, originalPrice: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500 block">Discount %</label>
                  <div className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-green-400 font-bold">
                    {importPreviewProduct.originalPrice && importPreviewProduct.originalPrice > (importPreviewProduct.price || 0)
                      ? `${Math.round(((importPreviewProduct.originalPrice - (importPreviewProduct.price || 0)) / importPreviewProduct.originalPrice) * 100)}% OFF`
                      : '0% OFF'}
                  </div>
                </div>
              </div>

              {/* Scraped Image Preview */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500 block">Scraped Main Image URL</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={importPreviewProduct.mainImage || ''}
                    onChange={(e) => setImportPreviewProduct({ ...importPreviewProduct, mainImage: e.target.value })}
                    className="flex-grow rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white font-mono text-[11px]"
                  />
                  <div className="h-12 w-12 rounded-lg bg-black p-1 shrink-0 border border-white/10">
                    <img src={importPreviewProduct.mainImage || ''} alt="Preview" className="h-full w-full object-contain" />
                  </div>
                </div>
              </div>

              {/* Scraped Description */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500 block">Description</label>
                <textarea
                  rows={3}
                  value={importPreviewProduct.description || ''}
                  onChange={(e) => setImportPreviewProduct({ ...importPreviewProduct, description: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white resize-none"
                />
              </div>

              {/* Source Platform Badge */}
              <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Source Platform:</span>
                <span className="text-xs font-black text-royal-blue uppercase">{importPreviewProduct.sourcePlatform || 'Imported'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setImportPreviewProduct(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handlePublishImportPreview}
                disabled={isSubmitting}
                className="rounded-xl bg-royal-blue hover:bg-royal-blue-hover px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50 shadow-lg shadow-royal-blue/20"
              >
                {isSubmitting ? 'SAVING...' : 'IMPORT TO STORE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DUPLICATE WARNING MODAL */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md text-left">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
              <div>
                <h3 className="text-sm font-black uppercase text-white tracking-wider">Duplicate Product Warning</h3>
                <p className="text-[11px] text-slate-400">This product link or title has already been imported.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase block">Existing Product in Store:</span>
              <strong className="text-white block uppercase">{duplicateWarning.duplicateProduct.name}</strong>
              <span className="text-slate-400 text-[10px] block">SKU: {duplicateWarning.duplicateProduct.sku} &bull; Price: ₹{duplicateWarning.duplicateProduct.price}</span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setEditingProduct(duplicateWarning.duplicateProduct);
                  setDuplicateWarning(null);
                  setActiveTab('products');
                }}
                className="w-full rounded-xl bg-royal-blue hover:bg-royal-blue-hover py-3 text-xs font-bold uppercase tracking-wider text-white"
              >
                VIEW EXISTING PRODUCT
              </button>
              <button
                onClick={() => {
                  setImportPreviewProduct(duplicateWarning.newPreview);
                  setDuplicateWarning(null);
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white"
              >
                IMPORT ANYWAY
              </button>
              <button
                onClick={() => setDuplicateWarning(null)}
                className="text-xs text-slate-500 hover:text-white py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPLICIT DELETE CONFIRMATION MODAL */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md text-left">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Trash2 className="h-6 w-6 text-red-500 shrink-0" />
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Delete Product Confirmation</h3>
                <p className="text-[11px] text-slate-400">Action cannot be undone.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-white font-bold text-sm">
                Are you sure you want to delete this product?
              </p>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-white font-bold block uppercase">{deleteModalProduct.name}</span>
                <span className="text-slate-400 font-mono text-[10px] block">SKU: {deleteModalProduct.sku} &bull; Price: ₹{deleteModalProduct.price}</span>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-300 leading-relaxed">
                <strong className="block mb-0.5 font-bold uppercase text-[10px]">Data Integrity Notice:</strong>
                If this product has existing customer orders, it will be safely <strong>ARCHIVED</strong> to preserve customer order receipts. If 0 orders exist, it will be permanently deleted from database.
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setDeleteModalProduct(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={isSubmitting}
                className="rounded-xl bg-red-500 hover:bg-red-600 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50 shadow-lg shadow-red-500/20"
              >
                {isSubmitting ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
