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
  Lock,
  ShieldAlert,
} from 'lucide-react';

export default function InventoryPage() {
  const { language, t } = useLanguage();
  const { currentUser, currentUnit, isSuperAdmin, can, logAction, accessibleUnits } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
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

  // Sync unit when user switches or accessibleUnits changes
  React.useEffect(() => {
    if (accessibleUnits.length > 0 && !accessibleUnits.some((u) => u.id === selectedUnitId)) {
      setSelectedUnitId(accessibleUnits[0].id);
    }
  }, [accessibleUnits, selectedUnitId]);

  const [purpose, setPurpose] = useState<string>('');

  const canBook = isSuperAdmin || can('inventory.book', selectedUnitId);
  const canApprove = isSuperAdmin || can('inventory.approve');

  // Cart of requested items: { [equipmentId]: requestedQuantity }
  const [cart, setCart] = useState<Record<number, number>>({ 1: 5, 5: 2 });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<EquipmentCategory[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    if (selectedCategory === 'all') return equipmentList;
    return equipmentList.filter((item) => item.category_id === selectedCategory);
  }, [selectedCategory, equipmentList]);

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

    // Persist to Microsoft SQL Server
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
            text: t('booking_success'),
          });
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

  // Quartermaster Quick Action to Approve Booking
  const handleApproveBooking = (bookingId: string) => {
    fetch('/api/inventory/bookings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        status: 'approved',
        approverId: currentUser?.id,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          fetchBookings();
          fetchInventory();
        }
      })
      .catch((err) => console.error('Approve booking error:', err));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#161D1A] p-5 rounded-xl border border-[#E2DED6] dark:border-[#27342F] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#B45309]" strokeWidth={2} />
            <span>{t('book_equipment')}</span>
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            {language === 'ar'
              ? 'محرك التحقق من عدم تعارض حجوزات المهمات والتخييم مع حساب الأرصدة المتاحة في الوقت الفعلي'
              : 'Real-time equipment availability engine preventing overlapping date overbooking.'}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FDF6EC] dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs font-bold text-[#B45309] dark:text-amber-300 shadow-2xs">
          <Shield className="w-4 h-4 text-[#B45309]" strokeWidth={2} />
          <span>{language === 'ar' ? 'وضع إدارة العهدة' : 'Quartermaster Mode'}</span>
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

      {/* Main Grid: Date Selection & Available Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Equipment Catalog with dynamic remaining-stock indicators */}
        <div className="lg:col-span-2 space-y-3">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'bg-white dark:bg-[#161D1A] border border-[#E2DED6] dark:border-[#27342F] text-stone-700 dark:text-stone-300 hover:bg-[#F1EFEA]'
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
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'bg-white dark:bg-[#161D1A] border border-[#E2DED6] dark:border-[#27342F] text-stone-700 dark:text-stone-300 hover:bg-[#F1EFEA]'
                }`}
              >
                {cat.name.split(' (')[0]}
              </button>
            ))}
          </div>

          {/* Equipment Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredEquipment.map((item) => {
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
                  className={`p-3.5 rounded-lg border bg-white dark:bg-[#121214] flex flex-col justify-between transition-colors ${
                    reqQty > 0
                      ? 'border-emerald-800 dark:border-emerald-600 ring-1 ring-emerald-800/30'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 px-1.5 py-0.2 rounded border border-zinc-200 dark:border-zinc-700">
                        {item.sku}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        {item.condition}
                      </span>
                    </div>

                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm leading-snug">{item.name}</h4>
                    <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-2">
                      <span>{item.storage_bay}</span>
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
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, reqQty - 1)}
                        className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-7 text-center text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {reqQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, reqQty + 1)}
                        disabled={reqQty >= check.availableQuantity}
                        className="w-6 h-6 rounded bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white disabled:bg-zinc-100 disabled:dark:bg-zinc-800 disabled:text-zinc-400 text-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Checkout Request Form & Active Bookings */}
        <div className="space-y-4">
          {/* Booking Request Form */}
          <form
            onSubmit={handleSubmitBooking}
            className="p-4 rounded-lg bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 space-y-3"
          >
            <div className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100 text-xs">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
              <span>طلب حجز عهدة جديد</span>
            </div>

            {/* Date Range Selectors */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 mb-1 block">{t('start_date')}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 mb-1 block">{t('end_date')}</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
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
                className={`w-full border rounded-md px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-colors ${
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
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                required
              />
            </div>

            {/* Cart Summary */}
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-md border border-zinc-200 dark:border-zinc-800 text-xs">
              <span className="font-medium text-zinc-700 dark:text-zinc-300 block mb-1">المهمات المحددة:</span>
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

            {/* If booking permission is revoked */}
            {!canBook && (
              <div className="p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-400 text-xs">
                <div className="font-semibold">
                  {language === 'ar' ? 'صلاحية الحجز محجوبة (قرار إداري)' : 'Booking Permission Revoked'}
                </div>
                <div className="text-[11px] text-rose-700 dark:text-rose-500 mt-0.5">
                  {language === 'ar'
                    ? 'تم تعطيل حجز العهدة لحسابك بقرار مخصص من قائد الفوج.'
                    : 'Equipment checkout has been explicitly disabled for your profile.'}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!canBook}
              className={`w-full py-2 px-3 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                canBook
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{t('submit_booking')}</span>
            </button>
          </form>

          {/* Active Bookings List (Directive 4.A) */}
          <div className="bg-white dark:bg-[#121214] rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-2.5">
            <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              سجل الحجوزات النشطة
            </h4>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {bookings.map((b) => (
                <div key={b.id} className="py-2.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">{b.purpose}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        b.status === 'approved'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : b.status === 'pending'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-mono tabular-nums">
                    <span>{b.start_date}</span>
                    <span>&rarr;</span>
                    <span>{b.end_date}</span>
                  </div>

                  {b.status === 'pending' && canApprove && (
                    <button
                      type="button"
                      onClick={() => handleApproveBooking(b.id)}
                      className="w-full py-1 text-xs rounded bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 font-medium transition-colors cursor-pointer"
                    >
                      موافقة أمين العهدة (Approve)
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
