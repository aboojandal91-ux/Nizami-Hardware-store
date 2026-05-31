import React, { useState, useEffect } from 'react';
import { Product, Customer, CartItem, SavedCart, StoreSettings } from '../types';
import { translations, Language } from '../translations';
import { 
  Search, 
  ShoppingCart, 
  Users, 
  Trash2, 
  Pause, // alternate for hold
  PlayCircle, // resume
  CheckSquare, 
  Tags, 
  Percent, 
  Coins, 
  CreditCard, 
  Scale, 
  History,
  FolderLock,
  X,
  Printer,
  ChevronRight,
  Plus,
  Minus,
  Check,
  AlertCircle
} from 'lucide-react';

interface POSTabProps {
  products: Product[];
  customers: Customer[];
  activeCart: CartItem[];
  setActiveCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  heldCarts: SavedCart[];
  setHeldCarts: React.Dispatch<React.SetStateAction<SavedCart[]>>;
  priceTier: 'retail' | 'wholesale';
  setPriceTier: (tier: 'retail' | 'wholesale') => void;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  onCheckout: (
    cartItems: CartItem[], 
    customerId: string | null, 
    paymentMethod: 'cash' | 'card' | 'khata',
    tier: 'retail' | 'wholesale'
  ) => void;
  lang?: Language;
  storeSettings: StoreSettings;
}

