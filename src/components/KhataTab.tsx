import React, { useState, useEffect } from 'react';
import { Customer, LedgerEntry, PaymentSchedule } from '../types';
import { 
  Search, 
  Users, 
  Plus, 
  CreditCard, 
  TrendingUp, 
  FileText, 
  ArrowDownLeft, 
  ArrowUpRight, 
  UserPlus,
  CircleAlert,
  CalendarDays,
  X,
  Download
} from 'lucide-react';

interface KhataTabProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'balance' | 'ledger'>) => void;
  onReceivePayment: (customerId: string, amount: number, note: string) => void;
  onUpdateSchedule: (customerId: string, scheduleList: PaymentSchedule[]) => void;
  lang?: 'en' | 'ur';
  initialCustomerId?: string | null;
}

export default function KhataTab({
  customers,
  onAddCustomer,
  onReceivePayment,
  onUpdateSchedule,
  lang = 'en',
  initialCustomerId,
}: KhataTabProps) {
  // Query Filter
  const [khataQuery, setKhataQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'contractor' | 'debtor'>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialCustomerId || customers[0]?.id || null);

  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  // Partial pay state modal
  const [showPayModal, setShowPayModal] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  // Register new client modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientIsContractor, setClientIsContractor] = useState(false);

  // Khata Payment Schedule state & handlers
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [schedAmount, setSchedAmount] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedNote, setSchedNote] = useState('');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amt = parseFloat(schedAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid installment amount.');
      return;
    }
    if (!schedDate) {
      alert('Please specify a due date for this schedule.');
      return;
    }

    const currentSchedule = selectedCustomer.paymentSchedule || [];
    const newPlan: PaymentSchedule = {
      id: 'sch-' + Date.now(),
      dueDate: schedDate,
      amount: amt,
      status: 'pending',
      note: schedNote || 'Regular payment installment plan'
    };

    onUpdateSchedule(selectedCustomer.id, [...currentSchedule, newPlan]);
    setSchedAmount('');
    setSchedDate('');
    setSchedNote('');
    setShowAddScheduleModal(false);
  };

  const handleMarkSchedulePaid = (scheduleId: string) => {
    if (!selectedCustomer) return;
    const currentSchedule = selectedCustomer.paymentSchedule || [];
    const targetPlan = currentSchedule.find(s => s.id === scheduleId);
    if (!targetPlan) return;

    // 1. Post actual payment to ledger
    onReceivePayment(selectedCustomer.id, targetPlan.amount, `Paid schedule installment: ${targetPlan.note || ''}`);

    // 2. Mark schedule item status as PAID
    const updated = currentSchedule.map(item => {
      if (item.id === scheduleId) {
        return {
          ...item,
          status: 'paid' as const
        };
      }
      return item;
    });
    onUpdateSchedule(selectedCustomer.id, updated);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (!selectedCustomer) return;
    const currentSchedule = selectedCustomer.paymentSchedule || [];
    const updated = currentSchedule.filter(s => s.id !== scheduleId);
    onUpdateSchedule(selectedCustomer.id, updated);
  };

  // Filters application
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(khataQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(khataQuery.toLowerCase());

    const matchesType = 
      filterType === 'all' ||
      (filterType === 'contractor' && c.isContractor) ||
      (filterType === 'debtor' && c.balance > 0);

    return matchesSearch && matchesType;
  });

  const handleDownloadAllBalancesCSV = () => {
    if (customers.length === 0) {
      alert(lang === 'ur' ? 'ڈاؤن لوڈ کرنے کے لیے کوئی گاہک موجود نہیں ہے!' : 'No customer records available to download!');
      return;
    }

    const headers = [
      lang === 'ur' ? 'گاہک کا نام' : 'Customer Name',
      lang === 'ur' ? 'فون نمبر' : 'Phone Number',
      lang === 'ur' ? 'صارف کی قسم' : 'Customer Type',
      lang === 'ur' ? 'کل واجب الادا رقم (روپے)' : 'Outstanding Balance (Rs.)'
    ];

    const rows = customers.map(cust => {
      const typeStr = cust.isContractor 
        ? (lang === 'ur' ? 'ٹھیکیدار (Contractor)' : 'Contractor') 
        : (lang === 'ur' ? 'عام گاہک (Retail)' : 'Retail Customer');
      return [
        `"${cust.name.replace(/"/g, '""')}"`,
        `"${cust.phone}"`,
        `"${typeStr}"`,
        cust.balance.toFixed(2)
      ];
    });

    const csvContent = "\ufeff" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Khata_All_Balances_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadClientLedgerCSV = (cust: Customer) => {
    if (cust.ledger.length === 0) {
      alert(lang === 'ur' ? 'اس گاہک کی لین دین کا کوئی ریکارڈ موجود نہیں ہے!' : 'No ledger records available to download for this customer!');
      return;
    }

    const headers = [
      lang === 'ur' ? 'تاریخ و وقت' : 'Date & Time',
      lang === 'ur' ? 'لین دین کی تفصیل' : 'Transaction Description',
      lang === 'ur' ? 'قسم' : 'Type',
      lang === 'ur' ? 'رقم (روپے)' : 'Amount (Rs.)',
      lang === 'ur' ? 'نیا بقایا (روپے)' : 'Balance After (Rs.)'
    ];

    const rows = cust.ledger.map(entry => {
      const typeStr = entry.type === 'payment'
        ? (lang === 'ur' ? 'ادائیگی (Payment)' : 'Payment')
        : (lang === 'ur' ? 'خریداری (Purchase)' : 'Purchase/Debit');
      const formattedDate = new Date(entry.date).toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-US');
      return [
        `"${formattedDate}"`,
        `"${entry.description.replace(/"/g, '""')}"`,
        `"${typeStr}"`,
        entry.amount.toFixed(2),
        entry.balanceAfter.toFixed(2)
      ];
    });

    const csvContent = "\ufeff" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ledger_Report_${cust.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegisterClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    onAddCustomer({
      name: clientName,
      phone: clientPhone || 'Unspecified',
      isContractor: clientIsContractor
    });

    setClientName('');
    setClientPhone('');
    setClientIsContractor(false);
    setShowCreateModal(false);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountFloat = parseFloat(payAmount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      alert('Please state a valid payment installment amount.');
      return;
    }

    if (showPayModal) {
      onReceivePayment(showPayModal.id, amountFloat, payNote || 'Cash partial installment payment');
      setPayAmount('');
      setPayNote('');
      setShowPayModal(null);
    }
  };

  // Aggregates
  const totalKhataOutstanding = customers.reduce((sum, c) => sum + c.balance, 0);
  const totalContractors = customers.filter(c => c.isContractor).length;

  return (
    <div className="space-y-6">
      {/* Top Ledger Overview Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-slate-200 shadow-sm bg-white flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider block">Gross Outstanding Credit</span>
            <div className="text-2xl font-black font-sans text-orange-600">Rs. {totalKhataOutstanding.toFixed(2)}</div>
            <p className="text-[10px] text-slate-400">Total Udhaar outstanding with regular contractors</p>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-200 shadow-sm bg-white flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider block">Active Accounts</span>
            <div className="text-2xl font-bold font-sans text-slate-900">{customers.length} Accounts</div>
            <p className="text-[10px] text-slate-400">Including {totalContractors} verified contractors</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded">
            <Users className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-200 shadow-sm bg-white flex items-center justify-between">
          <div className="space-y-1.5 w-full">
            <span className="text-[10px] text-slate-450 font-bold font-mono uppercase block">
              {lang === 'ur' ? 'کھاتہ انتظام کلاسک' : 'Accounts Management Workspace'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
              >
                <UserPlus className="w-4 h-4 animate-pulse" />
                {lang === 'ur' ? 'نیا کھاتہ کھولیں' : 'New Customer'}
              </button>
              <button
                onClick={handleDownloadAllBalancesCSV}
                className="text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
                title={lang === 'ur' ? 'تمام کھاتوں کی لسٹ ڈاؤن لوڈ کریں' : 'Download All Credit Wallets CSV'}
              >
                <Download className="w-4 h-4" />
                {lang === 'ur' ? 'کھاتہ لسٹ CSV' : 'Export Balances'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main split ledger viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
        
        {/* LEFT 3 Columns: Customer register directory tree */}
        <div className="lg:col-span-3 bg-white border border-slate-200 shadow-sm rounded-lg flex flex-col overflow-hidden max-h-[600px]">
          <div className="p-4 bg-slate-50 border-b border-light/60 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search contractor or phone..."
                value={khataQuery}
                onChange={(e) => setKhataQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-1.5 text-xs bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 rounded outline-none transition"
              />
              {khataQuery && (
                <button
                  type="button"
                  onClick={() => setKhataQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1 text-[10px] font-bold rounded transiton cursor-pointer text-center ${filterType === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All Keys
              </button>
              <button
                onClick={() => setFilterType('contractor')}
                className={`flex-1 py-1 text-[10px] font-bold rounded transiton cursor-pointer text-center ${filterType === 'contractor' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Contractors
              </button>
              <button
                onClick={() => setFilterType('debtor')}
                className={`flex-1 py-1 text-[10px] font-bold rounded transiton cursor-pointer text-center ${filterType === 'debtor' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                With Debt
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-0.5">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs italic">
                No accounts match.
              </div>
            ) : (
              filteredCustomers.map(cust => (
                <button
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(cust.id)}
                  className={`w-full text-left p-3.5 transition flex items-center justify-between text-xs cursor-pointer ${
                    cust.id === selectedCustomerId ? 'bg-indigo-50/50 border-l-[3px] border-indigo-600 font-semibold' : 'hover:bg-slate-50/40'
                  }`}
                >
                  <div className="space-y-0.5 max-w-[150px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-slate-900 font-semibold block truncate">{cust.name}</span>
                      {(() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const overdue = (cust.paymentSchedule || []).some(s => s.status === 'pending' && s.dueDate <= todayStr);
                        return overdue ? (
                          <span className="inline-flex items-center gap-0.5 animate-pulse bg-red-50 text-red-600 font-extrabold text-[8px] px-1 py-0.2 rounded border border-red-200 shrink-0 uppercase tracking-widest" title="OVERDUE installment schedule warning">
                            <CircleAlert className="w-2.5 h-2.5" />
                            <span>{lang === 'ur' ? 'واجب الادا' : 'Overdue'}</span>
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{cust.phone}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold ${cust.balance > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                      Rs. {cust.balance.toFixed(2)}
                    </span>
                    <div className="text-[9px] text-slate-400">Balance due</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT 5 Columns: Chronological dynamic Ledger lists with partial pays */}
        <div className="lg:col-span-5 space-y-4">
          {selectedCustomer ? (
            <div className="bg-white border border-slate-100 shadow-xs rounded-xl overflow-hidden flex flex-col max-h-[600px]">
              
              {/* Client Profile Header */}
              <div className="p-5 bg-slate-900 text-white flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-sans">{selectedCustomer.name}</h3>
                    {selectedCustomer.isContractor && (
                      <span className="bg-emerald-500/15 text-emerald-400 text-[9px] uppercase font-mono tracking-wider font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                        🎖️ PRIME CONTRACTOR
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">Phone ref: <b className="font-mono text-slate-200">{selectedCustomer.phone}</b></p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-orange-400">Rs. {selectedCustomer.balance.toFixed(2)}</div>
                  <span className="text-[9px] text-slate-400 font-mono">Current Udhaar Standing Ledger</span>
                </div>
              </div>

              {/* Installments Action block */}
              <div className="p-4 bg-slate-50 border-b border-light flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-xs">
                  <span className="text-slate-500 uppercase font-mono text-[9px] block">
                    {lang === 'ur' ? 'کھاتہ ادائیگی اور ریکارڈ ایکشنز' : 'Settlement actions:'}
                  </span>
                  <p className="text-slate-800 text-[11px]">
                    {lang === 'ur' ? 'آئٹم کیش ادائیگی درج کریں اور گاہک کی سٹیٹمنٹ فائل حاصل کریں۔' : 'Receive periodic customer installments or export the full transaction history.'}
                  </p>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDownloadClientLedgerCSV(selectedCustomer)}
                    className="flex-1 sm:flex-none px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-755 font-bold text-xs rounded-lg transition shrink-0 cursor-pointer flex items-center justify-center gap-1 border border-slate-300"
                    title={lang === 'ur' ? 'سٹیٹمنٹ ڈاؤن لوڈ کریں' : 'Download Ledger Transactions Statement CSV'}
                  >
                    <Download className="w-3.5 h-3.5" />
                    {lang === 'ur' ? 'سٹیٹمنٹ ڈاؤن لوڈ' : 'Export Statement'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPayModal(selectedCustomer);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer shadow-xs flex items-center justify-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    {lang === 'ur' ? 'ادائیگی وصول کریں' : 'Receive Payment'}
                  </button>
                </div>
              </div>

              {/* Transactions Ledger chronological list */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-widest block mb-1">
                  Ledger audit timeline runs
                </h4>

                {selectedCustomer.ledger.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No legacy Khata runs logged for this customer.
                    <div className="mt-1 text-[10px]">Purchases checked out with Udhaar will list chronological records here.</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...selectedCustomer.ledger].reverse().map(entry => {
                      const isPay = entry.type === 'payment';

                      return (
                        <div key={entry.id} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between text-xs transition border border-slate-50">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-lg ${isPay ? 'bg-emerald-100/60 text-emerald-700' : 'bg-orange-100/60 text-orange-700'}`}>
                              {isPay ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{entry.description}</div>
                              <span className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <CalendarDays className="w-3 h-3 text-slate-300" />
                                {new Date(entry.date).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`font-mono font-bold text-sm ${isPay ? 'text-emerald-600' : 'text-orange-500'}`}>
                              {isPay ? '-' : '+'}Rs. {entry.amount.toFixed(2)}
                            </span>
                            <div className="text-[9px] text-slate-400 font-mono">Bal: Rs. {entry.balanceAfter.toFixed(2)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Payment Schedule Section */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-indigo-600 animate-pulse" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                      Payment Schedule ({selectedCustomer.paymentSchedule?.filter(s => s.status === 'pending').length || 0} Pending)
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowAddScheduleModal(true)}
                    className="text-[10px] font-extrabold text-indigo-650 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded cursor-pointer transition select-none uppercase tracking-wide"
                  >
                    + Add Installment Plan
                  </button>
                </div>

                {!selectedCustomer.paymentSchedule || selectedCustomer.paymentSchedule.filter(s => s.status === 'pending').length === 0 ? (
                  <div className="text-center py-6 bg-white border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-450 italic">
                    No active scheduled payments plotted. Plan future installments using the button above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto">
                    {selectedCustomer.paymentSchedule.map(sched => {
                      const isPending = sched.status === 'pending';
                      return (
                        <div key={sched.id} className={`p-3 bg-white border rounded-xl flex items-center justify-between text-xs transition ${isPending ? 'border-indigo-100 shadow-3xs' : 'border-slate-100 opacity-60'}`}>
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800">Rs. {sched.amount.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Due: {new Date(sched.dueDate).toLocaleDateString()}</div>
                            {sched.note && <p className="text-[9px] text-slate-500 italic truncate max-w-[130px]">{sched.note}</p>}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleMarkSchedulePaid(sched.id)}
                                  className="text-[9px] font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded cursor-pointer shadow-3xs"
                                  title="Mark item as paid off & post to customer ledger"
                                >
                                  Mark Paid
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSchedule(sched.id)}
                                  className="text-slate-400 hover:text-red-500 cursor-pointer p-0.5 rounded"
                                  title="Remove plan"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider font-mono">✓ Paid</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-100 shadow-xs rounded-xl p-12 text-center text-slate-400 text-xs italic">
              Create and select a regular account client on the left to review billing ledgers.
            </div>
          )}
        </div>

      </div>

      {/* MODAL 1: Partial payment form install */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setShowPayModal(null);
                setPayAmount('');
                setPayNote('');
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="font-bold text-slate-800 text-sm mb-1">Book Partial Credit Payment</h4>
            <p className="text-xs text-slate-500 mb-3 block">Received installment from <b>{showPayModal.name}</b></p>

            <form onSubmit={handleProcessPayment} className="space-y-4 text-xs select-none">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Installment Amount (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g., 50.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold font-mono outline-hidden focus:border-emerald-500"
                  autoFocus
                  required
                />
                <span className="text-[10px] text-slate-400 italic">Remaining outstanding balance: Rs. {showPayModal.balance.toFixed(2)}</span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Audit Cash Memo Details (Memo/Note)</label>
                <input
                  type="text"
                  placeholder="e.g., Paid cash at register 1 - Ref John"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPayModal(null);
                    setPayAmount('');
                    setPayNote('');
                  }}
                  className="px-3 py-2 bg-slate-150 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-sm"
                >
                  Post Payment Ledger Row
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create new client register card */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="font-bold text-slate-800 text-sm mb-1">Add New Khata Ledger Wallet</h4>
            <p className="text-xs text-slate-500 mb-4 block">Register regular contractor or construction client credit accounts.</p>

            <form onSubmit={handleRegisterClient} className="space-y-4 text-xs select-none">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Client / Lead Contractor Name</label>
                <input
                  type="text"
                  placeholder="e.g., Sarah Jenkins (Drywall Inc)"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Direct Telephone Number</label>
                <input
                  type="text"
                  placeholder="e.g., 555-0329-10"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                <input
                  type="checkbox"
                  id="chkIsContractor"
                  checked={clientIsContractor}
                  onChange={(e) => setClientIsContractor(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-500 shrink-0"
                />
                <label htmlFor="chkIsContractor" className="cursor-pointer">
                  <span className="font-semibold text-slate-900 block">Set as high-volume Contractor?</span>
                  <p className="text-[10px] text-slate-500">Automatically activates wholesale discount prices for POS checkout bills</p>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 bg-slate-150 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-slate-900 hover:bg-black text-white font-semibold rounded-lg"
                >
                  Create Client Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 3: Schedule plot installment form */}
      {showAddScheduleModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setShowAddScheduleModal(false);
                setSchedAmount('');
                setSchedDate('');
                setSchedNote('');
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="font-bold text-slate-800 text-sm mb-1">Schedule Udhaar Partial Installment</h4>
            <p className="text-xs text-slate-500 mb-3 block">Plot future payments due for <b>{selectedCustomer.name}</b></p>

            <form onSubmit={handleCreateSchedule} className="space-y-4 text-xs select-none">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Installment Amount Planned (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g., 25000"
                  value={schedAmount}
                  onChange={(e) => setSchedAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold font-mono outline-hidden focus:border-indigo-505"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Expected Settlement Due Date</label>
                <input
                  type="date"
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-505 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Installment description/memo</label>
                <input
                  type="text"
                  placeholder="e.g., Post-dated check 104 or cash commitment"
                  value={schedNote}
                  onChange={(e) => setSchedNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-550"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddScheduleModal(false);
                    setSchedAmount('');
                    setSchedDate('');
                    setSchedNote('');
                  }}
                  className="px-3 py-2 bg-slate-150 rounded-lg text-slate-605"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Plot Due Installment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
