"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { formatRupiah } from "@/utils/format";
import { ShoppingCart, Search, MapPin, Tag } from "lucide-react";
import ProductCard from "@/components/pos/ProductCard";
import CartItem from "@/components/pos/CartItem";
import PaymentMethodSelector from "@/components/pos/PaymentMethodSelector";
import EndShiftButton from "@/components/pos/EndShiftButton";
import { checkOrOpenShift } from "@/actions/shift";

// --- Tipe Data TypeScript ---
type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category_id: string;
  event_id: string;
  categories?: { name: string; color: string };
  events?: { name: string };
};

type CartItem_Type = Product & {
  quantity: number;
  notes: string;
  cartId: string;
};

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // Filter States
  const [activeEventId, setActiveEventId] = useState<string>("ALL");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem_Type[]>([]);
  const [loading, setLoading] = useState(true);

  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  //shift
  const [activeShiftId, setActiveShiftId] = useState<string>("");

  const supabase = createClient();

  useEffect(() => {
    fetchPosData();
  }, []);

  const fetchPosData = async () => {
    try {
      // 1. CARA PALING AMAN MENGAMBIL USER DI CLIENT COMPONENT
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        alert(
          "Sesi login tidak valid. Sistem tidak bisa mengenali Kasir. Silakan Logout dan Login ulang.",
        );
        return;
      }

      const userId = session.user.id;
      console.log("Hasil checkOrOpenShift:", userId);

      // 2. JALANKAN SERVER ACTION DAN TANGKAP ERROR JIKA ADA
      const shiftResult = await checkOrOpenShift(userId);

      if (shiftResult.success && shiftResult.shiftId) {
        setActiveShiftId(shiftResult.shiftId);
        console.log("Shift Aktif Berhasil Dibuat:", shiftResult.shiftId);
      } else {
        // INI AKAN MEMUNCULKAN PENYEBAB ASLI ERRORNYA DI LAYAR
        alert("Sistem Gagal Membuka Shift: " + shiftResult.message);
      }

      // 3. FETCH DATA LAINNYA
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true);
      if (eventData) {
        setEvents(eventData);
        if (eventData.length > 0) setActiveEventId(eventData[0].id);
      }

      const { data: catData } = await supabase.from("categories").select("*");
      if (catData) setCategories(catData);

      const { data: prodData } = await supabase
        .from("products")
        .select("*, categories(name, color), events(name)")
        .eq("is_available", true);
      if (prodData) setProducts(prodData);
    } catch (err: any) {
      alert("Terjadi kesalahan sistem: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIKA KERANJANG ---
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.id === product.id && item.notes === "",
      );

      if (existingItemIndex !== -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + 1,
        };
        return newCart;
      }

      const newCartItem: CartItem_Type = {
        ...product,
        quantity: 1,
        notes: "",
        cartId: Math.random().toString(36).substring(7),
      };
      return [...prevCart, newCartItem];
    });
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.cartId === cartId) {
          const newQuantity = item.quantity + delta;
          return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (cartId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartId !== cartId));
  };

  const updateNotes = (cartId: string, notes: string) => {
    setCart((prevCart) =>
      prevCart.map((c) => (c.cartId === cartId ? { ...c, notes } : c)),
    );
  };

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Keranjang masih kosong!");
    if (!activeShiftId)
      return alert("Error: Shift belum aktif. Silakan muat ulang halaman."); // <--- Validasi tambahan

    setIsCheckoutLoading(true);

    try {
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          shift_id: activeShiftId, // <--- GUNAKAN ID SHIFT ASLI
          customer_name: customerName || "Pelanggan Umum",
          payment_method: paymentMethod,
          total_amount: totalPrice,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      const newTransactionId = transactionData.id;
      const itemsToInsert = cart.map((item) => ({
        transaction_id: newTransactionId,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price,
        notes: item.notes,
      }));

      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      alert("Transaksi Berhasil Disimpan ke Supabase! 🎉");
      setCart([]);
      setCustomerName("");
    } catch (error: any) {
      console.error("Gagal simpan transaksi:", error);
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // --- Filtered products (Search + Event + Category) ---
  const filteredProducts = products.filter((p) => {
    const matchEvent = activeEventId === "ALL" || p.event_id === activeEventId;
    const matchCategory =
      activeCategoryId === "ALL" || p.category_id === activeCategoryId;
    const matchSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchEvent && matchCategory && matchSearch;
  });

  return (
    <div className="flex h-screen w-full bg-surface overflow-hidden">
      {/* ========== LEFT PANEL — PRODUCT AREA (70%) ========== */}
      <main className="flex flex-col w-[70%] h-full border-r border-outline/10">
        {/* --- Top Navigation Bar & Filters --- */}
        <div className="flex flex-col w-full bg-surface-container-low/50 border-b border-outline/5">
          <header className="flex justify-between items-center px-8 py-4">
            <div className="text-2xl font-headline font-bold tracking-tighter text-on-surface">
              POSinAja
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative group">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-surface rounded-xl border border-outline/10 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-slate-400 focus:outline-none shadow-sm"
                  placeholder="Cari menu..."
                />
              </div>
            </div>

            {/* Keluar Shift Button */}
            <EndShiftButton shiftId={activeShiftId} />
          </header>

          {/* --- Filters Section (Events & Categories) --- */}
          <div className="px-8 pb-4 flex flex-col gap-3">
            {/* 1. Baris Event (Lokasi) */}
            <div className="flex gap-3 overflow-x-auto hide-scrollbar items-center">
              <div className="flex items-center gap-1.5 mr-2 text-slate-400">
                <MapPin size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Event:
                </span>
              </div>
              <button
                onClick={() => setActiveEventId("ALL")}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                  activeEventId === "ALL"
                    ? "bg-slate-800 text-white"
                    : "bg-surface text-on-surface hover:bg-surface-container-low border border-outline/10"
                }`}
              >
                Semua Event Aktif
              </button>
              {events.length === 0 ? (
                <span className="text-xs text-slate-400 italic px-2">
                  Belum ada event aktif...
                </span>
              ) : (
                events.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setActiveEventId(ev.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                      activeEventId === ev.id
                        ? "bg-primary text-on-primary ring-2 ring-primary/20"
                        : "bg-surface text-on-surface hover:bg-surface-container-low border border-outline/10"
                    }`}
                  >
                    {ev.name}
                  </button>
                ))
              )}
            </div>

            {/* 2. Baris Category Pills */}
            <div className="flex gap-3 overflow-x-auto hide-scrollbar items-center">
              <div className="flex items-center gap-1.5 mr-2 text-slate-400">
                <Tag size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Kategori:
                </span>
              </div>
              <button
                onClick={() => setActiveCategoryId("ALL")}
                className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                  activeCategoryId === "ALL"
                    ? "bg-primary text-on-primary"
                    : "bg-surface text-on-surface hover:bg-surface-container-low border border-outline/10"
                }`}
              >
                Semua Menu
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className="px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-2"
                  style={{
                    backgroundColor:
                      activeCategoryId === cat.id ? cat.color : "#ffffff",
                    color: activeCategoryId === cat.id ? "#ffffff" : cat.color,
                    border: `1px solid ${cat.color}40`,
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- Product Grid --- */}
        <section className="flex-1 overflow-y-auto px-8 pb-8 pt-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-4">
              <Search size={48} className="opacity-20" />
              <p className="text-lg">No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => addToCart(product)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ========== RIGHT PANEL — CART SIDEBAR (30%) ========== */}
      <aside className="w-[30%] h-full bg-white flex flex-col p-6 space-y-6 rounded-l-3xl shadow-[0px_20px_40px_rgba(25,28,30,0.06)] z-20">
        {/* --- Cart Header --- */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-headline font-bold text-2xl text-on-surface">
              Cart Overview
            </h2>
            <span className="text-primary bg-primary-fixed p-2 rounded-xl">
              <ShoppingCart size={20} />
            </span>
          </div>
          <p className="text-sm font-medium text-slate-400">
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </p>
        </div>

        {/* --- Scrollable Cart List --- */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 hide-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
              <ShoppingCart size={48} className="opacity-20" />
              <p>Belum ada pesanan</p>
            </div>
          ) : (
            cart.map((item) => (
              <CartItem
                key={item.cartId}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                onNotesChange={updateNotes}
              />
            ))
          )}
        </div>

        {/* --- Bottom Summary Section --- */}
        <div className="pt-6 border-t-2 border-dashed border-slate-100 space-y-5 mt-auto">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nama Pelanggan
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest text-sm focus:outline-none text-on-surface transition-all"
            />
          </div>

          {/* Summary Details */}
          <div className="space-y-3 px-1">
            <div className="flex justify-between items-center text-sm font-medium text-slate-500">
              <span>Subtotal</span>
              <span className="text-on-surface">
                {formatRupiah(totalPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 mt-2">
              <span className="font-headline font-bold text-lg text-on-surface">
                Total
              </span>
              <span className="font-headline font-extrabold text-2xl text-primary">
                {formatRupiah(totalPrice)}
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <PaymentMethodSelector
            selected={paymentMethod}
            onSelect={setPaymentMethod}
          />

          {/* CTA Button */}
          <button
            disabled={cart.length === 0 || isCheckoutLoading}
            onClick={handleCheckout}
            className="w-full py-5 rounded-2xl bg-primary-container text-on-primary font-headline font-extrabold text-lg shadow-xl shadow-primary/10 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2"
          >
            {isCheckoutLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Memproses...
              </>
            ) : (
              "Process Payment"
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}