export default function POSTab({
  products,
  customers,
  activeCart,
  setActiveCart,
  heldCarts,
  setHeldCarts,
  priceTier,
  setPriceTier,
  selectedCustomerId,
  setSelectedCustomerId,
  onCheckout,
  lang = 'en',
  storeSettings,
}: POSTabProps) {
  const t = translations[lang];
  // POS States
  const [productQuery, setProductQuery] = useState('');
  const [rightBarcodeQuery, setRightBarcodeQuery] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'khata'>('cash');
  
  // Held drawer toggle
  const [showHeldDrawer, setShowHeldDrawer] = useState(false);
  const [holdCartName, setHoldCartName] = useState('');
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [pendingTierToSwitch, setPendingTierToSwitch] = useState<'retail' | 'wholesale' | null>(null);

  // Success / Receipt Modal
  const [lastCheckedOutReceipt, setLastCheckedOutReceipt] = useState<{
    id: string;
    date: string;
    items: CartItem[];
    customerName: string;
    subtotal: number;
    discountAmt: number;
    total: number;
    paymentMethod: 'cash' | 'card' | 'khata';
  } | null>(null);

  // Find Customer Context details
  const currentCustomer = customers.find(c => c.id === selectedCustomerId);

  // Toggle Pricing Tier naturally if customer is Contractor
  useEffect(() => {
    if (currentCustomer?.isContractor) {
      setPriceTier('wholesale');
    } else {
      setPriceTier('retail');
    }
  }, [selectedCustomerId, currentCustomer]);

  // Search filter
  const searchResults = products.filter(p => {
    if (!productQuery) return false;
    const query = productQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query) ||
      p.location.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }).slice(0, 5); // Limit to top 5 fast matches

  // Add Item to active cart helper
  const handleAddToBag = (product: Product) => {
    // Check if stock is absolute zero
    if (product.stock === 0) {
      alert(`Warning: ${product.name} is currently OUT OF STOCK.`);
    }

    const existingIndex = activeCart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...activeCart];
      const nextQty = updated[existingIndex].quantity + 1;
      
      if (nextQty > product.stock) {
        alert(`Note: Quantity exceeds current physical shelf stock of ${product.stock} ${product.unit}.`);
      }
      updated[existingIndex].quantity = nextQty;
      setActiveCart(updated);
    } else {
      setActiveCart([...activeCart, {
        product,
        quantity: 1,
        sellingPrice: priceTier === 'wholesale' ? product.wholesalePrice : product.retailPrice
      }]);
    }
    setProductQuery(''); // Reset search bar
  };

  // Adjust quantities
  const handleQuantityDelta = (index: number, delta: number) => {
    const updated = [...activeCart];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      if (newQty > updated[index].product.stock) {
        alert(`Note: Quantity exceeds shelf inventory of ${updated[index].product.stock} ${updated[index].product.unit}.`);
      }
      updated[index].quantity = newQty;
    }
    setActiveCart(updated);
  };

  // Custom Price overrides e.g. custom wholesale bid
  const handlePriceOverride = (index: number, val: string) => {
    const updated = [...activeCart];
    if (val === '') {
      updated[index].sellingPrice = 0;
      setActiveCart(updated);
    } else {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) {
        updated[index].sellingPrice = parsed;
        setActiveCart(updated);
      }
    }
  };

  // Switch Tiers manually & update active cart prices
  const handleTierSwitch = (tier: 'retail' | 'wholesale') => {
    setPriceTier(tier);
    const updated = activeCart.map(item => ({
      ...item,
      sellingPrice: tier === 'wholesale' ? item.product.wholesalePrice : item.product.retailPrice
    }));
    setActiveCart(updated);
  };

  // Calculations
  const cartSubtotal = activeCart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const discountAmount = cartSubtotal * (discountPercent / 100);
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);

  // Hold active checkout
  const handleHoldCart = () => {
    if (activeCart.length === 0) {
      alert('Cannot hold empty cart.');
      return;
    }
    const nameToUse = holdCartName.trim() || `Ticket #${heldCarts.length + 1} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    
    const newHold: SavedCart = {
      id: 'held-' + Date.now(),
      name: nameToUse,
      items: [...activeCart],
      priceTier,
      customerId: selectedCustomerId,
      heldAt: new Date().toISOString()
    };

    setHeldCarts([...heldCarts, newHold]);
    setActiveCart([]);
    setHoldCartName('');
    setShowHoldModal(false);
    setSelectedCustomerId(null);
    setDiscountPercent(0);
  };

  // Resume Checkout
  const handleResumeCart = (held: SavedCart) => {
    // If active cart has items, ask to hold or empty first
    if (activeCart.length > 0) {
      if (!confirm('Discard active basket items and restore this held ticket?')) {
        return;
      }
    }
    setActiveCart(held.items);
    setPriceTier(held.priceTier);
    setSelectedCustomerId(held.customerId);
    
    // Remove from held
    setHeldCarts(heldCarts.filter(c => c.id !== held.id));
    setShowHeldDrawer(false);
  };

  // Process pay settle
  const handleSettleCheckout = () => {
    if (activeCart.length === 0) {
      alert('Cart is empty. Add products to bill.');
      return;
    }

    if (paymentMethod === 'khata' && !selectedCustomerId) {
      alert('Error: You must assign a registered Contractor/Customer to write on credit ledger.');
      return;
    }

    // Safety check overall stock quantity
    const warnings: string[] = [];
    activeCart.forEach(item => {
      if (item.quantity > item.product.stock) {
        warnings.push(`${item.product.name} (Billed: ${item.quantity}, In Stock: ${item.product.stock})`);
      }
    });

    if (warnings.length > 0) {
      if (!confirm(`Warning: Stock balances are insufficient for:\n${warnings.join('\n')}\n\nForce proceed with checkout?`)) {
        return;
      }
    }

    // Execute callback
    onCheckout(activeCart, selectedCustomerId, paymentMethod, priceTier);

    // Save Receipt view details for modal display
    setLastCheckedOutReceipt({
      id: 'rec-' + Math.floor(100000 + Math.random() * 900000).toString(),
      date: new Date().toISOString(),
      items: [...activeCart],
      customerName: currentCustomer ? currentCustomer.name : 'Walk-in Customer (Retail)',
      subtotal: cartSubtotal,
      discountAmt: discountAmount,
      total: cartTotal,
      paymentMethod
    });

    // Clear active bag
    setActiveCart([]);
    setSelectedCustomerId(null);
    setDiscountPercent(0);
    setPaymentMethod('cash');
  };

  // Fast demo scans
  const demoBarcodeScans = [
    { name: 'Adjustable Steel Wrench', code: '789012345601' },
    { name: 'Drywall Screws Box', code: '789012345602' },
    { name: 'Copper Pipe (1ft)', code: '789012345603' },
    { name: 'Premium Cement bag', code: '789012345604' }
  ];

  const handleManualBarcodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const targetProduct = products.find(p => p.code === productQuery);
    if (targetProduct) {
      handleAddToBag(targetProduct);
    } else {
      alert(`Barcode SKU "${productQuery}" not registered. Try search by keyword.`);
    }
  };

  const handleRightBarcodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = rightBarcodeQuery.trim();
    if (!query) return;
    const targetProduct = products.find(p => p.code === query || p.id === query || p.code.toLowerCase() === query.toLowerCase());
    if (targetProduct) {
      handleAddToBag(targetProduct);
      setRightBarcodeQuery('');
    } else {
      alert(`Barcode SKU "${query}" not registered.`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT: Item selection and search counter */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Head Bar: Tiers and Holds */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 font-sans">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase font-mono tracking-wider">
              {lang === 'ur' ? 'پرائسنگ انجن:' : 'Pricing Engine:'}
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                onClick={() => setPendingTierToSwitch('retail')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${priceTier === 'retail' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {lang === 'ur' ? 'عام ریٹیل ریٹ' : 'Retail Tariff'}
              </button>
              <button
                onClick={() => setPendingTierToSwitch('wholesale')}
                className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1 cursor-pointer ${priceTier === 'wholesale' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500 hover:text-blue-500'}`}
              >
                <Tags className="w-3.5 h-3.5" />
                {lang === 'ur' ? 'ٹھیکیدار ہول سیل' : 'Contractor Wholesale'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHeldDrawer(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition cursor-pointer relative shadow-xs"
            >
              <History className="w-4 h-4" />
              {lang === 'ur' ? 'محفوظ شدہ بلز' : 'Held Tickets'}
              {heldCarts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white font-mono text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold outline-3 outline-white animate-bounce-subtle">
                  {heldCarts.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick billing search & simulated gun scan */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 font-sans">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">
              {lang === 'ur' ? 'ہیلی فیکس پروڈکٹس پی او ایس تلاش' : 'Hardware Store Active POS Finder'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'ur' ? 'بارکوڈ اسکین کریں، SKU ٹائپ کریں یا کوئی سپیسیفیکیشن درج کریں (مثلاً پائپ، سیمنٹ)' : 'Scan barcode, type SKU, or search partial spec text (e.g., "1/2 inch", "cement").'}
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleManualBarcodeSubmit} className="relative select-none font-mono">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'ur' ? 'نام، SKU یا بار نمبر اسکین کریں...' : 'Search part catalog OR scan barcode numbers...'}
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              className="w-full pl-10 pr-28 py-2 bg-slate-100 border border-slate-200 focus:ring-2 focus:ring-blue-500 rounded text-xs transition outline-hidden font-mono"
            />
            {productQuery && (
              <div className="absolute right-2 top-1.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setProductQuery('')}
                  className="text-slate-400 hover:text-slate-600 transition p-0.5 cursor-pointer"
                  title="Clear query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white rounded text-[10px] font-mono select-none cursor-pointer"
                >
                  {lang === 'ur' ? 'اسکین چالو کریں' : 'Enter Scan'}
                </button>
              </div>
            )}
          </form>

          {/* Real-time search auto dropdown list */}
          {productQuery && (
            <div className="border border-slate-250 rounded bg-slate-50 overflow-hidden shadow-md divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2 bg-slate-100/50 text-[10px] text-slate-400 font-mono tracking-widest uppercase flex justify-between items-center">
                <span>Fast matched items</span>
                <span>Select to add to cart</span>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 italic">
                  No matches for "{productQuery}". Ensure code is registered.
                </div>
              ) : (
                searchResults.map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => handleAddToBag(prod)}
                    className="w-full text-left p-2.5 hover:bg-blue-50 hover:text-blue-950 flex items-center justify-between text-xs transition cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold block text-slate-800">{prod.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">CODE: {prod.code} | Location: {prod.location}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold block text-slate-900 font-mono">
                        Rs. {priceTier === 'wholesale' ? prod.wholesalePrice.toFixed(2) : prod.retailPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">Stock: {prod.stock} {prod.unit}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Quick Click Simulation */}
          <div className="pt-2">
            <span className="text-[10px] text-slate-400 font-semibold font-mono uppercase block mb-2">Simulate Hardware Barcode Laser Gun:</span>
            <div className="flex flex-wrap gap-2">
              {demoBarcodeScans.map(scan => (
                <button
                  key={scan.code}
                  onClick={() => {
                    const matched = products.find(p => p.code === scan.code);
                    if (matched) {
                      handleAddToBag(matched);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 rounded text-[10px] font-semibold border border-slate-200 transition cursor-pointer flex items-center gap-1"
                >
                  <ShoppingCart className="w-3 h-3 text-slate-400" />
                  Scan: {scan.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Sale Register Grid */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h4 className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-slate-400" />
              Active Checkouts Queue Line Item
            </h4>
            <span className="text-[10px] font-bold font-mono bg-slate-200 px-2.5 py-0.5 text-slate-700 rounded">
              {activeCart.length} LineItems
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
            {activeCart.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Active cash ticket registry is clear.
                <div className="mt-2 text-[10px] text-slate-300">Scan or search products to begin checkout session</div>
              </div>
            ) : (
              activeCart.map((item, idx) => (
                <div key={item.product.id} className="p-4 flex items-center justify-between gap-4 text-xs hover:bg-slate-50/50 transition">
                  <div className="flex-1 space-y-1">
                    <span className="font-semibold text-slate-900 block">{item.product.name}</span>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">SKU: {item.product.code}</span>
                      <span>Unit: <b className="text-slate-700 font-semibold">{item.product.unit}</b></span>
                      <span>Coordinates: <b className="text-slate-600 font-mono">{item.product.location}</b></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Quantity counter with stock alerts */}
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        onClick={() => handleQuantityDelta(idx, -1)}
                        className="p-1 px-2.5 hover:bg-slate-100 active:bg-slate-200 text-slate-500"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 py-0.5 text-xs text-slate-800 font-bold font-mono">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityDelta(idx, 1)}
                        className="p-1 px-2.5 hover:bg-slate-100 active:bg-slate-200 text-slate-500"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Price Override Box */}
                    <div className="w-24 text-right">
                      <div className="text-[10px] text-slate-400 mb-0.5">Price / {item.product.unit}</div>
                      <div className="flex items-center border border-slate-200 rounded px-1 text-slate-800 bg-white shadow-xs max-w-[85px]">
                        <span className="text-[10px] text-slate-400 mr-0.5">Rs.</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.sellingPrice || ''}
                          onChange={(e) => handlePriceOverride(idx, e.target.value)}
                          className="w-full text-right font-mono text-xs outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Total Line value */}
                    <div className="w-20 text-right">
                      <div className="text-[10px] text-slate-400 mb-0.5">Extensions</div>
                      <span className="font-bold text-slate-900 font-mono">
                        Rs. {(item.sellingPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => handleQuantityDelta(idx, -item.quantity)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Selected Customer, Payment, Calculations & Checkout drawer */}
      <div className="space-y-6">
        
        {/* Customer Assignment panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
          <h4 className="font-semibold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Users className="w-4 h-4 text-slate-400" />
            Invoice Customer (Required for Khata Credit)
          </h4>

          <div className="space-y-2.5 text-xs">
            <select
              value={selectedCustomerId || ''}
              onChange={(e) => setSelectedCustomerId(e.target.value || null)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700 outline-hidden hover:bg-slate-100/60 transition"
            >
              <option value="">-- Generic Walk-in Cash Sale --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.isContractor ? '[🎖️ Contractor]' : '[Credit Profile]'}
                </option>
              ))}
            </select>

            {currentCustomer ? (
              <div className="p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl space-y-1 text-[11px] text-indigo-950">
                <div className="flex justify-between font-semibold">
                  <span>Assigned Account:</span>
                  <span>{currentCustomer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phone Directory:</span>
                  <span className="font-mono">{currentCustomer.phone}</span>
                </div>
                {currentCustomer.isContractor && (
                  <div className="text-emerald-700 font-bold font-sans mt-1">
                    🎖️ Wholesale price schedule has been applied automatically.
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-indigo-100 mt-2">
                  <span>Active Credit Khata Balance:</span>
                  <span className={`font-mono font-bold ${currentCustomer.balance > 0 ? 'text-orange-600' : 'text-slate-600'}`}>
                    Rs. {currentCustomer.balance.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">No account synced. Cash & Card transactions permitted.</p>
            )}
          </div>
        </div>

        {/* Cash Desk Live Search & Scanned List */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
          <h4 className="font-semibold text-slate-800 text-xs flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="flex items-center gap-1.5 font-sans">
              <ShoppingCart className="w-4 h-4 text-emerald-500" />
              {lang === 'ur' ? 'کیش ڈیسک فعال اسکیننگ آئٹمز' : 'Cash Desk Active Scanned Items'}
            </span>
            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
              {activeCart.length} {lang === 'ur' ? 'آئٹمز' : 'items'}
            </span>
          </h4>

          {/* Direct checkout scanning field */}
          <form onSubmit={handleRightBarcodeSubmit} className="relative font-mono select-none">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'ur' ? 'یہاں براہ راست بارکوڈ اسکین کریں...' : 'Scan / Type Barcode SKU directly here...'}
              value={rightBarcodeQuery}
              onChange={(e) => setRightBarcodeQuery(e.target.value)}
              className="w-full pl-8 pr-16 py-1.5 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 rounded text-xs outline-hidden font-mono"
            />
            {rightBarcodeQuery && (
              <button
                type="submit"
                className="absolute right-1 top-1.5 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-semibold cursor-pointer"
              >
                {lang === 'ur' ? 'شامل کریں' : 'Add Code'}
              </button>
            )}
          </form>

          {/* Matches inside the right sidebar */}
          {rightBarcodeQuery && (
            <div className="border border-slate-150 rounded bg-slate-50 overflow-hidden divide-y divide-slate-150 max-h-36 overflow-y-auto">
              {products.filter(p => {
                const q = rightBarcodeQuery.toLowerCase();
                return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
              }).slice(0, 3).map(prod => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => {
                    handleAddToBag(prod);
                    setRightBarcodeQuery('');
                  }}
                  className="w-full text-left p-2 hover:bg-emerald-50 text-[11px] flex justify-between items-center transition cursor-pointer"
                >
                  <span className="font-semibold text-slate-800 truncate block max-w-[150px]">{prod.name}</span>
                  <span className="font-mono text-[10px] text-emerald-600 font-bold">Rs. {prod.retailPrice}</span>
                </button>
              ))}
            </div>
          )}

          {/* List of active cart items in the Sidebar itself for immediate cash desk verification */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {activeCart.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic text-center py-4 bg-slate-50/50 rounded-lg">
                {lang === 'ur' ? 'کوئی سامان اسکین نہیں کیا گیا ہے۔' : 'No scanning items in counter bag yet.'}
              </p>
            ) : (
              activeCart.map((item, idx) => (
                <div key={`sidebar-${item.product.id}`} className="flex items-center justify-between text-[11px] bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="font-semibold text-slate-800 truncate block">{item.product.name}</span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {item.quantity} {item.product.unit} × Rs. {item.sellingPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Add/minus counter */}
                    <div className="flex items-center bg-white border border-slate-200 rounded">
                      <button
                        type="button"
                        onClick={() => handleQuantityDelta(idx, -1)}
                        className="px-1 hover:bg-slate-100 text-slate-500 font-bold"
                      >
                        -
                      </button>
                      <span className="px-1.5 font-mono text-[10px] text-slate-800 font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityDelta(idx, 1)}
                        className="px-1 hover:bg-slate-100 text-slate-500 font-bold"
                      >
                        +
                      </button>
                    </div>
                    {/* Price total */}
                    <span className="font-mono font-bold text-slate-900 shrink-0 min-w-[50px] text-right">
                      Rs. {(item.sellingPrice * item.quantity).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sales checkout settling engine */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-5 font-sans">
          <h4 className="font-semibold text-slate-800 text-xs border-b border-slate-100 pb-2">
            {lang === 'ur' ? 'بل تصفیہ و ادائیگی (Checkout)' : 'Ticket Checkout Settlement'}
          </h4>

          <div className="space-y-3.5 select-none text-slate-700">
            {/* Value Calculations */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>{lang === 'ur' ? 'کل سامان قیمت:' : 'Items Subtotal:'}</span>
                <span className="font-mono">Rs. {cartSubtotal.toFixed(2)}</span>
              </div>
              
              {/* Dynamic Discount input */}
              <div className="flex justify-between text-slate-500 items-center">
                <span>{lang === 'ur' ? 'خصوصی رعایتی فیصدی %:' : 'Special Bill Discount %:'}</span>
                <div className="flex items-center border border-slate-200 rounded text-slate-800 bg-white font-semibold shadow-xs max-w-[80px]">
                  <input
                    type="number"
                    max="100"
                    min="0"
                    placeholder="0"
                    value={discountPercent || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setDiscountPercent(0);
                      } else {
                        const parsed = parseInt(val, 10);
                        if (!isNaN(parsed)) {
                          setDiscountPercent(Math.max(0, Math.min(100, parsed)));
                        }
                      }
                    }}
                    className="w-full text-right font-mono text-xs outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 p-1 bg-slate-50 border-l border-slate-200">%</span>
                </div>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-orange-600 font-medium font-sans">
                  <span>{lang === 'ur' ? 'بچت کی گئی رقم:' : 'Saved Amount'} ({discountPercent}%):</span>
                  <span className="font-mono">-Rs. {discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between pt-3 border-t border-slate-150 text-base font-bold text-slate-900">
                <span>{lang === 'ur' ? 'خالص واجب الادا رقم (کل):' : 'Net Total:'}</span>
                <span className="font-mono text-xl text-emerald-600">Rs. {cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment selection tabs */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold block mb-1">
                Receipt Payment Schedule:
              </span>
              <div className="grid grid-cols-3 gap-1">
                {/* Cash */}
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-2 rounded-lg cursor-pointer flex flex-col items-center gap-1 transition ${
                    paymentMethod === 'cash' 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span className="text-[10px] font-bold">CASH</span>
                </button>

                {/* Card */}
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2 rounded-lg cursor-pointer flex flex-col items-center gap-1 transition ${
                    paymentMethod === 'card' 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-[10px] font-bold">CARD</span>
                </button>

                {/* Udhaar Khata (Credit) */}
                <button
                  onClick={() => {
                    if (!selectedCustomerId) {
                      alert('Select a registered Contractor first to enable Credit Ledger booking.');
                      return;
                    }
                    setPaymentMethod('khata');
                  }}
                  className={`p-2 rounded-lg cursor-pointer flex flex-col items-center gap-1 transition ${
                    paymentMethod === 'khata' 
                      ? 'bg-orange-600 text-white shadow-xs font-semibold' 
                      : !selectedCustomerId 
                        ? 'opacity-40 bg-slate-50 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                  disabled={!selectedCustomerId}
                >
                  <Users className="w-4 h-4" />
                  <span className="text-[10px] font-bold">UDHAAR (CREDIT)</span>
                </button>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleSettleCheckout}
              disabled={activeCart.length === 0}
              className={`w-full text-center py-3 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                activeCart.length === 0 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white'
              }`}
            >
              <Check className="w-4.5 h-4.5" />
              Settle & Print Ticket Price (Rs. {cartTotal.toFixed(2)})
            </button>

            {/* Hold Cart action */}
            {activeCart.length > 0 && (
              <button
                onClick={() => setShowHoldModal(true)}
                className="w-full text-center py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-semibold transition border border-amber-100 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                Hold Billing Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Held Carts Side Drawers overlay */}
      {showHeldDrawer && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-sm h-full p-6 shadow-xl flex flex-col relative animate-in slide-in-from-right duration-250">
            <button
              onClick={() => setShowHeldDrawer(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Held POS Transactions Queue</h3>
            <p className="text-xs text-slate-500 mb-5">Select a customer's waiting session bag to resume details and checkout.</p>

            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto pr-1">
              {heldCarts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <ShoppingCart className="w-8 h-8 text-slate-350" />
                  <span>No customer sessions are on-hold right now.</span>
                </div>
              ) : (
                heldCarts.map(held => {
                  const itemsCount = held.items.reduce((s, i) => s + i.quantity, 0);
                  const itemsTotal = held.items.reduce((s, i) => s + (i.sellingPrice * i.quantity), 0);

                  return (
                    <div key={held.id} className="py-4 space-y-2 text-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-800">{held.name}</div>
                          <span className="text-[10px] text-slate-400 block">
                            Held at: {new Date(held.heldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-600">Rs. {itemsTotal.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-500">{itemsCount} units in draft cart</span>
                        <div className="flex items-center gap-1.5">
                          {/* Cancel hold */}
                          <button
                            onClick={() => {
                              if (confirm('Discard this held cart?')) {
                                setHeldCarts(heldCarts.filter(c => c.id !== held.id));
                              }
                            }}
                            className="p-1 hover:text-rose-600 cursor-pointer text-slate-400"
                            title="Discard Ticket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Resume */}
                          <button
                            onClick={() => handleResumeCart(held)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-950 text-white rounded font-semibold text-[10px] transition cursor-pointer"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            Resume
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hold name dialog modal */}
      {showHoldModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <h4 className="font-bold text-slate-800 text-sm mb-1">Hold Bill Ticket</h4>
            <p className="text-xs text-slate-500 mb-4">Input a name to recognize this purchase session later.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleHoldCart();
              }}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="e.g., Bob (Plumber Project A)"
                value={holdCartName}
                onChange={(e) => setHoldCartName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-hidden focus:border-emerald-500"
                autoFocus
                required
              />

              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowHoldModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-950 hover:bg-black text-white font-semibold rounded-lg"
                >
                  Save to Hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tariff Switch Confirmation Modal */}
      {pendingTierToSwitch !== null && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl relative animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <Tags className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-slate-800 text-sm">
                {lang === 'ur' ? 'پراائسنگ طریقہ کار کی تصدیق' : 'Apply Tariff Confirmation'}
              </h4>
            </div>
            
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              {lang === 'ur' 
                ? `کیا آپ اس بل کے تمام آئٹمز پر ${pendingTierToSwitch === 'wholesale' ? 'ٹھیکیدار ہول سیل قیمت' : 'ریٹیل قیمت (عام)'} لاگو کرنا چاہتے ہیں؟`
                : `Are you sure you want to apply the ${pendingTierToSwitch === 'wholesale' ? 'Contractor Wholesale Rate' : 'Retail Tariff Rate'} to all items in the active basket?`}
            </p>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPendingTierToSwitch(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-semibold transition cursor-pointer"
              >
                {lang === 'ur' ? 'منسوخ کریں' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTierSwitch(pendingTierToSwitch);
                  setPendingTierToSwitch(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-xs cursor-pointer"
              >
                {lang === 'ur' ? 'جی ہاں، لاگو کریں' : 'Yes, Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Ticket Receipt Modal */}
      {lastCheckedOutReceipt && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            
            {/* Close */}
            <button
              onClick={() => setLastCheckedOutReceipt(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Invoice Ticket Receipt Modal */}
            <div id="pos-receipt-print" className="bg-white p-2 text-slate-800">
              {/* Receipt Content Layout */}
              <div className="text-center space-y-1.5 border-b border-dashed border-slate-200 pb-4 select-none">
                <span className="text-[10px] font-bold font-mono uppercase bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md inline-block">
                  ✔ Bill Settled Successfully
                </span>
                <h4 className="text-sm font-extrabold tracking-tight text-slate-900 mt-2 font-sans uppercase">
                  {storeSettings.storeName}
                </h4>
                <p className="text-[10px] text-slate-500 max-w-[250px] mx-auto leading-relaxed">
                  {storeSettings.storeAddress}
                </p>
                {storeSettings.storePhone && (
                  <p className="text-[9px] text-slate-500 font-mono">
                    Tel: {storeSettings.storePhone}
                  </p>
                )}
                {storeSettings.storeEmail && (
                  <p className="text-[9px] text-slate-500 font-mono text-center">
                    Email: {storeSettings.storeEmail}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">Date: {new Date(lastCheckedOutReceipt.date).toLocaleString()}</p>
                <p className="text-[11px] font-mono text-slate-700 font-bold">Invc: {lastCheckedOutReceipt.id}</p>
              </div>

              <div className="py-4 border-b border-dashed border-slate-200 text-[11px] space-y-2 select-none">
                <div className="flex justify-between font-semibold">
                  <span>Account Client:</span>
                  <span>{lastCheckedOutReceipt.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Ref Payment Option:</span>
                  <span className="font-mono uppercase font-bold text-slate-800">{lastCheckedOutReceipt.paymentMethod}</span>
                </div>
              </div>

              {/* Items */}
              <div className="py-4 border-b border-dashed border-slate-200 text-[11px] space-y-3">
                {lastCheckedOutReceipt.items.map(item => (
                  <div key={item.product.id} className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <span className="font-medium text-slate-800 block">{item.product.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {item.quantity} {item.product.unit} × Rs. {item.sellingPrice.toFixed(2)}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      Rs. {(item.sellingPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculations Breakdown */}
              <div className="py-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Tariff Subtotal:</span>
                  <span className="font-mono">Rs. {lastCheckedOutReceipt.subtotal.toFixed(2)}</span>
                </div>
                {lastCheckedOutReceipt.discountAmt > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Discount Applied:</span>
                    <span className="font-mono">-Rs. {lastCheckedOutReceipt.discountAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                  <span>Total Due Charged:</span>
                  <span className="font-mono text-emerald-600 font-black">Rs. {lastCheckedOutReceipt.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Print trigger simulator */}
            <div className="pt-2 flex gap-1.5 text-xs no-print">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Draft Print
              </button>
              <button
                onClick={() => setLastCheckedOutReceipt(null)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-center cursor-pointer"
              >
                Keep Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
