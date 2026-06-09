import React from 'react';
import { Product, Customer, SaleRecord, PurchaseOrder } from '../types';
import { translations, Language } from '../translations';
import { 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  ShoppingBag, 
  ArrowUpRight, 
  BadgeDollarSign, 
  Package, 
  Plus, 
  CreditCard,
  Database,
  Upload
} from 'lucide-react';

interface DashboardTabProps {
  products: Product[];
  customers: Customer[];
  sales: SaleRecord[];
  purchaseOrders: PurchaseOrder[];
  onNavigate: (tab: string) => void;
  onQuickRestock: (product: Product) => void;
  lang?: Language;
  onBackup?: () => void;
  onRestore?: (fileContent: string) => void;
}

export default function DashboardTab({
  products,
  customers,
  sales,
  purchaseOrders,
  onNavigate,
  onQuickRestock,
  lang = 'en',
  onBackup,
  onRestore,
}: DashboardTabProps) {
  const t = translations[lang];
  // Calculations
  const totalSalesCostPrice = sales.reduce((acc, sale) => acc + (sale.totalCost || 0), 0);
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  const totalProfit = sales.reduce((acc, sale) => acc + sale.profit, 0);
  
  // Total Credit Owed to hardware store
  const totalCreditOwed = customers.reduce((acc, cust) => acc + cust.balance, 0);
  
  // Under-stock item count
  const lowStockItems = products.filter(p => p.stock <= p.threshold);
  
  // Active Purchase orders (pending ordered)
  const pendingOrdersCount = purchaseOrders.filter(po => po.status === 'ordered').length;

  // Let's build a clean date/sales overview for the last 5 sales
  const recentSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  // Profit Margin percentage
  const marginPercentage = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-slate-800 rounded-full opacity-30 pointer-events-none" />
        <div className="absolute right-32 bottom-0 translate-y-24 w-48 h-48 bg-blue-600 rounded-full opacity-10 pointer-events-none" />
        
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">{t.liveStatus}</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1 font-sans text-white">
            {lang === 'ur' ? `${t.appName} کا کنٹرول ہب` : `${t.appName} Control Panel`}
          </h1>
          <p className="text-slate-300 text-xs mt-1 max-w-xl">
            {t.dashboardDesc}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 z-10 shrink-0">
          <button 
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t.newCheckout}
          </button>
          <button 
            onClick={() => onNavigate('khata')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-705 active:bg-slate-705 text-slate-100 border border-slate-700 rounded text-xs font-bold transition cursor-pointer"
          >
            <Users className="w-4 h-4" />
            {t.collectKhata}
          </button>
        </div>
      </div>

      {/* Grid STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-2 font-sans">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">{t.netSalesVolume}</span>
            <div className="text-2xl font-bold font-sans text-slate-900">Rs. {totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{marginPercentage}% {lang === 'ur' ? 'اوسط منافع' : 'average margin'}</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded shrink-0">
            <BadgeDollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-2 font-sans">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">{t.grossNetProfit}</span>
            <div className="text-2xl font-bold font-sans text-slate-900">Rs. {totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="text-xs text-slate-500 font-mono">
              {lang === 'ur' ? `کل لاگت COGS: Rs. ${totalSalesCostPrice.toFixed(2)}` : `COGS Cost: Rs. ${totalSalesCostPrice.toFixed(2)}`}
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-2 font-sans">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">{t.outstandingKhata}</span>
            <div className="text-2xl font-bold font-sans text-orange-600">Rs. {totalCreditOwed.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="text-xs text-slate-500">
              {lang === 'ur' ? 'باقاعدہ ٹھیکیداروں کے واجبات' : 'Owed by regular local contractors'}
            </div>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-2 font-sans">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">{t.lowStockIndicators}</span>
            <div className="text-2xl font-bold font-sans text-amber-600 font-mono">{lowStockItems.length} {lang === 'ur' ? 'آئٹم' : 'items'}</div>
            <div className="text-xs text-slate-500">
              {pendingOrdersCount} {lang === 'ur' ? 'زیر التوا آرڈرز' : 'pending supply restocks'}
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Section: Quick restock and past transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Alerts & SVG chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Custom SVG Sales Chart */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm font-sans">{t.financesTrend}</h3>
                <p className="text-xs text-slate-500 font-sans">{t.graphDesc}</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block" />
                  <span>{lang === 'ur' ? 'خالص منافع' : 'Gross Profit'}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 bg-slate-300 rounded-full inline-block" />
                  <span>{lang === 'ur' ? 'خام لاگت' : 'Product Cost'}</span>
                </div>
              </div>
            </div>

            {/* Custom Interactive SVG Visualizer */}
            <div className="h-56 relative w-full flex items-end justify-between px-2 pt-6">
              {sales.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                  No sales logged. Make a POS transaction to draw chart.
                </div>
              ) : (
                <div className="w-full h-full flex items-end justify-around relative">
                  {/* Background Grid Lines */}
                  <div className="absolute inset-x-0 top-0 border-t border-slate-100" />
                  <div className="absolute inset-x-0 top-1/3 border-t border-slate-100" />
                  <div className="absolute inset-x-0 top-2/3 border-t border-slate-100" />
                  <div className="absolute inset-x-0 bottom-0 border-b border-slate-200" />

                  {/* Profit Bars */}
                  {sales.slice(-6).map((sale, idx) => {
                    const totalVal = Math.max(sale.totalAmount, 1);
                    const costHeight = (sale.totalCost / totalVal) * 100;
                    const profitHeight = (sale.profit / totalVal) * 100;
                    const maxPossibleValue = Math.max(...sales.map(s => s.totalAmount), 10);
                    const barScaleHeight = (sale.totalAmount / maxPossibleValue) * 80; // scale down slightly for safety pad

                    return (
                      <div key={sale.id} className="flex flex-col items-center group w-12 text-center relative z-10">
                        {/* Interactive tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition absolute bottom-full mb-2 bg-slate-900 text-slate-100 px-2 py-1.5 rounded-lg text-[10px] w-28 text-center shadow-lg z-30 pointer-events-none">
                          <p className="font-semibold text-white">Amt: Rs. {sale.totalAmount.toFixed(2)}</p>
                          <p className="text-emerald-400 font-mono">Profit: Rs. {sale.profit.toFixed(2)}</p>
                          <p className="text-slate-400 text-[8px]">{new Date(sale.date).toLocaleDateString()}</p>
                        </div>

                        {/* Staged Columns */}
                        <div className="w-7 bg-slate-100 rounded-md overflow-hidden flex flex-col justify-end transition-all group-hover:ring-2 ring-emerald-300 cursor-pointer shadow-xs" style={{ height: `${Math.max(barScaleHeight, 15)}%` }}>
                          {/* Profit portion */}
                          <div className="w-full bg-emerald-500 transition hover:bg-emerald-600" style={{ height: `${profitHeight}%` }} />
                          {/* Cost component */}
                          <div className="w-full bg-slate-300" style={{ height: `${costHeight}%` }} />
                        </div>

                        {/* X-axis Identifier label */}
                        <span className="text-[10px] text-slate-500 mt-2 block font-mono">
                          #{sale.id.slice(-4)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 flex-wrap gap-2">
              <span className="text-xs text-slate-500 italic font-sans">{lang === 'ur' ? 'آخری 6 بلز تصفیہ کی فروخت کا تصویری جائزہ' : 'Showing the 6 most recent checkout transactions'}</span>
              <button 
                onClick={() => onNavigate('reports')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer font-sans"
              >
                {t.detailedReports} <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Urgent Stock Refill Panel */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm font-sans">{t.urgentStockTitle}</h3>
                <p className="text-xs text-slate-500 font-sans">{t.urgentStockDesc}</p>
              </div>
              <span className="text-xs font-mono bg-amber-50 text-amber-700 px-2.5 py-1 rounded font-semibold ring-1 ring-amber-100 shrink-0">
                {lowStockItems.length} {lang === 'ur' ? 'آرڈرز درکار' : 'Urgent refills'}
              </span>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Package className="w-8 h-8 text-stone-300" />
                <span className="font-sans">{lang === 'ur' ? 'گودام کے تمام آئٹمز کا اسٹاک مکمل ہے۔ کوئی خریداری درکار نہیں!' : 'All hardware items are stocked to standard capacities. No refills required!'}</span>
              </div>
            
            ) : (
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                {lowStockItems.map(item => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">SKU: {item.code}</span>
                        <span>{lang === 'ur' ? 'یونٹ' : 'Unit'}: <b className="text-slate-700">{item.unit}</b></span>
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          {lang === 'ur' ? 'لوکیشن' : 'Location'}: <b className="text-slate-800 font-mono">{item.location}</b>
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3 shrink-0">
                      <div>
                        <div className="font-mono font-bold text-red-600">{lang === 'ur' ? 'باقی تعداد' : 'Qty'}: {item.stock}</div>
                        <div className="text-[9px] text-slate-400">{lang === 'ur' ? 'کم از کم حد' : 'Min Threshold'}: {item.threshold}</div>
                      </div>
                      <button
                        onClick={() => onQuickRestock(item)}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-200 rounded font-medium transition cursor-pointer"
                      >
                        {lang === 'ur' ? 'آرڈر کریں' : 'Create PO'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Sales Activity & Quick Ledger Indicators */}
        <div className="space-y-6">
          {/* Quick Stats of Accounts */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 text-sm mb-3 font-sans">{t.quickKhataTitle}</h3>
            
            <div className="space-y-3">
              {customers.slice(0, 3).map(cust => (
                <div key={cust.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs transition hover:bg-stone-50">
                  <div>
                    <div className="font-medium text-slate-800 truncate max-w-[140px] font-sans">{cust.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                      {cust.isContractor 
                        ? (lang === 'ur' ? '🎖️ تصدیق شدہ ٹھیکیدار' : '🎖️ Prime Contractor')
                        : (lang === 'ur' ? 'عام کھاتہ گاہک' : 'Retail Credit Account')
                      }
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold ${cust.balance > 0 ? 'text-orange-600' : 'text-slate-500'}`}>
                      Rs. {cust.balance.toFixed(2)}
                    </span>
                    <div className="text-[9px] text-slate-400 font-sans">{lang === 'ur' ? 'بقیہ کھاتہ ادھار' : 'Balance Owed'}</div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => onNavigate('khata')}
                className="w-full text-center py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold mt-1 transition cursor-pointer font-sans"
              >
                {lang === 'ur' ? 'مکمل ادھار کھاتہ رجسٹر کھولیں' : 'Go to Khata Ledger Register'}
              </button>
            </div>
          </div>

          {/* Recent Sales Log */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 text-sm mb-3 font-sans">{t.recentBillsTitle}</h3>
            
            {recentSales.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-sans">
                {t.noSalesRecorded}
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {recentSales.map(sale => (
                  <div key={sale.id} className="p-2.5 rounded-xl border border-slate-55 hover:bg-slate-50/50 flex flex-col gap-1.5 transition">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-700 font-semibold uppercase text-[10px]">
                        Bill #{sale.id.slice(-5)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-800 font-sans">
                        <span className="font-medium">{sale.customerName}</span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {sale.items.length} {lang === 'ur' ? 'اشیاء' : `unique items`}
                        </div>
                      </div>
                      <div className="text-right text-xs shrink-0 font-sans">
                        <div className="font-bold text-slate-900 font-mono">Rs. {sale.totalAmount.toFixed(2)}</div>
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] rounded font-mono font-semibold uppercase ${
                          sale.paymentMethod === 'khata' ? 'bg-orange-50 text-orange-700' :
                          sale.paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {sale.paymentMethod === 'khata' ? (lang === 'ur' ? 'کھاتہ' : 'khata') :
                           sale.paymentMethod === 'cash' ? (lang === 'ur' ? 'نقد' : 'cash') :
                           (lang === 'ur' ? 'کارڈ' : 'card')
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={() => onNavigate('reports')}
              className="w-full text-center py-2 bg-slate-55 hover:bg-slate-100 text-slate-600 border border-slate-100 rounded-xl text-xs font-semibold mt-3 transition cursor-pointer font-sans"
            >
              {lang === 'ur' ? 'منافع نقصان کا آڈیٹ تجزیہ کریں' : 'Analyze Complete Transactions Ledger'}
            </button>
          </div>

            {/* Sovereign Data Backup & Restore Hub */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs font-sans">
                    {lang === 'ur' ? 'ڈیٹا بیک اپ اور بحالی' : 'Sovereign Database Backup & Sync'}
                  </h3>
                  <p className="text-[10px] text-slate-450 font-sans">
                    {lang === 'ur' ? 'پورے سسٹم کا بیک اپ ڈاؤن لوڈ یا ری سٹور کریں۔' : 'Export secure JSON datasets or sync to Firebase Firestore.'}
                  </p>
                </div>
              </div>
  
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={onBackup}
                  className="py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl transition cursor-pointer text-center shadow-xs flex items-center justify-center gap-1.5"
                  title={lang === 'ur' ? 'موجودہ ڈیٹا کا بیک اپ فائل ڈاؤن لوڈ کریں' : 'Download comprehensive active database JSON'}
                >
                  <Database className="w-4 h-4" />
                  <span>{lang === 'ur' ? 'بیک اپ فائل' : 'Create Backup'}</span>
                </button>
  
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm("Do you want to migrate all local offline records to Firebase Cloud?")) {
                      const { migrateLocalToFirebase } = await import('../firebaseMigration');
                      const success = await migrateLocalToFirebase();
                      if (success) {
                        alert("Firebase Migration Completed! All local data is pushed to Firestore.");
                      }
                    }
                  }}
                  className="py-2.5 bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold rounded-xl border border-sky-200 transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                  title="Upload all local hardware data to Firebase Cloud Firestore"
                >
                  <Upload className="w-4 h-4" />
                  <span>Push to Firebase</span>
                </button>
              </div>
            
            <p className="text-[9px] text-slate-400 font-sans italic text-center">
              {lang === 'ur' 
                ? 'محفوظ رہیں۔ باقاعدگی سے اپنی دکان کا بیک اپ لیں۔' 
                : 'Note: Store backups securely. Do not share JSON files raw.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
