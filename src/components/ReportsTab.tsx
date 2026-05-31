import React, { useState } from 'react';
import { SaleRecord, Product, Expense, StoreSettings, Customer } from '../types';
import { HARDWARE_CATEGORIES } from '../data/mockData';
import { 
  BadgeDollarSign, 
  TrendingUp, 
  Coins, 
  ShoppingBag, 
  Calendar,
  Layers,
  ArrowRight,
  ClipboardList,
  Flame,
  User,
  X,
  CreditCard,
  Truck,
  Store,
  Plus,
  Trash2,
  PiggyBank,
  Download
} from 'lucide-react';

interface ReportsTabProps {
  sales: SaleRecord[];
  products: Product[];
  expenses: Expense[];
  onAddExpense: (newExpense: Omit<Expense, 'id' | 'date'>) => void;
  onDeleteExpense: (id: string) => void;
  lang: 'en' | 'ur';
  storeSettings: StoreSettings;
  onReturnPOSItem?: (saleId: string, productId: string, qtyToReturn: number) => void;
  onExchangePOSItem?: (saleId: string, returnProductId: string, qtyToReturn: number, addProductId: string, qtyToAdd: number) => void;
  customers?: Customer[];
}

export default function ReportsTab({ 
  sales, 
  products, 
  expenses = [], 
  onAddExpense, 
  onDeleteExpense, 
  lang,
  storeSettings,
  onReturnPOSItem,
  onExchangePOSItem,
  customers = []
}: ReportsTabProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'today' | 'week' | 'year'>('all');
  const [activeReceiptView, setActiveReceiptView] = useState<SaleRecord | null>(null);

  // Return & Exchange State Management
  const [returnItem, setReturnItem] = useState<{ productId: string; name: string; quantity: number; sellingPrice: number } | null>(null);
  const [actionType, setActionType] = useState<'return' | 'exchange' | null>(null);
  const [returnQty, setReturnQty] = useState<number>(1);
  const [exchangeProductSearch, setExchangeProductSearch] = useState('');
  const [selectedExchangeProduct, setSelectedExchangeProduct] = useState<Product | null>(null);
  const [exchangeAddQty, setExchangeAddQty] = useState<number>(1);

  const [newExpType, setNewExpType] = useState<'shop' | 'transport'>('shop');
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');

  const handleDownloadCSV = () => {
    if (filteredExpenses.length === 0) {
      alert(lang === 'ur' ? 'ڈاؤن لوڈ کرنے کے لیے کوئی ریکارڈ موجود نہیں ہے!' : 'No expense records available to download for this timeframe!');
      return;
    }

    // CSV headers: ID, Date, Type, Description, Amount (Rs.)
    const headers = [
      lang === 'ur' ? 'آئی ڈی (ID)' : 'Record ID',
      lang === 'ur' ? 'تاریخ (Date)' : 'Date & Time',
      lang === 'ur' ? 'قسم (Type)' : 'Expense Type',
      lang === 'ur' ? 'تفصیل (Description)' : 'Description / Remarks',
      lang === 'ur' ? 'رقم (Amount Rs.)' : 'Amount (Rs.)'
    ];

    const rows = filteredExpenses.map(exp => {
      const typeStr = exp.type === 'shop' 
        ? (lang === 'ur' ? 'دکان خرچہ (Shop)' : 'Shop Expense') 
        : (lang === 'ur' ? 'ٹرانسپورٹ (Transport)' : 'Transport/Logistics');
      const formattedDate = new Date(exp.date).toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-US');
      // Escape description if it has commas
      const cleanDesc = `"${exp.description.replace(/"/g, '""')}"`;
      return [
        exp.id,
        `"${formattedDate}"`,
        `"${typeStr}"`,
        cleanDesc,
        exp.amount.toFixed(2)
      ];
    });

    const csvContent = "\ufeff" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Shop_Expenses_Report_${selectedTimeframe}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(newExpAmount);
    if (!newExpDesc.trim()) {
      alert(lang === 'ur' ? 'برائے مہربانی تفصیل درج کریں!' : 'Please enter description detail!');
      return;
    }
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      alert(lang === 'ur' ? 'برائے مہربانی درست رقم درج کریں!' : 'Please enter a valid amount!');
      return;
    }
    onAddExpense({
      type: newExpType,
      description: newExpDesc,
      amount: parsedAmt
    });
    setNewExpDesc('');
    setNewExpAmount('');
  };

  // Time filters helper
  const filteredSales = sales.filter(s => {
    if (selectedTimeframe === 'all') return true;
    
    const saleDate = new Date(s.date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - saleDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (selectedTimeframe === 'today') {
      return saleDate.toDateString() === now.toDateString();
    }
    
    if (selectedTimeframe === 'week') {
      return diffDays <= 7;
    }

    if (selectedTimeframe === 'year') {
      return diffDays <= 365;
    }

    return true;
  });

  // Calculate Aggregates
  const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  const totalCost = filteredSales.reduce((acc, sale) => acc + (sale.totalCost || 0), 0);
  const totalProfit = filteredSales.reduce((acc, sale) => acc + sale.profit, 0);

  // Filter and compute Expenses
  const filteredExpenses = expenses.filter(e => {
    if (selectedTimeframe === 'all') return true;
    
    const expDate = new Date(e.date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - expDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (selectedTimeframe === 'today') {
      return expDate.toDateString() === now.toDateString();
    }
    
    if (selectedTimeframe === 'week') {
      return diffDays <= 7;
    }

    if (selectedTimeframe === 'year') {
      return diffDays <= 365;
    }

    return true;
  });

  const totalShopExpenses = filteredExpenses.filter(e => e.type === 'shop').reduce((acc, e) => acc + e.amount, 0);
  const totalTransportCost = filteredExpenses.filter(e => e.type === 'transport').reduce((acc, e) => acc + e.amount, 0);
  const totalExpenses = totalShopExpenses + totalTransportCost;
  const netProfitAfterExpenses = totalProfit - totalExpenses;

  const averageMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Calculate Top selling products (accumulate quantities from historical records)
  const productSalesMap: { [id: string]: { name: string; quantity: number; revenue: number; profit: number; category: string } } = {};

  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        // Find product category helper
        const matchingCat = products.find(p => p.id === item.productId)?.category || 'General Hardware';
        productSalesMap[item.productId] = {
          name: item.name,
          quantity: 0,
          revenue: 0,
          profit: 0,
          category: matchingCat
        };
      }
      productSalesMap[item.productId].quantity += item.quantity;
      productSalesMap[item.productId].revenue += item.sellingPrice * item.quantity;
      productSalesMap[item.productId].profit += (item.sellingPrice - item.costPrice) * item.quantity;
    });
  });

  const topSellingList = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5); // top 5 items

  // Category Sales Breakdowns
  const categorySummary: { [cat: string]: number } = {};
  HARDWARE_CATEGORIES.forEach(cat => { categorySummary[cat] = 0; });

  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      const cat = products.find(p => p.id === item.productId)?.category || 'Other / Plumbing';
      if (categorySummary[cat] !== undefined) {
        categorySummary[cat] += item.sellingPrice * item.quantity;
      } else {
        categorySummary[cat] = item.sellingPrice * item.quantity;
      }
    });
  });

  const maxCategoryValue = Math.max(...Object.values(categorySummary), 1);

  return (
    <div className="space-y-6">
      
      {/* Time filters header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-slate-900 text-sm">ERP Financial Revenue Audits</h2>
          <p className="text-xs text-slate-500">Real-time ledger markup margin updates and catalog rotations list.</p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs text-slate-700">
          <button
            onClick={() => setSelectedTimeframe('all')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${selectedTimeframe === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {lang === 'ur' ? 'تمام ریکارڈز' : 'All History'}
          </button>
          <button
            onClick={() => setSelectedTimeframe('year')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${selectedTimeframe === 'year' ? 'bg-white text-slate-900 shadow-xs font-bold text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {lang === 'ur' ? 'پچھلا 1 سال' : 'Past 1 Year'}
          </button>
          <button
            onClick={() => setSelectedTimeframe('week')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${selectedTimeframe === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {lang === 'ur' ? 'پچھلے 7 دن' : 'Past 7 Days'}
          </button>
          <button
            onClick={() => setSelectedTimeframe('today')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${selectedTimeframe === 'today' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {lang === 'ur' ? 'آج کا آڈٹ' : "Today's Audits"}
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-slate-900 text-white p-4 rounded-lg border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-300 font-bold font-mono uppercase tracking-wider block">Gross Turnover</span>
            <div className="text-2xl font-black font-sans text-white">Rs. {totalRevenue.toFixed(2)}</div>
            <p className="text-[10px] text-slate-400">Sum of cash, card & credit tickets</p>
          </div>
          <div className="p-3 bg-slate-800 text-emerald-400 rounded">
            <BadgeDollarSign className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider block">Net Profit Margin</span>
            <div className="text-2xl font-black font-sans text-emerald-600 font-mono">Rs. {totalProfit.toFixed(2)}</div>
            <p className="text-[10px] text-slate-400">Combined Gross earnings</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider block">Cost of Goods (COGS)</span>
            <div className="text-2xl font-bold font-sans text-slate-900 font-mono">Rs. {totalCost.toFixed(2)}</div>
            <p className="text-[10px] text-slate-400">Stock acquisition liabilities costs</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded">
            <Coins className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider block">Cumulative Markup</span>
            <div className="text-2xl font-black font-sans text-blue-600">{averageMargin}%</div>
            <p className="text-[10px] text-slate-400">Overall profit-to-turnover ratio</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded">
            <Layers className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Expenses & Realized Cashflow Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shop Expenses */}
        <div className="bg-rose-50/60 p-4 rounded-lg border border-rose-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-rose-600 font-bold font-mono uppercase tracking-wider block">
              {lang === 'ur' ? 'دکان کے اخراجات' : 'Shop Expenses'}
            </span>
            <div className="text-xl font-black font-sans text-rose-700 font-mono">Rs. {totalShopExpenses.toFixed(2)}</div>
            <p className="text-[10px] text-rose-500">
              {lang === 'ur' ? 'بل، کرایہ، تنخواہیں اور اسٹور مینٹیننس' : 'Rent, utility bills, store maintenance, staff salaries'}
            </p>
          </div>
          <div className="p-2.5 bg-rose-100/80 text-rose-700 rounded-lg">
            <Store className="w-5 h-5" />
          </div>
        </div>

        {/* Transport Cost */}
        <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-amber-600 font-bold font-mono uppercase tracking-wider block">
              {lang === 'ur' ? 'ٹرانسپورٹ لاگت' : 'Transport Cost'}
            </span>
            <div className="text-xl font-black font-sans text-amber-700 font-mono">Rs. {totalTransportCost.toFixed(2)}</div>
            <p className="text-[10px] text-amber-500">
              {lang === 'ur' ? 'گاڑی کرایہ، لوڈنگ باربرداری چارجز' : 'Freight forward, loading, fuel carrier, logistic expenses'}
            </p>
          </div>
          <div className="p-2.5 bg-amber-100/80 text-amber-700 rounded-lg">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Realized Residual Profit */}
        <div className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${
          netProfitAfterExpenses >= 0 
            ? 'bg-emerald-50/70 border-emerald-100 text-emerald-950' 
            : 'bg-rose-50/80 border-rose-200 text-rose-950'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold font-mono tracking-wider block">
              {lang === 'ur' ? 'صافی منافع اخراجات کے بعد' : 'Net Residual Cashflow'}
            </span>
            <div className={`text-xl font-black font-mono ${
              netProfitAfterExpenses >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              Rs. {netProfitAfterExpenses.toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-500">
              {lang === 'ur' ? 'مکمل اخراجات اور بلوں کی ادائیگی کے بعد' : 'Unencumbered net cash profit after all operational costs'}
            </p>
          </div>
          <div className={`p-2.5 rounded-lg ${
            netProfitAfterExpenses >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-150 text-rose-750'
          }`}>
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Charts split block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Sales Share Bar graph */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Product Category Allocation</h3>
            <p className="text-xs text-slate-500">Gross sales volume generated by item category</p>
          </div>

          <div className="space-y-4">
            {Object.entries(categorySummary).map(([cat, amt]) => {
              const sharePercent = maxCategoryValue > 0 ? (amt / maxCategoryValue) * 100 : 0;

              return (
                <div key={cat} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-medium">{cat}</span>
                    <span className="font-mono font-bold text-slate-900">Rs. {amt.toFixed(2)}</span>
                  </div>
                  
                  {/* Styled loading bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-800 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(sharePercent, amt > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Rotated/Selling Products */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Fast-Moving Hot Items Roster</h3>
              <p className="text-xs text-slate-500">Products with highest volume velocity rotation</p>
            </div>
            
            <span className="p-1 px-2.5 bg-amber-50 text-amber-800 border border-amber-100 text-[10px] font-mono font-bold rounded flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-550 shrink-0" />
              HOT SELLING
            </span>
          </div>

          {topSellingList.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs italic">
              No product sales tracked yet during this timeframe.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topSellingList.map((item, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 line-clamp-1">{item.name}</span>
                    <span className="text-[10px] text-slate-400">Class: <b>{item.category}</b></span>
                  </div>

                  <div className="text-right flex items-center gap-4 shrink-0">
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-slate-800">{item.quantity} sales</div>
                      <div className="text-[10px] text-emerald-600 font-medium font-mono">Rs. {item.revenue.toFixed(2)} rev</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* REAL-TIME EXPENSES LEDGER & MANAGEMENT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ADD EXPENSE ENTRY FORM */}
        <div className="lg:col-span-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                {lang === 'ur' ? 'نیا دکان خرچہ یا گاڑی لاگت درج کریں' : 'Record New Expense / Logistics'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                {lang === 'ur' ? 'دکان کے کرائے، یوٹیلیٹی بلوں اور ٹرانسپورٹ کرایہ کی ریئل ٹائم بکنگ۔' : 'Assign cost to either shop operations or transport/carriage logistics.'}
              </p>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4">
              {/* Type Select */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  {lang === 'ur' ? 'اخراجات کی کیٹیگری یعنی ٹائپ' : 'Expense Category/Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewExpType('shop')}
                    className={`p-2.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition cursor-pointer select-none ${
                      newExpType === 'shop'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>{lang === 'ur' ? 'دکان خرچہ' : 'Shop Expense'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewExpType('transport')}
                    className={`p-2.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition cursor-pointer select-none ${
                      newExpType === 'transport'
                        ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{lang === 'ur' ? 'ٹرانسپورٹ' : 'Transport'}</span>
                  </button>
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  {lang === 'ur' ? 'تفصیل یا ریمارکس' : 'Description / Remarks'}
                </label>
                <input
                  type="text"
                  value={newExpDesc}
                  onChange={(e) => setNewExpDesc(e.target.value)}
                  placeholder={
                    newExpType === 'shop'
                      ? (lang === 'ur' ? 'مثلاً: بجلی کا بل مئی ۲۰۲۶' : 'e.g., Staff wages, Rent, Electricity Bill')
                      : (lang === 'ur' ? 'مثلاً: کرایہ گاڑی لوڈنگ سیمنٹ' : 'e.g., Cement loading charges, carrier fuel')
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  {lang === 'ur' ? 'اخراجات کی رقم (Rs.)' : 'Amount in Cash (Rs.)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold font-mono">Rs.</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={newExpAmount}
                    onChange={(e) => setNewExpAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-10 text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-lg text-xs transition shadow-sm hover:shadow-md cursor-pointer select-none animate-all"
              >
                {lang === 'ur' ? 'اخراجات لسٹ میں شامل کریں' : 'Book Expense Transaction'}
              </button>
            </form>
          </div>
        </div>

        {/* LEDGERS LIST VIEWER (SHOP VS TRANSPORT) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-slate-500" />
                  {lang === 'ur' ? 'ریکارڈڈ ایکسپنس لاگ' : 'Recorded Shop Expenses & Transport Costs'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {lang === 'ur' ? 'دکان کے اخراجات اور گاڑی کے کرایہ جات کی تفصیلات۔' : 'Audit list representing transport fees, load carriage and shop assets bills.'}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 hover:border-emerald-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer select-none"
                  title={lang === 'ur' ? 'سی ایس وی فائل ڈاؤن لوڈ کریں' : 'Download report as CSV'}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? 'ایکسپورٹ CSV' : 'Download CSV'}</span>
                </button>
                <span className="bg-slate-100 px-2.5 py-1.5 text-[10px] text-slate-600 font-bold rounded-lg font-mono">
                  {filteredExpenses.length} {lang === 'ur' ? 'کل ریکارڈز' : 'Total Items'}
                </span>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[290px] pr-1 space-y-2">
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs italic">
                  {lang === 'ur' ? 'اس ٹائم فریم کے دوران کوئی اخراجات ریکارڈ نہیں کیے گئے۔' : 'No expenses or carriage costs recorded in this timeframe.'}
                </div>
              ) : (
                [...filteredExpenses].reverse().map((exp) => (
                  <div 
                    key={exp.id} 
                    className="p-3 bg-slate-50 hover:bg-slate-100/55 rounded-xl border border-slate-150 flex items-center justify-between transition gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        exp.type === 'shop' 
                          ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {exp.type === 'shop' ? <Store className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-xs truncate break-all block">
                          {exp.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span className={`px-1 rounded text-[8px] font-bold uppercase ${
                            exp.type === 'shop' ? 'bg-rose-100/60 text-rose-700' : 'bg-amber-100/60 text-amber-850'
                          }`}>
                            {exp.type === 'shop' ? (lang === 'ur' ? 'دکان خرچہ' : 'Shop Cost') : (lang === 'ur' ? 'ٹرانسپورٹ' : 'Transport')}
                          </span>
                          <span>•</span>
                          <span>{new Date(exp.date).toLocaleDateString()} {new Date(exp.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-white border border-slate-200 rounded px-2 py-1">
                        Rs. {exp.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(lang === 'ur' ? 'کیا آپ اس اندراج کو حذف کرنا چاہتے ہیں؟' : 'Are you sure you want to delete this expense record?')) {
                            onDeleteExpense(exp.id);
                          }
                        }}
                        className="p-1 px-1.5 bg-white text-slate-400 hover:text-red-650 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-slate-450 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sales Archive Logs Grid Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-slate-405" />
            Historical POS Checkouts Log ({filteredSales.length} records)
          </h4>
          <span className="text-[10px] text-slate-400">Audit trail trace log</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-mono text-[9px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Invoice ID</th>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Settle Account</th>
                <th className="py-3 px-4 font-semibold">Payment Option</th>
                <th className="py-3 px-4 font-semibold text-right">Net Value</th>
                <th className="py-3 px-4 font-semibold text-right">Net Markup</th>
                <th className="py-3 px-4 font-semibold text-right">Receipt Sheet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No checkout ledgers recorded.
                  </td>
                </tr>
              ) : (
                [...filteredSales].reverse().map(saleObj => (
                  <tr key={saleObj.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {saleObj.id.toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(saleObj.date).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{saleObj.customerName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-1.5 py-0.5 text-[9px] rounded font-mono font-bold uppercase ${
                        saleObj.paymentMethod === 'khata' ? 'bg-orange-50 text-orange-700' :
                        saleObj.paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {saleObj.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-950">
                      Rs. {saleObj.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-bold">
                      +Rs. {saleObj.profit.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setActiveReceiptView(saleObj)}
                        className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded transition cursor-pointer"
                      >
                        Inspect View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detail log view invoice */}
      {activeReceiptView && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className={`bg-white rounded-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 transition-all ${returnItem ? 'max-w-3xl' : 'max-w-md'}`}>
            <button
              onClick={() => {
                setActiveReceiptView(null);
                setReturnItem(null);
                setActionType(null);
                setSelectedExchangeProduct(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className={returnItem ? 'grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100' : 'space-y-4'}>
              {/* Column 1: Receipt Core details */}
              <div className="space-y-4 pr-0 md:pr-4">
                <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-200">
                  <h4 className="font-extrabold text-slate-900 text-sm uppercase">{storeSettings.storeName}</h4>
                  <p className="text-[10px] text-slate-500">{storeSettings.storeAddress}</p>
                  <span className="font-mono text-xs text-slate-450 font-bold block mt-1">ID: {activeReceiptView.id}</span>
                </div>

                <div className="py-2 border-b border-slate-250 text-[11px] space-y-2 select-none">
                  <div className="flex justify-between">
                    <span>Created Date:</span>
                    <span className="font-semibold text-slate-800">{new Date(activeReceiptView.date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>Account Client:</span>
                    <span>{activeReceiptView.customerName}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Logged Payment:</span>
                    <span className="font-mono uppercase font-bold text-slate-800">{activeReceiptView.paymentMethod}</span>
                  </div>
                </div>

                <div className="py-4 border-b border-dashed border-slate-200 text-[11px] space-y-2.5 max-h-[160px] overflow-y-auto">
                  {activeReceiptView.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start text-xs hover:bg-slate-50 p-1.5 rounded-lg transition">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-850 block">{item.name}</span>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>{item.quantity} items × Rs. {item.sellingPrice.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setReturnItem(item);
                                setActionType('return');
                                setReturnQty(1);
                                setExchangeProductSearch('');
                                setSelectedExchangeProduct(null);
                                setExchangeAddQty(1);
                              }}
                              className="text-[9px] font-extrabold text-orange-600 hover:text-orange-850 cursor-pointer uppercase tracking-wider"
                            >
                              Return
                            </button>
                            <span className="text-[10px] text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                setReturnItem(item);
                                setActionType('exchange');
                                setReturnQty(1);
                                setExchangeProductSearch('');
                                setSelectedExchangeProduct(null);
                                setExchangeAddQty(1);
                              }}
                              className="text-[9px] font-extrabold text-blue-600 hover:text-blue-850 cursor-pointer uppercase tracking-wider"
                            >
                              Exchange
                            </button>
                          </div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-950">
                        Rs. {(item.sellingPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="py-2 space-y-1.5 text-xs select-none">
                  <div className="flex justify-between pt-1 font-extrabold text-slate-950 border-t border-slate-150">
                    <span>Paid amount total:</span>
                    <span className="font-mono text-emerald-600">Rs. {activeReceiptView.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Cost acquisition margin:</span>
                    <span className="font-mono">Rs. {activeReceiptView.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 text-[11px] font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                    <span>Computed Net profit:</span>
                    <span className="font-mono">+Rs. {activeReceiptView.profit.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Column 2: Return / Exchange Desk Workspace */}
              {returnItem && (
                <div className="pl-0 md:pl-6 pt-4 md:pt-0 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {actionType === 'return' ? 'Process Return Items' : 'Exchange Items Swap'}
                      </h4>
                      <button
                        onClick={() => setReturnItem(null)}
                        className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1 text-xs select-none">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide block">Selected Item for action</span>
                      <div className="font-bold text-slate-800">{returnItem.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Purchased quantity: {returnItem.quantity} unit(s) @ Rs. {returnItem.sellingPrice.toFixed(2)}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 text-xs select-none">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 block">Quantity to Return / Exchange</label>
                        <input
                          type="number"
                          min={1}
                          max={returnItem.quantity}
                          value={returnQty}
                          onChange={(e) => setReturnQty(Math.min(returnItem.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-black font-mono focus:border-indigo-500"
                        />
                        <span className="text-[10px] text-slate-400 italic">Enter amount up to {returnItem.quantity} unit(s) maximum</span>
                      </div>

                      {/* Action workspace specific panels */}
                      {actionType === 'return' && (
                        <div className="p-3.5 bg-orange-50/50 border border-orange-100 rounded-xl space-y-1.5 min-h-[100px] flex flex-col justify-center">
                          <span className="text-[9px] text-orange-600 font-bold tracking-wider uppercase block">Refund Calculation summary</span>
                          <div className="text-xl font-extrabold text-orange-600 font-mono">Rs. {(returnQty * returnItem.sellingPrice).toFixed(2)}</div>
                          <p className="text-[10px] text-slate-500">
                            The stock of {returnQty} item(s) will be automatically returned to inventory. The total POS invoice total will adjust.
                          </p>
                        </div>
                      )}

                      {actionType === 'exchange' && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="font-semibold text-slate-700 block">Search Replacement Item</label>
                            <input
                              type="text"
                              placeholder="Type name or Scan Item SKU..."
                              value={exchangeProductSearch}
                              onChange={(e) => setExchangeProductSearch(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-indigo-500"
                            />
                          </div>

                          {/* Matching search drop list */}
                          {exchangeProductSearch && (
                            <div className="bg-white border border-slate-100 rounded-lg shadow-sm divide-y divide-slate-55 max-h-[120px] overflow-y-auto">
                              {products
                                .filter(p => p.name.toLowerCase().includes(exchangeProductSearch.toLowerCase()) || p.code.toLowerCase().includes(exchangeProductSearch.toLowerCase()))
                                .slice(0, 5)
                                .map(prod => (
                                  <button
                                    key={prod.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedExchangeProduct(prod);
                                      setExchangeProductSearch('');
                                      setExchangeAddQty(1);
                                    }}
                                    className="w-full text-left p-2 hover:bg-slate-50 transition cursor-pointer flex justify-between gap-2 text-[11px]"
                                  >
                                    <span className="font-medium text-slate-800 truncate block">{prod.name} (SKU: {prod.code})</span>
                                    <span className="shrink-0 font-bold font-mono text-indigo-600">Rs. {prod.retailPrice.toFixed(0)}</span>
                                  </button>
                                ))
                              }
                            </div>
                          )}

                          {/* Selected exchange product detail */}
                          {selectedExchangeProduct && (
                            <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl space-y-2">
                              <div className="flex justify-between gap-1 items-start">
                                <div>
                                  <span className="text-[9px] text-blue-600 font-bold uppercase block">Replacement product</span>
                                  <span className="font-bold text-slate-800 text-[11px] block leading-snug">{selectedExchangeProduct.name}</span>
                                  <span className="text-[10px] text-slate-500 font-mono block">Available Stock: {selectedExchangeProduct.stock} unit(s)</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedExchangeProduct(null)}
                                  className="text-[10px] text-slate-400 hover:text-red-500 cursor-pointer"
                                >
                                  Reset
                                </button>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-655 block">Replacement Quantity</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={selectedExchangeProduct.stock}
                                  value={exchangeAddQty}
                                  onChange={(e) => setExchangeAddQty(Math.min(selectedExchangeProduct.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                                  className="w-20 bg-white border border-slate-200 rounded p-1 font-bold font-mono text-xs focus:ring-1 focus:ring-blue-500"
                                />
                              </div>

                              {/* Cash difference calculation */}
                              <div className="pt-2 border-t border-blue-100/30 flex justify-between items-center text-[11px]">
                                <span className="text-slate-500">Net exchange diff:</span>
                                {(() => {
                                  const addPrice = activeReceiptView.paymentMethod === 'khata' && customers?.find(c => c.id === activeReceiptView.customerId)?.isContractor
                                    ? selectedExchangeProduct.wholesalePrice 
                                    : selectedExchangeProduct.retailPrice;
                                  
                                  const diff = (exchangeAddQty * addPrice) - (returnQty * returnItem.sellingPrice);
                                  return (
                                    <span className={`font-black font-mono ${diff >= 0 ? 'text-red-655' : 'text-emerald-700'}`}>
                                      {diff > 0 ? `Client Pays Rs. ${diff.toFixed(2)}` : diff < 0 ? `Refund Client Rs. ${Math.abs(diff).toFixed(2)}` : 'Even Swap (Rs. 0.00)'}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit operational actions */}
                  <div className="pt-2">
                    {actionType === 'return' ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onReturnPOSItem) {
                            onReturnPOSItem(activeReceiptView.id, returnItem.productId, returnQty);
                          }
                          setReturnItem(null);
                          setActiveReceiptView(null);
                        }}
                        className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition text-xs shadow-xs cursor-pointer text-center block"
                      >
                        Refund & Adjust Order
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!selectedExchangeProduct}
                        onClick={() => {
                          if (onExchangePOSItem && selectedExchangeProduct) {
                            onExchangePOSItem(
                              activeReceiptView.id,
                              returnItem.productId,
                              returnQty,
                              selectedExchangeProduct.id,
                              exchangeAddQty
                            );
                          }
                          setReturnItem(null);
                          setActiveReceiptView(null);
                        }}
                        className={`w-full py-2.5 font-bold rounded-lg transition text-xs select-none block text-center ${selectedExchangeProduct ? 'bg-indigo-650 hover:bg-indigo-750 text-white cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                      >
                        Execute Swap Exchange
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
