import React, { useState } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  RotateCcw, 
  Search, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  Receipt,
  User,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Product, Customer, SaleRecord, StoreSettings } from '../types';
import { Language } from '../translations';

interface ExchangeReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  sales: SaleRecord[];
  storeSettings: StoreSettings;
  lang?: Language;
  onReturnItem?: (saleId: string, productId: string, qtyToReturn: number) => void;
  onExchangeItem?: (
    saleId: string, 
    returnProductId: string, 
    qtyToReturn: number, 
    addProductId: string, 
    qtyToAdd: number
  ) => void;
}

export default function ExchangeReturnModal({
  isOpen,
  onClose,
  products,
  customers,
  sales = [],
  storeSettings,
  lang = 'en',
  onReturnItem,
  onExchangeItem,
}: ExchangeReturnModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(sales[0]?.id || null);

  // Active operation mode
  const [activeMode, setActiveMode] = useState<'view' | 'return' | 'exchange'>('view');
  const [selectedItemProductId, setSelectedItemProductId] = useState<string | null>(null);

  // Return form state
  const [returnQty, setReturnQty] = useState<number>(1);

  // Exchange form state
  const [replacementProductId, setReplacementProductId] = useState<string | null>(null);
  const [replacementSearchQuery, setReplacementSearchQuery] = useState('');
  const [replacementQty, setReplacementQty] = useState<number>(1);

  // Receipt / Feedback state after action
  const [lastActionResult, setLastActionResult] = useState<{
    type: 'return' | 'exchange';
    invoiceId: string;
    customerName: string;
    returnItemName: string;
    returnQty: number;
    refundAmt?: number;
    replacementItemName?: string;
    replacementQty?: number;
    priceDiff?: number;
    timestamp: string;
  } | null>(null);

  if (!isOpen) return null;

  // Filter sales list
  const filteredSales = sales.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.id.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.items.some(it => it.name.toLowerCase().includes(q))
    );
  }).slice(0, 15);

  const selectedSale = sales.find(s => s.id === selectedSaleId) || sales[0];
  const targetItem = selectedSale?.items.find(it => it.productId === selectedItemProductId);

  // Replacement search results
  const replacementCandidates = products.filter(p => {
    if (!replacementSearchQuery) return true;
    const q = replacementSearchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  }).slice(0, 8);

  const replacementProduct = products.find(p => p.id === replacementProductId);

  // Financial calculations
  const returnRefundTotal = targetItem ? targetItem.sellingPrice * returnQty : 0;
  const replacementPrice = replacementProduct ? replacementProduct.retailPrice : 0;
  const replacementTotal = replacementProduct ? replacementPrice * replacementQty : 0;
  const exchangeDiff = replacementTotal - returnRefundTotal;

  // Handlers
  const handleConfirmReturn = () => {
    if (!selectedSale || !targetItem || !onReturnItem) return;
    if (returnQty <= 0 || returnQty > targetItem.quantity) {
      alert(lang === 'ur' ? 'براہ کرم درست مقدار درج کریں۔' : 'Please specify a valid quantity to return.');
      return;
    }

    onReturnItem(selectedSale.id, targetItem.productId, returnQty);

    setLastActionResult({
      type: 'return',
      invoiceId: selectedSale.id,
      customerName: selectedSale.customerName,
      returnItemName: targetItem.name,
      returnQty,
      refundAmt: returnRefundTotal,
      timestamp: new Date().toLocaleTimeString()
    });

    setActiveMode('view');
    setSelectedItemProductId(null);
  };

  const handleConfirmExchange = () => {
    if (!selectedSale || !targetItem || !replacementProduct || !onExchangeItem) return;
    if (returnQty <= 0 || returnQty > targetItem.quantity) {
      alert(lang === 'ur' ? 'براہ کرم واپسی کی درست مقدار منتخب کریں۔' : 'Invalid return quantity.');
      return;
    }
    if (replacementQty <= 0 || replacementProduct.stock < replacementQty) {
      alert(lang === 'ur' ? 'متبادل آئٹم کا مطلوبہ اسٹاک دستیاب نہیں ہے۔' : 'Insufficient stock for the replacement item.');
      return;
    }

    onExchangeItem(
      selectedSale.id,
      targetItem.productId,
      returnQty,
      replacementProduct.id,
      replacementQty
    );

    setLastActionResult({
      type: 'exchange',
      invoiceId: selectedSale.id,
      customerName: selectedSale.customerName,
      returnItemName: targetItem.name,
      returnQty,
      replacementItemName: replacementProduct.name,
      replacementQty,
      priceDiff: exchangeDiff,
      timestamp: new Date().toLocaleTimeString()
    });

    setActiveMode('view');
    setSelectedItemProductId(null);
    setReplacementProductId(null);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4 font-sans backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {lang === 'ur' ? 'کاؤنٹر برائے سامان کی واپسی و تبادلہ' : 'Exchange & Return Desk'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'ur' ? 'بل نمبر سے سامان تلاش کریں، رقم کی واپسی یا نیا متبادل سامان جاری کریں' : 'Inspect invoices, return items to inventory with refund or exchange for other stock'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Result / Printable Receipt Banner */}
        {lastActionResult && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">
                  {lastActionResult.type === 'return' ? 'Return Completed' : 'Exchange Completed'}:
                </span>{' '}
                {lastActionResult.returnQty}x &quot;{lastActionResult.returnItemName}&quot; processed for {lastActionResult.customerName}.{' '}
                {lastActionResult.type === 'return' ? (
                  <span className="font-bold text-emerald-700">Refund: Rs. {lastActionResult.refundAmt?.toFixed(2)}</span>
                ) : (
                  <span className="font-bold">
                    Swapped for {lastActionResult.replacementQty}x {lastActionResult.replacementItemName} (
                    {lastActionResult.priceDiff! >= 0 ? `Customer pays +Rs. ${lastActionResult.priceDiff?.toFixed(2)}` : `Refund customer Rs. ${Math.abs(lastActionResult.priceDiff!).toFixed(2)}`}
                    )
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-3xs transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
              <button
                type="button"
                onClick={() => setLastActionResult(null)}
                className="text-slate-400 hover:text-slate-700 font-bold px-1"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Left Column: Sales Search & Selection (5 cols) */}
          <div className="md:col-span-5 flex flex-col space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'ur' ? 'بل نمبر یا گاہک کا نام تلاش کریں...' : 'Search Invoice ID, customer name...'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs flex-1 max-h-[380px] overflow-y-auto">
              {filteredSales.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                  <p>No matching sales invoices found.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredSales.map(sale => (
                    <div
                      key={sale.id}
                      onClick={() => {
                        setSelectedSaleId(sale.id);
                        setActiveMode('view');
                        setSelectedItemProductId(null);
                      }}
                      className={`p-3 text-xs cursor-pointer transition ${
                        selectedSale?.id === sale.id 
                          ? 'bg-blue-50/80 border-l-4 border-blue-600 font-semibold' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-slate-900 font-bold block truncate max-w-[160px]">
                            {sale.id}
                          </span>
                          <span className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[140px]">{sale.customerName}</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 block">
                            Rs. {sale.totalAmount.toFixed(0)}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase inline-block ${
                            sale.paymentMethod === 'khata' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {sale.paymentMethod}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>{new Date(sale.date).toLocaleDateString()}</span>
                        <span>{sale.items.reduce((acc, it) => acc + it.quantity, 0)} items</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Invoice Details & Action Panel (7 cols) */}
          <div className="md:col-span-7 flex flex-col space-y-3">
            {selectedSale ? (
              <div className="space-y-3">
                {/* Sale Overview Banner */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{selectedSale.customerName}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Invoice: {selectedSale.id} • {new Date(selectedSale.date).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Grand Total</span>
                    <span className="text-base font-extrabold text-blue-700 font-mono">
                      Rs. {selectedSale.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Sub-view 1: Items List with Return / Exchange Action Buttons */}
                {activeMode === 'view' && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {lang === 'ur' ? 'بل میں شامل آئٹمز' : 'Purchased Items on this Invoice'}
                    </h4>

                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                      {selectedSale.items.map((it) => (
                        <div key={it.productId} className="p-3 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-800 block truncate">{it.name}</span>
                            <span className="text-[11px] font-mono text-slate-500">
                              Qty: {it.quantity} × Rs. {it.sellingPrice.toFixed(2)} = Rs. {(it.quantity * it.sellingPrice).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Return Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItemProductId(it.productId);
                                setReturnQty(1);
                                setActiveMode('return');
                              }}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                              title="Return for Cash or Khata refund"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{lang === 'ur' ? 'واپسی' : 'Return'}</span>
                            </button>

                            {/* Exchange Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItemProductId(it.productId);
                                setReturnQty(1);
                                setReplacementQty(1);
                                setReplacementProductId(null);
                                setReplacementSearchQuery('');
                                setActiveMode('exchange');
                              }}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                              title="Exchange for another item in stock"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                              <span>{lang === 'ur' ? 'تبادلہ' : 'Exchange'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-view 2: Process Return */}
                {activeMode === 'return' && targetItem && (
                  <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-4 animate-in fade-in duration-150">
                    <div className="flex justify-between items-center border-b border-rose-200 pb-2">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-rose-600" />
                        <h4 className="font-bold text-xs text-rose-900 uppercase tracking-wide">
                          {lang === 'ur' ? 'سامان کی واپسی اور کیش ریفنڈ' : 'Item Return & Refund'}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveMode('view')}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-slate-800 text-sm">{targetItem.name}</div>
                      <div className="text-slate-500">Unit Selling Price: Rs. {targetItem.sellingPrice.toFixed(2)}</div>
                      <div className="text-slate-500">Max returnable quantity: {targetItem.quantity}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-slate-700">Quantity to Return:</label>
                      <input
                        type="number"
                        min="1"
                        max={targetItem.quantity}
                        value={returnQty}
                        onChange={(e) => setReturnQty(Math.max(1, Math.min(targetItem.quantity, Number(e.target.value) || 1)))}
                        className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div className="p-3 bg-white border border-rose-200 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Total Refund Amount:</span>
                      <span className="text-base font-black text-rose-700 font-mono">
                        Rs. {returnRefundTotal.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      ✓ Items will be returned to stock inventory.<br />
                      {selectedSale.paymentMethod === 'khata' 
                        ? `✓ Customer ${selectedSale.customerName}'s Khata ledger will be credited with Rs. ${returnRefundTotal.toFixed(2)}.`
                        : `✓ Cashier hands back Rs. ${returnRefundTotal.toFixed(2)} cash refund.`}
                    </p>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveMode('view')}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmReturn}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Confirm Return (Rs. {returnRefundTotal.toFixed(0)})</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-view 3: Process Exchange */}
                {activeMode === 'exchange' && targetItem && (
                  <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-4 animate-in fade-in duration-150">
                    <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                        <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wide">
                          {lang === 'ur' ? 'سامان کا تبادلہ' : 'Exchange Item with Stock Replacement'}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveMode('view')}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Returning Item info */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                      <span className="font-bold text-slate-600 uppercase text-[10px] block">Returning Item</span>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{targetItem.name}</span>
                        <span className="font-mono text-slate-600">Rs. {targetItem.sellingPrice.toFixed(2)} each</span>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-slate-600 text-xs font-semibold">Qty returning:</span>
                        <input
                          type="number"
                          min="1"
                          max={targetItem.quantity}
                          value={returnQty}
                          onChange={(e) => setReturnQty(Math.max(1, Math.min(targetItem.quantity, Number(e.target.value) || 1)))}
                          className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-xs"
                        />
                        <span className="ml-auto font-bold text-emerald-700 font-mono">
                          Return Credit: Rs. {returnRefundTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Replacement Item Selector */}
                    <div className="space-y-2 text-xs">
                      <span className="font-bold text-slate-700 uppercase text-[10px] block">Select Replacement Item</span>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={replacementSearchQuery}
                          onChange={(e) => setReplacementSearchQuery(e.target.value)}
                          placeholder="Search product catalog by name or barcode..."
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="border border-slate-200 rounded-lg max-h-[140px] overflow-y-auto bg-white divide-y divide-slate-100">
                        {replacementCandidates.map(p => (
                          <div
                            key={p.id}
                            onClick={() => setReplacementProductId(p.id)}
                            className={`p-2 flex items-center justify-between cursor-pointer transition ${
                              replacementProductId === p.id 
                                ? 'bg-blue-100 font-bold text-blue-900' 
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div>
                              <span className="block truncate max-w-[200px]">{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Stock: {p.stock} {p.unit}</span>
                            </div>
                            <span className="font-mono font-bold text-slate-900">Rs. {p.retailPrice.toFixed(0)}</span>
                          </div>
                        ))}
                      </div>

                      {replacementProduct && (
                        <div className="p-3 bg-white border border-blue-200 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900">{replacementProduct.name}</span>
                            <span className="font-mono text-blue-700 font-bold">Rs. {replacementPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-600 font-semibold">Qty to Issue:</span>
                            <input
                              type="number"
                              min="1"
                              max={replacementProduct.stock}
                              value={replacementQty}
                              onChange={(e) => setReplacementQty(Math.max(1, Math.min(replacementProduct.stock, Number(e.target.value) || 1)))}
                              className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-xs"
                            />
                            <span className="ml-auto font-mono text-slate-700">
                              Subtotal: Rs. {replacementTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Net Financial Settlement Breakdown */}
                    {replacementProduct && (
                      <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Replacement Cost:</span>
                          <span className="font-mono font-bold">Rs. {replacementTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Less Returned Credit:</span>
                          <span className="font-mono font-bold text-rose-600">- Rs. {returnRefundTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-200">
                          <span>
                            {exchangeDiff >= 0 
                              ? (lang === 'ur' ? 'گاہک اضافی ادا کرے گا:' : 'Customer Pays Difference:') 
                              : (lang === 'ur' ? 'گاہک کو واپس کرنے والی رقم:' : 'Refund Difference to Customer:')}
                          </span>
                          <span className={`font-mono text-sm ${exchangeDiff >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                            Rs. {Math.abs(exchangeDiff).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveMode('view')}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!replacementProduct}
                        onClick={handleConfirmExchange}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>Execute Exchange</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-300" />
                <p>Select an invoice from the left to inspect and process returns or exchanges.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
