'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../lib/AuthContext';
import { INITIAL_UNITS, INITIAL_EQUIPMENT_CATEGORIES } from '../../lib/data';
import { calculateEquipmentAvailability } from '../../lib/booking-service';
import { Booking, BookingStatus, EquipmentItem, EquipmentCategory } from '../../lib/types';
import {
  Package,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send,
  Sparkles,
  ArrowRight,
  Shield,
  ShieldCheck,
  Lock,
  ShieldAlert,
  Trash2,
  Edit,
  Search,
  Check,
  X,
  RefreshCw,
  Box,
  FileText,
  User,
  SlidersHorizontal,
} from 'lucide-react';

export default function InventoryPage() {
  const { language, t } = useLanguage();
  const { currentUser, currentUnit, isSuperAdmin, can, logAction, accessibleUnits, currentRole } = useAuth();

  // Primary Tab: 'catalog' vs 'requests'
  const [activeTab, setActiveTab] = useState<'catalog' | 'requests'>('catalog');

  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-10-04');
  
  const defaultUnit = accessibleUnits.length > 0 ? accessibleUnits[0].id : 5;
  const [selectedUnitId, setSelectedUnitId] = useState<number>(defaultUnit);

  const canAccessInventory =
    isSuperAdmin ||
    can('inventory.view') ||
    can('inventory.book') ||
    can('inventory.manage') ||
    can('inventory.approve');

  const canManageInventory =
    isSuperAdmin ||
    can('inventory.manage') ||
    currentRole?.name === 'quartermaster' ||
    currentRole?.name === 'group_leader';

  const canApprove =
    isSuperAdmin ||
    can('inventory.approve') ||
    currentRole?.name === 'quartermaster' ||
    currentRole?.name === 'group_leader';

  const canBook = isSuperAdmin || can('inventory.book', selectedUnitId);

  // Sync unit when user switches or accessibleUnits changes
  React.useEffect(() => {
    if (accessibleUnits.length > 0 && !accessibleUnits.some((u) => u.id === selectedUnitId)) {
      setSelectedUnitId(accessibleUnits[0].id);
    }
  }, [accessibleUnits, selectedUnitId]);

  const [purpose, setPurpose] = useState<string>('');

  // Cart of requested items: { [equipmentId]: requestedQuantity }
  const [cart, setCart] = useState<Record<number, number>>({ 1: 5, 5: 2 });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<EquipmentCategory[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bookings Filter
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'pending' | 'approved' | 'returned'>('all');

  // Modals State
  const [isAddEquipModalOpen, setIsAddEquipModalOpen] = useState(false);
  const [newEquipName, setNewEquipName] = useState('');
  const [newEquipCatId, setNewEquipCatId] = useState<number>(1);
  const [newEquipSku, setNewEquipSku] = useState('');
  const [newEquipQty, setNewEquipQty] = useState<number>(10);
  const [newEquipBay, setNewEquipBay] = useState('المخزن الرئيسي');
  const [newEquipCondition, setNewEquipCondition] = useState('good');
  const [isSubmittingEquip, setIsSubmittingEquip] = useState(false);

  // Edit Modal State
  const [editingEquip, setEditingEquip] = useState<EquipmentItem | null>(null);

  // Delete Modal State
  const [deletingEquip, setDeletingEquip] = useState<EquipmentItem | null>(null);

  // Fetch live inventory items and categories from ScoutsDB
  const fetchInventory = React.useCallback(() => {
    fetch(`/api/inventory?startDate=${startDate}&endDate=${endDate}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          if (Array.isArray(data.equipment)) setEquipmentList(data.equipment);
          if (Array.isArray(data.categories)) setCategoriesList(data.categories);
        }
      })
      .catch((err) => console.error('Failed to fetch inventory:', err));
  }, [startDate, endDate]);

  // Fetch live bookings from ScoutsDB
  const fetchBookings = React.useCallback(() => {
    fetch('/api/inventory/bookings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
        }
      })
      .catch((err) => console.error('Failed to fetch bookings:', err));
  }, []);

  React.useEffect(() => {
    fetchInventory();
    fetchBookings();
  }, [fetchInventory, fetchBookings]);

  // Filtered equipment items
  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category_id === selectedCategory;
      const matchSearch =
        catalogSearch.trim() === '' ||
        item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.sku.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.storage_bay.toLowerCase().includes(catalogSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, catalogSearch, equipmentList]);

  // Pending bookings count
  const pendingBookingsCount = useMemo(() => {
    return bookings.filter((b) => b.status === 'pending').length;
  }, [bookings]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (bookingStatusFilter === 'all') return true;
      return b.status === bookingStatusFilter;
    });
  }, [bookings, bookingStatusFilter]);

  // Update item quantity in request cart
  const handleQuantityChange = (equipmentId: number, qty: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[equipmentId];
      } else {
        next[equipmentId] = qty;
      }
      return next;
    });
  };

  // Submit Booking with database overlap verification
  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();

    if (!purpose.trim()) {
      setFeedbackMessage({
        type: 'error',
        text: language === 'ar' ? 'يرجى إدخال الغرض من استعارة العهدة والمخيم' : 'Please provide the camp purpose',
      });
      return;
    }

    const requestedItems = Object.entries(cart).map(([id, qty]) => ({
      equipmentId: Number(id),
      qty,
    }));

    if (requestedItems.length === 0) {
      setFeedbackMessage({
        type: 'error',
        text: language === 'ar' ? 'يرجى اختيار مهمة واحدة على الأقل للاستعارة' : 'Select at least one item',
      });
      return;
    }

    // Verify overlap rule for every item
    for (const req of requestedItems) {
      const equip = equipmentList.find((e) => e.id === req.equipmentId);
      if (!equip) continue;

      const check = calculateEquipmentAvailability(
        equip,
        bookings,
        startDate,
        endDate,
        req.qty
      );

      if (!check.isAvailable) {
        setFeedbackMessage({
          type: 'error',
          text: `${t('insufficient_stock')} (${equip.name}: المتاح فقط ${check.availableQuantity})`,
        });
        return;
      }
    }

    // Persist to Database
    fetch('/api/inventory/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser?.id,
        unitId: selectedUnitId,
        startDate,
        endDate,
        purpose,
        items: requestedItems,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          fetchBookings();
          fetchInventory();
          setCart({});
          setPurpose('');
          setFeedbackMessage({
            type: 'success',
            text: language === 'ar' ? 'تم تسجيل طلب حجز العهدة بنجاح وهو قيد مراجعة أمين العهدة' : t('booking_success'),
          });
          setTimeout(() => setFeedbackMessage(null), 4000);
        } else {
          setFeedbackMessage({
            type: 'error',
            text: data.error || 'Failed to submit booking',
          });
        }
      })
      .catch((err) => {
        console.error('Booking submission error:', err);
        setFeedbackMessage({
          type: 'error',
          text: 'Database connection error',
        });
      });
  };

  // Quartermaster Action to Update Booking Status (Approve / Reject / Mark Returned)
  const handleUpdateBookingStatus = (bookingId: string, status: 'approved' | 'rejected' | 'returned') => {
    fetch('/api/inventory/bookings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        status,
        approverId: currentUser?.id,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          fetchBookings();
          fetchInventory();
          const statusLabel =
            status === 'approved'
              ? language === 'ar' ? 'الموافقة على الطلب' : 'Approved'
              : status === 'rejected'
              ? language === 'ar' ? 'رفض الطلب' : 'Rejected'
              : language === 'ar' ? 'إرجاع العهدة للمخزن' : 'Returned';
          setFeedbackMessage({
            type: 'success',
            text: language === 'ar' ? `تم تنفيذ: ${statusLabel} بنجاح` : `Request marked as ${statusLabel}`,
          });
          setTimeout(() => setFeedbackMessage(null), 3500);
        }
      })
      .catch((err) => console.error('Update booking error:', err));
  };

  // Add Equipment Submit
  const handleAddEquipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquipName.trim() || !newEquipQty) return;
    setIsSubmittingEquip(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEquipName.trim(),
          categoryId: newEquipCatId,
          sku: newEquipSku.trim() || undefined,
          totalQuantity: Number(newEquipQty),
          storageBay: newEquipBay.trim() || undefined,
          condition: newEquipCondition,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddEquipModalOpen(false);
        setNewEquipName('');
        setNewEquipSku('');
        setNewEquipQty(10);
        setNewEquipBay('المخزن الرئيسي');
        fetchInventory();
        setFeedbackMessage({
          type: 'success',
          text: language === 'ar' ? 'تمت إضافة مهمة العهدة الجديدة بنجاح للمخزن!' : 'New equipment added successfully to stock!',
        });
        setTimeout(() => setFeedbackMessage(null), 3500);
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Failed to add equipment' });
      }
    } finally {
      setIsSubmittingEquip(false);
    }
  };

  // Edit Equipment Submit
  const handleEditEquipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquip || !editingEquip.name.trim()) return;
    setIsSubmittingEquip(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingEquip.id,
          name: editingEquip.name.trim(),
          categoryId: editingEquip.category_id,
          sku: editingEquip.sku.trim(),
          totalQuantity: Number(editingEquip.total_quantity),
          storageBay: editingEquip.storage_bay.trim(),
          condition: editingEquip.condition,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingEquip(null);
        fetchInventory();
        setFeedbackMessage({
          type: 'success',
          text: language === 'ar' ? 'تم تحديث بيانات ورصيد مهمة العهدة بنجاح!' : 'Equipment item updated successfully!',
        });
        setTimeout(() => setFeedbackMessage(null), 3500);
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Failed to update equipment' });
      }
    } finally {
      setIsSubmittingEquip(false);
    }
  };

  // Delete Equipment Submit
  const handleDeleteEquipmentSubmit = async () => {
    if (!deletingEquip) return;
    setIsSubmittingEquip(true);
    try {
      const res = await fetch(`/api/inventory?id=${deletingEquip.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeletingEquip(null);
        fetchInventory();
        fetchBookings();
        setFeedbackMessage({
          type: 'success',
          text: language === 'ar' ? `تم حذف مهمة العهدة (${deletingEquip.name}) نهائياً من المنظومة!` : `Equipment (${deletingEquip.name}) deleted permanently!`,
        });
        setTimeout(() => setFeedbackMessage(null), 3500);
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Failed to delete equipment' });
      }
    } finally {
      setIsSubmittingEquip(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with View Switcher & Action Controls */}
      <div className="bg-white dark:bg-[#161D1A] p-5 rounded-xl border border-[#E2DED6] dark:border-[#27342F] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#B45309]" strokeWidth={2} />
            <span>{language === 'ar' ? 'منظومة إدارة العهدة والمهمات الكشفية' : 'Equipment & Inventory Management'}</span>
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            {language === 'ar'
              ? 'متابعة رصيد المخزن، حجز المهمات للفرق الكشفية، اعتماد الطلبات، وإضافة وتعديل وحذف العهدة.'
              : 'Real-time stock management, team gear checkout requests, approvals, and inventory administration.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Equipment Button */}
          {canManageInventory && (
            <button
              type="button"
              onClick={() => setIsAddEquipModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{language === 'ar' ? '＋ إضافة مهمة عهدة جديدة' : '+ Add New Equipment'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FDF6EC] dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs font-bold text-[#B45309] dark:text-amber-300 shadow-2xs">
            <Shield className="w-4 h-4 text-[#B45309]" strokeWidth={2} />
            <span>{language === 'ar' ? 'أمين العهدة (Quartermaster)' : 'Quartermaster Mode'}</span>
          </div>
        </div>
      </div>

      {/* 2. Primary Navigation Tabs: Catalog vs Team Requests */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="inline-flex rounded-xl p-1 bg-[#F0F4F9] dark:bg-[#282A2C] border border-zinc-200/60 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-white dark:bg-[#1F1F1F] text-[#0B57D0] shadow-xs font-bold'
                : 'text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F]'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>{language === 'ar' ? 'كتالوج ومخزون العهدة' : 'Equipment Catalog & Stock'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
              {equipmentList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-white dark:bg-[#1F1F1F] text-amber-700 dark:text-amber-400 shadow-xs font-bold'
                : 'text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{language === 'ar' ? 'طلبات حجز العهدة من الفرق' : 'Team Equipment Requests'}</span>
            {pendingBookingsCount > 0 ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-mono font-bold animate-pulse">
                {pendingBookingsCount} {language === 'ar' ? 'جديد' : 'new'}
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono">
                {bookings.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-fadeIn ${
            feedbackMessage.type === 'success'
              ? 'bg-[#E8F0EC] dark:bg-[#1B4332]/40 border border-[#2D6A4F] text-[#1B4332] dark:text-[#86efac]'
              : 'bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-400'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#1B4332] shrink-0" strokeWidth={2} />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={2} />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* 3. TAB 1: EQUIPMENT CATALOG & BOOKING CART */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Equipment Catalog */}
          <div className="lg:col-span-2 space-y-3">
            {/* Search and Category Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute start-3 top-2.5" strokeWidth={2} />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder={language === 'ar' ? 'بحث عن مهمة بالاسم أو الكود (SKU) أو مكان التخزين...' : 'Search gear by name, SKU, or bay...'}
                  className="w-full ps-9 pe-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] text-xs font-medium focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                />
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {language === 'ar' ? 'جميع التصنيفات' : 'All Categories'}
                </button>
                {INITIAL_EQUIPMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    {cat.name.split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredEquipment.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-zinc-400 bg-white dark:bg-[#121214] rounded-xl border border-zinc-200 dark:border-zinc-800">
                  {language === 'ar' ? 'لا توجد مهمات مطابقة للبحث' : 'No equipment items found matching query'}
                </div>
              ) : (
                filteredEquipment.map((item) => {
                  const reqQty = cart[item.id] || 0;
                  const check = calculateEquipmentAvailability(
                    item,
                    bookings,
                    startDate,
                    endDate,
                    reqQty
                  );

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border bg-white dark:bg-[#121214] flex flex-col justify-between transition-colors shadow-2xs ${
                        reqQty > 0
                          ? 'border-emerald-800 dark:border-emerald-600 ring-1 ring-emerald-800/30'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        {/* Header: SKU, Condition & Admin Controls */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[10px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 px-1.5 py-0.2 rounded border border-zinc-200 dark:border-zinc-700">
                            {item.sku}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                                item.condition === 'new'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  : item.condition === 'good'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                  : item.condition === 'needs_repair'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                              }`}
                            >
                              {item.condition}
                            </span>

                            {/* Edit & Delete Controls for Quartermaster */}
                            {canManageInventory && (
                              <div className="flex items-center gap-0.5 ms-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingEquip(item)}
                                  title={language === 'ar' ? 'تعديل المهمة' : 'Edit Equipment'}
                                  className="p-1 rounded text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingEquip(item)}
                                  title={language === 'ar' ? 'حذف المهمة نهائياً' : 'Delete Equipment'}
                                  className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm leading-snug">{item.name}</h4>
                        <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-2">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.storage_bay}</span>
                          <span>&bull;</span>
                          <span className="font-mono tabular-nums">{t('total_stock')}: {item.total_quantity}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        {/* Live remaining stock */}
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono text-zinc-400">{t('available_stock')}</span>
                          <span
                            className={`text-sm font-semibold font-mono tabular-nums ${
                              check.availableQuantity > 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {check.availableQuantity} قطعة
                          </span>
                        </div>

                        {/* Quantity Selector Controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, reqQty - 1)}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-sm sm:text-xs flex items-center justify-center transition-colors cursor-pointer active:scale-95 touch-manipulation"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
                            {reqQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, reqQty + 1)}
                            disabled={reqQty >= check.availableQuantity}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded-md bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white disabled:bg-zinc-100 disabled:dark:bg-zinc-800 disabled:text-zinc-400 text-white dark:text-zinc-900 font-bold text-sm sm:text-xs flex items-center justify-center transition-colors cursor-pointer active:scale-95 touch-manipulation"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Checkout Request Form */}
          <div className="space-y-4">
            <form
              onSubmit={handleSubmitBooking}
              className="p-4 rounded-xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                <span className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                  <span>{language === 'ar' ? 'طلب حجز عهدة لفريقي' : 'New Checkout Request'}</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {Object.keys(cart).length} أصناف
                </span>
              </div>

              {/* Date Range Selectors */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 mb-1 block">{t('start_date')}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 mb-1 block">{t('end_date')}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Unit Selector */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
                  <span>{t('unit')}</span>
                  {!isSuperAdmin && currentUnit && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <Lock className="w-2.5 h-2.5" strokeWidth={1.5} />
                      <span>{t('locked_to_team')}</span>
                    </span>
                  )}
                </div>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                  disabled={!isSuperAdmin && accessibleUnits.length <= 1}
                  className={`w-full border rounded-md px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-emerald-800 focus:outline-none transition-colors ${
                    !isSuperAdmin && accessibleUnits.length <= 1
                      ? 'bg-zinc-100 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-500 cursor-not-allowed'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  {accessibleUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {language === 'ar' ? u.name_ar : u.name_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purpose Input */}
              <div>
                <label className="text-[10px] font-mono text-zinc-500 mb-1 block">{t('purpose')}</label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: مخيم وادي النطرون لكشافة A' : 'Camp purpose...'}
                  rows={2}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                  required
                />
              </div>

              {/* Cart Summary */}
              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-md border border-zinc-200 dark:border-zinc-800 text-xs">
                <span className="font-medium text-zinc-700 dark:text-zinc-300 block mb-1">المهمات المحددة للحجز:</span>
                {Object.keys(cart).length === 0 ? (
                  <span className="text-zinc-400 text-[11px] italic">لم يتم اختيار مهمات</span>
                ) : (
                  <div className="space-y-0.5">
                    {Object.entries(cart).map(([id, qty]) => {
                      const item = equipmentList.find((i) => i.id === Number(id));
                      return (
                        <div key={id} className="flex justify-between text-zinc-800 dark:text-zinc-200 text-xs font-mono">
                          <span>{item?.name.split(' (')[0]}</span>
                          <span className="tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">{qty} قطعة</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!canBook}
                className={`w-full py-2 px-3 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  canBook
                    ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{language === 'ar' ? 'إرسال طلب الحجز لأمين العهدة' : t('submit_booking')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. TAB 2: TEAM EQUIPMENT REQUESTS & APPROVALS (Directive: View all requested gear) */}
      {activeTab === 'requests' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#121214] p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setBookingStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  bookingStatusFilter === 'all'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {language === 'ar' ? 'كافة الطلبات' : 'All Requests'} ({bookings.length})
              </button>
              <button
                type="button"
                onClick={() => setBookingStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  bookingStatusFilter === 'pending'
                    ? 'bg-amber-500 text-white font-bold'
                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</span>
                <span className="font-mono text-[10px] px-1 py-0.2 rounded-full bg-white/20">
                  {bookings.filter((b) => b.status === 'pending').length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setBookingStatusFilter('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  bookingStatusFilter === 'approved'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'معتمدة / بالخارج' : 'Approved'}</span>
                <span className="font-mono text-[10px] px-1 py-0.2 rounded-full bg-white/20">
                  {bookings.filter((b) => b.status === 'approved').length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setBookingStatusFilter('returned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  bookingStatusFilter === 'returned'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تم الإرجاع للمخزن' : 'Returned'}</span>
                <span className="font-mono text-[10px] px-1 py-0.2 rounded-full bg-white/20">
                  {bookings.filter((b) => b.status === 'returned').length}
                </span>
              </button>
            </div>

            <div className="text-xs text-zinc-500 font-mono">
              {language === 'ar' ? 'عرض طلبات مهمات الفرق مع التفاصيل الكاملة' : 'Showing all team gear requests with itemized breakdown'}
            </div>
          </div>

          {/* Bookings Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBookings.length === 0 ? (
              <div className="col-span-full py-16 text-center text-xs text-zinc-400 bg-white dark:bg-[#121214] rounded-xl border border-zinc-200 dark:border-zinc-800">
                {language === 'ar' ? 'لا توجد طلبات عهدة في هذه الفئة' : 'No equipment requests in this category'}
              </div>
            ) : (
              filteredBookings.map((b: any) => {
                const bItems: any[] = Array.isArray(b.items) ? b.items : [];
                const totalItemPieces = bItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-3.5 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Header: Requester, Unit & Status Badge */}
                      <div className="flex items-start justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{b.requester_name || 'القائد المسؤول'}</span>
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-900">
                              {language === 'ar' ? b.unit_name_ar || 'الفوج' : b.unit_name_en || 'Scout Unit'}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                            {b.purpose}
                          </h4>
                        </div>

                        <span
                          className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full border shrink-0 ${
                            b.status === 'approved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : b.status === 'pending'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                              : b.status === 'returned'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {b.status === 'approved'
                            ? language === 'ar' ? 'معتمد' : 'Approved'
                            : b.status === 'pending'
                            ? language === 'ar' ? 'قيد المراجعة' : 'Pending'
                            : b.status === 'returned'
                            ? language === 'ar' ? 'تم الإرجاع' : 'Returned'
                            : b.status}
                        </span>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span>فترة الاستعارة:</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">{b.start_date}</span>
                        <span>&rarr;</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">{b.end_date}</span>
                      </div>

                      {/* Itemized Breakdown of Requested Equipment (Core User Request) */}
                      <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          <span className="flex items-center gap-1.5">
                            <Box className="w-3.5 h-3.5 text-amber-600" />
                            <span>{language === 'ar' ? 'بيان المهمات المطلوبة:' : 'Requested Gear Breakdown:'}</span>
                          </span>
                          <span className="font-mono text-[11px] text-zinc-500">
                            {bItems.length} أصناف ({totalItemPieces} قطعة)
                          </span>
                        </div>

                        {bItems.length === 0 ? (
                          <div className="text-[11px] text-zinc-400 italic">
                            {language === 'ar' ? 'لا توجد تفاصيل أصناف مسجلة لهذا الحجز' : 'No items listed'}
                          </div>
                        ) : (
                          <div className="space-y-1 pt-1">
                            {bItems.map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-1 py-0.2 rounded">
                                    {item.equipment_sku || `EQ-${item.equipment_id}`}
                                  </span>
                                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                    {item.equipment_name || `مهمة #${item.equipment_id}`}
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                  {item.quantity} قطعة
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {b.approver_name && (
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{language === 'ar' ? `تم الاعتماد بواسطة: ${b.approver_name}` : `Approved by: ${b.approver_name}`}</span>
                        </div>
                      )}
                    </div>

                    {/* Quartermaster Quick Action Buttons */}
                    {canApprove && (
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                        {b.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(b.id, 'approved')}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                              <span>{language === 'ar' ? 'اعتماد وصرف العهدة' : 'Approve & Checkout'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(b.id, 'rejected')}
                              className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
                            >
                              <X className="w-4 h-4" />
                              <span>{language === 'ar' ? 'رفض' : 'Reject'}</span>
                            </button>
                          </>
                        )}

                        {b.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingStatus(b.id, 'returned')}
                            className="w-full py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Box className="w-4 h-4" />
                            <span>{language === 'ar' ? 'تسجيل إرجاع العهدة للمخزن (Mark Returned)' : 'Mark Returned to Stock'}</span>
                          </button>
                        )}

                        {b.status === 'returned' && (
                          <div className="w-full text-center text-xs font-semibold text-blue-700 dark:text-blue-300 py-1 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                            {language === 'ar' ? '✓ تم إرجاع جميع الأصناف للمخزن بنجاح' : '✓ All items returned to inventory'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 5. MODAL: ADD NEW EQUIPMENT ITEM */}
      {isAddEquipModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121214] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Box className="w-5 h-5 text-emerald-700" />
                <span>{language === 'ar' ? 'إضافة مهمة عهدة جديدة للمخزن' : 'Add New Equipment Item'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddEquipModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEquipmentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">
                  {language === 'ar' ? 'اسم المهمة / الصنف *' : 'Equipment Name *'}
                </label>
                <input
                  type="text"
                  value={newEquipName}
                  onChange={(e) => setNewEquipName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: خيمة هرمية 6 أفراد' : 'e.g. Pyramid Tent 6-person'}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">
                    {language === 'ar' ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={newEquipCatId}
                    onChange={(e) => setNewEquipCatId(Number(e.target.value))}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                  >
                    {INITIAL_EQUIPMENT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">
                    {language === 'ar' ? 'كود الصنف (SKU)' : 'SKU Code'}
                  </label>
                  <input
                    type="text"
                    value={newEquipSku}
                    onChange={(e) => setNewEquipSku(e.target.value)}
                    placeholder="EQ-TNT-001"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">
                    {language === 'ar' ? 'الرصيد الإجمالي *' : 'Total Stock *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newEquipQty}
                    onChange={(e) => setNewEquipQty(Number(e.target.value))}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">
                    {language === 'ar' ? 'مكان التخزين' : 'Storage Bay'}
                  </label>
                  <input
                    type="text"
                    value={newEquipBay}
                    onChange={(e) => setNewEquipBay(e.target.value)}
                    placeholder={language === 'ar' ? 'المخزن الرئيسي - رف 2' : 'Bay A-3'}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">
                    {language === 'ar' ? 'الحالة' : 'Condition'}
                  </label>
                  <select
                    value={newEquipCondition}
                    onChange={(e) => setNewEquipCondition(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                  >
                    <option value="new">{language === 'ar' ? 'جديد (New)' : 'New'}</option>
                    <option value="good">{language === 'ar' ? 'جيد جداً (Good)' : 'Good'}</option>
                    <option value="needs_repair">{language === 'ar' ? 'يحتاج صيانة (Needs Repair)' : 'Needs Repair'}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddEquipModalOpen(false)}
                  disabled={isSubmittingEquip}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEquip || !newEquipName.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmittingEquip && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{language === 'ar' ? 'حفظ وإضافة للمخزن' : 'Save & Register Gear'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: EDIT EQUIPMENT ITEM */}
      {editingEquip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121214] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                <span>{language === 'ar' ? 'تعديل بيانات مهمة العهدة' : 'Edit Equipment Item'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingEquip(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditEquipmentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">
                  {language === 'ar' ? 'اسم المهمة / الصنف *' : 'Equipment Name *'}
                </label>
                <input
                  type="text"
                  value={editingEquip.name}
                  onChange={(e) => setEditingEquip({ ...editingEquip, name: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">
                    {language === 'ar' ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={editingEquip.category_id}
                    onChange={(e) => setEditingEquip({ ...editingEquip, category_id: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  >
                    {INITIAL_EQUIPMENT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">
                    {language === 'ar' ? 'كود الصنف (SKU)' : 'SKU Code'}
                  </label>
                  <input
                    type="text"
                    value={editingEquip.sku}
                    onChange={(e) => setEditingEquip({ ...editingEquip, sku: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">
                    {language === 'ar' ? 'الرصيد الإجمالي *' : 'Total Stock *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingEquip.total_quantity}
                    onChange={(e) => setEditingEquip({ ...editingEquip, total_quantity: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">
                    {language === 'ar' ? 'مكان التخزين' : 'Storage Bay'}
                  </label>
                  <input
                    type="text"
                    value={editingEquip.storage_bay}
                    onChange={(e) => setEditingEquip({ ...editingEquip, storage_bay: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">
                    {language === 'ar' ? 'الحالة' : 'Condition'}
                  </label>
                  <select
                    value={editingEquip.condition}
                    onChange={(e) => setEditingEquip({ ...editingEquip, condition: e.target.value as 'new' | 'good' | 'needs_repair' })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="new">{language === 'ar' ? 'جديد (New)' : 'New'}</option>
                    <option value="good">{language === 'ar' ? 'جيد جداً (Good)' : 'Good'}</option>
                    <option value="needs_repair">{language === 'ar' ? 'يحتاج صيانة (Needs Repair)' : 'Needs Repair'}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingEquip(null)}
                  disabled={isSubmittingEquip}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEquip || !editingEquip.name.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmittingEquip && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: DELETE EQUIPMENT ENTIRELY */}
      {deletingEquip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121214] rounded-2xl border border-red-200 dark:border-red-900/60 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {language === 'ar' ? 'تأكيد حذف مهمة العهدة نهائياً' : 'Confirm Delete Equipment'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {language === 'ar'
                  ? `هل أنت متأكد من حذف المهمة (${deletingEquip.name}) بكود [${deletingEquip.sku}] نهائياً من سجلات العهدة؟ سيتم حذف بيانات الرصيد وسجلات الحجز المرتبطة بها.`
                  : `Are you sure you want to permanently delete equipment (${deletingEquip.name}) [${deletingEquip.sku}]? All inventory counts and booking associations will be removed.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingEquip(null)}
                disabled={isSubmittingEquip}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeleteEquipmentSubmit}
                disabled={isSubmittingEquip}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingEquip && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{language === 'ar' ? 'نعم، حذف نهائي' : 'Yes, Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
