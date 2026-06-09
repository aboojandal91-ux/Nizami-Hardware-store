import React, { useState, useEffect } from 'react';
import { Supplier, PurchaseOrder, Product, POItem, PaymentSchedule } from '../types';
import { HARDWARE_CATEGORIES } from '../data/mockData';
import { 
  Plus, 
  Search, 
  Handshake, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  Truck, 
  ChevronRight, 
  BadgeDollarSign, 
  Trash2, 
  Users,
  X,
  PlusCircle,
  FileSpreadsheet,
  CalendarDays,
  AlertTriangle
} from 'lucide-react';

interface SupplierTabProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  onAddSupplier: (supplier: Omit<Supplier, 'id' | 'balance' | 'ledger'>) => void;
  onPaySupplier: (supplierId: string, amount: number, memo: string) => void;
  onCreatePO: (po: Omit<PurchaseOrder, 'id' | 'supplierName'>) => void;
  onUpdatePOStatus: (poId: string, status: 'draft' | 'ordered' | 'received') => void;
  onReceivePOArticles: (po: PurchaseOrder) => void; // Trigger stock increases!
  prefilledProductId?: string | null;
  clearPrefilledProductId?: () => void;
  onPayTowardsPO?: (poId: string, paymentAmount: number, note: string) => void;
  onUpdatePOSchedule?: (poId: string, scheduleList: PaymentSchedule[]) => void;
}

export default function SupplierTab({
  suppliers,
  purchaseOrders,
  products,
  onAddSupplier,
  onPaySupplier,
  onCreatePO,
  onUpdatePOStatus,
  onReceivePOArticles,
  prefilledProductId,
  clearPrefilledProductId,
  onPayTowardsPO,
  onUpdatePOSchedule
}: SupplierTabProps) {
  // Toggle states
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(suppliers[0]?.id || null);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<Supplier | null>(null);
  const [showCreatePOModal, setShowCreatePOModal] = useState(false);
  const [pendingReceivePO, setPendingReceivePO] = useState<PurchaseOrder | null>(null);

  // Filters
  const [supplierQuery, setSupplierQuery] = useState('');

  // Suppliers form
  const [newSuppName, setNewSuppName] = useState('');
  const [newSuppContact, setNewSuppContact] = useState('');
  const [newSuppPhone, setNewSuppPhone] = useState('');

  // Payment form
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  // Supplier Purchase Order Partial Payments & Schedules
  const [showPOPaymentModal, setShowPOPaymentModal] = useState<PurchaseOrder | null>(null);
  const [poPaymentAmt, setPoPaymentAmt] = useState('');
  const [poPaymentNote, setPoPaymentNote] = useState('');

  const [showPOScheduleModal, setShowPOScheduleModal] = useState<PurchaseOrder | null>(null);
  const [poSchedAmount, setPoSchedAmount] = useState('');
  const [poSchedDate, setPoSchedDate] = useState('');
  const [poSchedNote, setPoSchedNote] = useState('');

  const handleProcessPOPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPOPaymentModal || !onPayTowardsPO) return;
    const amountFloat = parseFloat(poPaymentAmt);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      alert('Please state a valid payment amount.');
      return;
    }

    onPayTowardsPO(showPOPaymentModal.id, amountFloat, poPaymentNote || 'Installment toward purchase order');
    setPoPaymentAmt('');
    setPoPaymentNote('');
    setShowPOPaymentModal(null);
  };

  const handleCreatePOSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPOScheduleModal || !onUpdatePOSchedule) return;
    const amt = parseFloat(poSchedAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid installment amount.');
      return;
    }
    if (!poSchedDate) {
      alert('Please specify a due date for this schedule.');
      return;
    }

    const currentSchedule = showPOScheduleModal.paymentSchedule || [];
    const newPlan: PaymentSchedule = {
      id: 'po-sch-' + Date.now(),
      dueDate: poSchedDate,
      amount: amt,
      status: 'pending',
      note: poSchedNote || 'Po payment installment plan'
    };

    onUpdatePOSchedule(showPOScheduleModal.id, [...currentSchedule, newPlan]);
    setPoSchedAmount('');
    setPoSchedDate('');
    setPoSchedNote('');
    setShowPOScheduleModal(null);
  };

  const handleMarkPOSchedulePaid = (po: PurchaseOrder, scheduleId: string) => {
    if (!onPayTowardsPO || !onUpdatePOSchedule) return;
    const currentSchedule = po.paymentSchedule || [];
    const targetPlan = currentSchedule.find(s => s.id === scheduleId);
    if (!targetPlan) return;

    // 1. Post payment
    onPayTowardsPO(po.id, targetPlan.amount, `Paid PO schedule installment: ${targetPlan.note || ''}`);

    // 2. Mark PAID in state
    const updated = currentSchedule.map(item => {
      if (item.id === scheduleId) {
        return {
          ...item,
          status: 'paid' as const
        };
      }
      return item;
    });
    onUpdatePOSchedule(po.id, updated);
  };

  const handleDeletePOSchedule = (po: PurchaseOrder, scheduleId: string) => {
    if (!onUpdatePOSchedule) return;
    const currentSchedule = po.paymentSchedule || [];
    const updated = currentSchedule.filter(s => s.id !== scheduleId);
    onUpdatePOSchedule(po.id, updated);
  };

  // PO Form draft lists
  const [poSupplierId, setPoSupplierId] = useState(suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; costPrice: number }[]>([]);
  
  // Quick additions for PO item row
  const [selectedAddProductId, setSelectedAddProductId] = useState(products[0]?.id || '');
  const [selectedAddQty, setSelectedAddQty] = useState('10');
  const [selectedAddCost, setSelectedAddCost] = useState('');

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  // Calculations for chosen add item
  const currentAddProductRef = products.find(p => p.id === selectedAddProductId);

  // Filters application
  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(supplierQuery.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(supplierQuery.toLowerCase())
  );

  // Prefill hook: when the user clicks 'Create PO' from low stock alerts
  useEffect(() => {
    if (prefilledProductId) {
      const match = products.find(p => p.id === prefilledProductId);
      if (match) {
        setSelectedAddProductId(match.id);
        const suggestedQty = Math.max(10, match.threshold * 2 - match.stock);
        setSelectedAddQty(suggestedQty.toString());
        setSelectedAddCost(match.costPrice.toString());
        
        // Auto add it to PO items draft and open modal
        setPoItems([{
          productId: match.id,
          quantity: suggestedQty,
          costPrice: match.costPrice
        }]);

        setShowCreatePOModal(true);
      }
      if (clearPrefilledProductId) {
        clearPrefilledProductId();
      }
    }
  }, [prefilledProductId, products, clearPrefilledProductId]);

  // Sync selection unit cost when changing product dropdown selection
  useEffect(() => {
    if (selectedAddProductId) {
      const match = products.find(p => p.id === selectedAddProductId);
      if (match) {
        setSelectedAddCost(match.costPrice.toString());
      }
    }
  }, [selectedAddProductId, products]);

  const handleRegisterSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppName.trim()) return;

    onAddSupplier({
      name: newSuppName,
      contactPerson: newSuppContact || 'General Operations',
      phone: newSuppPhone || 'Unlisted'
    });

    setNewSuppName('');
    setNewSuppContact('');
    setNewSuppPhone('');
    setShowAddSupplierModal(false);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(payAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Input valid dollar values to remit.');
      return;
    }

    if (showPayModal) {
      onPaySupplier(showPayModal.id, amountVal, payNote || 'Wire transfer pay settlement');
      setPayAmount('');
      setPayNote('');
      setShowPayModal(null);
    }
  };

  const handleAddPOItem = () => {
    if (!selectedAddProductId) return;
    const prod = products.find(p => p.id === selectedAddProductId);
    if (!prod) return;

    const existingIdx = poItems.findIndex(i => i.productId === selectedAddProductId);
    const parsedCost = parseFloat(selectedAddCost) || prod.costPrice;
    const parsedQty = parseInt(selectedAddQty) || 10;

    if (existingIdx > -1) {
      const updated = [...poItems];
      updated[existingIdx].quantity += parsedQty;
      setPoItems(updated);
    } else {
      setPoItems([...poItems, {
        productId: prod.id,
        quantity: parsedQty,
        costPrice: parsedCost
      }]);
    }
    // reset selection row
    setSelectedAddQty('10');
    setSelectedAddCost('');
  };

  const handleCreatePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      alert('Add at least one item line to this Draft Purchase order.');
      return;
    }

    const calculatedTotal = poItems.reduce((acc, row) => acc + (row.costPrice * row.quantity), 0);

    const formattedItems: POItem[] = poItems.map(row => {
      const matchedProd = products.find(p => p.id === row.productId);
      return {
        productId: row.productId,
        productName: matchedProd ? matchedProd.name : 'Unknown Product SKU',
        quantity: row.quantity,
        costPrice: row.costPrice
      };
    });

    onCreatePO({
      supplierId: poSupplierId,
      date: new Date().toISOString(),
      items: formattedItems,
      totalAmount: calculatedTotal,
      status: 'draft'
    });

    // Reset states
    setPoItems([]);
    setShowCreatePOModal(false);
  };

  const handlePOStatusClick = (po: PurchaseOrder, targetStatus: 'draft' | 'ordered' | 'received') => {
    if (targetStatus === 'received') {
      setPendingReceivePO(po);
    } else {
      onUpdatePOStatus(po.id, targetStatus);
    }
  };

  // Aggregates
  const suppliersOutstandingBalance = suppliers.reduce((s, sObj) => s + sObj.balance, 0);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider block">Bulk Payables Due</span>
            <div className="text-2xl font-black font-sans text-red-600">Rs. {suppliersOutstandingBalance.toFixed(2)}</div>
            <p className="text-[10px] text-slate-400">Total payable balances to active manufacturing suppliers</p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded">
            <BadgeDollarSign className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider block">Supplier Contacts</span>
            <div className="text-2xl font-bold font-sans text-slate-900">{suppliers.length} Factories</div>
            <p className="text-[10px] text-slate-400">Trusted distributors linked to auto PO generator</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-700 rounded">
            <Users className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center space-y-1.5">
          <button
            onClick={() => setShowCreatePOModal(true)}
            className="w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Truck className="w-4 h-4" />
            Establish Purchase Order (PO)
          </button>
        </div>
      </div>

      {/* Main split tab */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 4 columns: Suppliers selector */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden max-h-[500px] flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-light flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter manufactories..."
                  value={supplierQuery}
                  onChange={(e) => setSupplierQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-1.5 text-xs bg-white border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
                {supplierQuery && (
                  <button
                    type="button"
                    onClick={() => setSupplierQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded transition shrink-0 cursor-pointer shadow-3xs"
              >
                + Add Factory
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-0.5">
              {filteredSuppliers.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs italic">
                  No suppliers matching query.
                </div>
              ) : (
                filteredSuppliers.map(supp => (
                  <button
                    key={supp.id}
                    onClick={() => setSelectedSupplierId(supp.id)}
                    className={`w-full text-left p-4 flex items-center justify-between text-xs transition cursor-pointer ${
                      supp.id === selectedSupplierId ? 'bg-blue-50/75 border-l-[3px] border-blue-600 font-semibold text-blue-950' : 'hover:bg-slate-50/30'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{supp.name}</span>
                      <span className="text-[10px] text-slate-400">Rep: {supp.contactPerson} • {supp.phone}</span>
                    </div>

                    <div className="text-right">
                      <span className={`font-mono font-bold ${supp.balance > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                        Rs. {supp.balance.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-mono">Liability due</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Supplier Ledgers view detailing custom cash payments */}
          {selectedSupplier && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-5 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Liabilities Settle:</h4>
                  <p className="text-[11px] text-slate-400">Record payments to clear bulk delivery balances.</p>
                </div>
                
                <button
                  onClick={() => setShowPayModal(selectedSupplier)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition cursor-pointer shadow-xs"
                >
                  Post Payment Cashier
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <span className="text-[9px] uppercase font-mono tracking-wider font-semibold text-slate-400 block">Ledger ledger entries</span>
                {selectedSupplier.ledger.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic">
                    Cleared balance sheet. Ledger runs is clear.
                  </div>
                ) : (
                  [...selectedSupplier.ledger].reverse().map(lRow => {
                    const isPayment = lRow.type === 'payment';

                    return (
                      <div key={lRow.id} className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-xs border border-slate-50">
                        <div>
                          <span className="font-semibold text-slate-800 block">{lRow.description}</span>
                          <span className="text-[9px] text-slate-400">{new Date(lRow.date).toLocaleDateString()}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`font-mono font-bold ${isPayment ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {isPayment ? '-' : '+'}Rs. {lRow.amount.toFixed(2)}
                          </span>
                          <div className="text-[9px] font-mono text-slate-450">Bal: Rs. {lRow.balanceAfter.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 7 columns: PO creation workflow list */}
        <div className="lg:col-span-12 xl:col-span-7 bg-white border border-slate-200 shadow-sm rounded-lg p-5 flex flex-col overflow-hidden max-h-[660px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-505" />
                Outgoing Purchase Orders (POs) Track
              </h3>
              <span className="text-[10px] text-slate-400">Monitor ordered inventory delivery milestones from suppliers</span>
            </div>
            
            <button
              onClick={() => setShowCreatePOModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition cursor-pointer"
            >
              + Create PO Draft
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {purchaseOrders.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-xs">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                Outgoing Purchase logs are pristine.
              </div>
            ) : (
              [...purchaseOrders].reverse().map(po => {
                const getStatusStyle = (status: string) => {
                  switch (status) {
                    case 'received': return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold';
                    case 'ordered': return 'bg-blue-50 text-blue-700 border-blue-100 font-semibold';
                    default: return 'bg-slate-100 text-slate-600 border-slate-200';
                  }
                };

                return (
                  <div key={po.id} className="p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
                    <div className="flex justify-between items-start flex-wrap gap-2 text-xs">
                      <div>
                        <span className="font-mono text-sm font-black text-slate-900">{po.id}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">Supplier: <b>{po.supplierName}</b></div>
                        <div className="text-[10px] text-slate-400">Dated: {new Date(po.date).toLocaleDateString()}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(() => {
                          const todayStr = new Date().toISOString().split('T')[0];
                          const hasOverdue = (po.paymentSchedule || []).some(s => s.status === 'pending' && s.dueDate <= todayStr);
                          return hasOverdue ? (
                            <span className="inline-flex items-center gap-1 animate-pulse bg-red-50 text-red-600 border border-red-200 text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase font-mono">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              <span>OVERDUE</span>
                            </span>
                          ) : null;
                        })()}
                        <span className={`px-2 py-0.5 text-[9px] uppercase font-mono tracking-widest border rounded shrink-0 ${getStatusStyle(po.status)}`}>
                          {po.status}
                        </span>
                        
                        <span className="font-mono font-black text-sm text-slate-800">Rs. {po.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* PO Products Grid */}
                    <div className="bg-slate-50/70 rounded-lg p-3 text-[11px] space-y-1">
                      {po.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-slate-700">
                          <span>{it.productName}</span>
                          <span className="font-mono">
                            Qty: <b className="text-slate-900 font-bold">{it.quantity}</b> • Cost: Rs. {it.costPrice.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Partial Payments Tracking Indicator */}
                    <div className="border-t border-slate-100 pt-3 space-y-2 select-none text-xs">
                      <div className="flex justify-between items-center text-[11px] font-semibold">
                        <span className="text-slate-500">Order Payments Tracker:</span>
                        <div className="flex items-center gap-1.5 font-mono text-slate-800">
                          <span className="text-emerald-600 font-bold">Rs. {(po.paidAmount || 0).toFixed(2)} Paid</span>
                          <span>/</span>
                          <span className="text-slate-500">Rs. {po.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Visual progress bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, (((po.paidAmount || 0) / po.totalAmount) * 100)))}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>Due Remaining: <b className="font-mono text-slate-805">Rs. {(po.totalAmount - (po.paidAmount || 0)).toFixed(2)}</b></span>
                        <div className="flex gap-2 items-center">
                          {(po.totalAmount - (po.paidAmount || 0)) > 0.01 && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowPOPaymentModal(po);
                                setPoPaymentAmt((po.totalAmount - (po.paidAmount || 0)).toFixed(2));
                                setPoPaymentNote('');
                              }}
                              className="text-emerald-700 hover:text-emerald-900 font-extrabold uppercase tracking-wide cursor-pointer transition select-none"
                            >
                              💸 Pay Installment
                            </button>
                          )}
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPOScheduleModal(po);
                              setPoSchedAmount('');
                              setPoSchedDate('');
                              setPoSchedNote('');
                            }}
                            className="text-indigo-600 hover:text-indigo-855 font-extrabold uppercase tracking-wide cursor-pointer transition select-none"
                          >
                            ⏱️ Plan Schedule
                          </button>
                        </div>
                      </div>

                      {/* Scheduled installments list */}
                      {po.paymentSchedule && po.paymentSchedule.length > 0 && (
                        <div className="mt-2 bg-slate-50/60 border border-slate-100 rounded-lg p-2.5 space-y-1.5">
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-indigo-700 block">DUE INSTALLMENT RECORDS:</span>
                          <div className="space-y-1 max-h-[100px] overflow-y-auto">
                            {po.paymentSchedule.map(sched => (
                              <div key={sched.id} className="flex justify-between items-center text-[10px] py-1 border-b border-dashed border-slate-200/50 last:border-0 hover:bg-white px-1.5 rounded transition">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-800">Rs. {sched.amount.toFixed(2)} ({sched.status})</div>
                                  <div className="text-[9px] text-slate-400 font-mono">Date due: {new Date(sched.dueDate).toLocaleDateString()} {sched.note && `• ${sched.note}`}</div>
                                </div>
                                {sched.status === 'pending' ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleMarkPOSchedulePaid(po, sched.id)}
                                      className="text-[8px] font-black bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded cursor-pointer transition"
                                    >
                                      Pay Now
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePOSchedule(po, sched.id)}
                                      className="text-slate-400 hover:text-red-500 cursor-pointer text-xs font-bold px-1"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[8px] text-emerald-600 font-extrabold">✓ Settled</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Operational controls */}
                    {po.status !== 'received' && (
                      <div className="flex justify-end gap-1.5 pt-2">
                        {po.status === 'draft' && (
                          <button
                            onClick={() => handlePOStatusClick(po, 'ordered')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded cursor-pointer transition flex items-center gap-1"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            Mark Sent to Factory (Ordered)
                          </button>
                        )}
                        {po.status === 'ordered' && (
                          <button
                            onClick={() => handlePOStatusClick(po, 'received')}
                            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] rounded cursor-pointer transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Receive Cargo Stock (Increment Stock)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Slide Modal 1: Create Outgoing PO Draft */}
      {showCreatePOModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowCreatePOModal(false);
                setPoItems([]);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Compose Purchase Order Draft</h3>
            <p className="text-xs text-slate-500 mb-5">Select manufacturer supplier, draft items list, and set wholesale unit costs.</p>

            <form onSubmit={handleCreatePOSubmit} className="space-y-4 text-xs select-none">
              
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Primary Manufactory Supplier</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Liability Bal: Rs. {s.balance.toFixed(2)})</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Add Part Row selector */}
              <div className="p-4 bg-blue-50/55 rounded-lg space-y-3">
                <h4 className="font-bold text-blue-950 text-xs">Append Product Line Row</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                  <div className="md:col-span-5 space-y-1">
                    <label className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Matched Catalog Stock</label>
                    <select
                      value={selectedAddProductId}
                      onChange={(e) => {
                        setSelectedAddProductId(e.target.value);
                      }}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs outline-none font-semibold text-slate-700"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} • COGS: Rs. {p.costPrice})</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Unit Cost (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedAddCost}
                      onChange={(e) => setSelectedAddCost(e.target.value)}
                      placeholder="Cost"
                      className="w-full bg-white border border-slate-200 rounded p-1.5 font-mono text-xs text-center outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Replenish Qty</label>
                    <input
                      type="number"
                      value={selectedAddQty}
                      onChange={(e) => setSelectedAddQty(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 font-mono text-xs text-center outline-none"
                      required
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <button
                      type="button"
                      onClick={handleAddPOItem}
                      className="w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs cursor-pointer transition shadow-xs"
                    >
                      Add Row
                    </button>
                  </div>
                </div>
              </div>

              {/* Current drafted PO list */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold block mb-1">
                  Drafted Purchase rows ({poItems.length} lines)
                </span>

                {poItems.length === 0 ? (
                  <p className="text-center py-6 text-slate-400 italic">No items drafted. Use block above to create lines.</p>
                ) : (
                  <div className="border border-slate-200 divide-y divide-slate-100 rounded overflow-hidden max-h-44 overflow-y-auto">
                    {poItems.map((item, index) => {
                      const prodRef = products.find(p => p.id === item.productId);
                      return (
                        <div key={index} className="p-2.5 bg-slate-50 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-semibold text-slate-800 line-clamp-1">{prodRef ? prodRef.name : 'Unknown Product'}</span>
                            <span className="text-[9px] text-slate-400">Qty: {item.quantity} • Unit Cost: Rs. {item.costPrice.toFixed(2)}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-900">Rs. {(item.quantity * item.costPrice).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => setPoItems(poItems.filter((_, i) => i !== index))}
                              className="text-stone-400 hover:text-rose-600 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatePOModal(false);
                    setPoItems([]);
                  }}
                  className="flex-1 text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 text-center py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs cursor-pointer shadow-xs"
                >
                  Confirm PO Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide Modal 2: Pay supplier cash balance */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded p-5 w-full max-w-sm shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
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

            <h4 className="font-bold text-slate-800 text-sm mb-1 font-sans">Settle Supplier Balance</h4>
            <p className="text-xs text-slate-500 mb-3 block">Post bulk payment to <b>{showPayModal.name}</b></p>

            <form onSubmit={handleProcessPayment} className="space-y-4 text-xs select-none">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Amount Sent (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g., 500.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded p-2 text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                  required
                />
                <span className="text-[10px] text-slate-450 block italic">Pending liability balance: Rs. {showPayModal.balance.toFixed(2)}</span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Audit Remittance Reference (Check/Wire Ref)</label>
                <input
                  type="text"
                  placeholder="e.g., Bank Wire reference check #5532"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs cursor-pointer shadow-xs"
                >
                  Post Pay Ledger Row
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide Modal 3: Register manufacturing factory */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded p-5 w-full max-w-sm shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setShowAddSupplierModal(false);
                setNewSuppName('');
                setNewSuppContact('');
                setNewSuppPhone('');
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="font-bold text-slate-800 text-sm mb-1 font-sans">Register Manufacturing Factory</h4>
            <p className="text-xs text-slate-500 mb-3 block">Provide details of the new factory/distributor.</p>

            <form onSubmit={handleRegisterSupplier} className="space-y-4 text-xs select-none">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Factory Name</label>
                <input
                  type="text"
                  placeholder="e.g., Nizami Hardware store"
                  value={newSuppName}
                  onChange={(e) => setNewSuppName(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g., Muhammad Ali (Sales)"
                  value={newSuppContact}
                  onChange={(e) => setNewSuppContact(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Phone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="e.g., +92 300 1234567"
                  value={newSuppPhone}
                  onChange={(e) => setNewSuppPhone(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSupplierModal(false);
                    setNewSuppName('');
                    setNewSuppContact('');
                    setNewSuppPhone('');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs cursor-pointer shadow-xs"
                >
                  Add Supplier Factory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide Modal 4: Confirm PO Cargo Receive (Increment Stock) */}
      {pendingReceivePO && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-md shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setPendingReceivePO(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="font-bold text-slate-900 text-sm mb-1 font-sans text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5" />
              Confirm Delivery Check-In
            </h4>
            <p className="text-xs text-slate-500 mb-4 block">
              Are you sure you want to finalize the checkout for Purchase Order <b>{pendingReceivePO.id}</b>?
            </p>

            <div className="bg-slate-50 rounded p-3 mb-4 space-y-2 text-xs">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Incoming Cargo Details:</div>
              <div className="space-y-1 select-none font-mono">
                {pendingReceivePO.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span>{item.productName}</span>
                    <span className="text-slate-900 font-bold">+{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                <span>Total Bal Liability Increment:</span>
                <span className="font-mono text-emerald-600">Rs. {pendingReceivePO.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[11px] text-amber-600 mb-4">
              * This will immediately ADD the quantities to catalog stock inventory and update Supplier balance due.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingReceivePO(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onReceivePOArticles(pendingReceivePO);
                  setPendingReceivePO(null);
                }}
                className="px-4 py-1.5 bg-emerald-605 hover:bg-emerald-700 text-white font-bold rounded text-xs cursor-pointer shadow-xs bg-emerald-600"
              >
                Incorporate Cargo (Increment Stock)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Process PO Cash Installer payment */}
      {showPOPaymentModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setShowPOPaymentModal(null);
                setPoPaymentAmt('');
                setPoPaymentNote('');
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="font-bold text-slate-900 text-sm mb-1">Record PO Partial Cash Payment</h4>
            <p className="text-xs text-slate-500 mb-4 block">Record cash installment for Purchase Order <b>{showPOPaymentModal.id}</b></p>

            <form onSubmit={handleProcessPOPayment} className="space-y-4 text-xs select-none">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Installment cash amount (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={showPOPaymentModal.totalAmount - (showPOPaymentModal.paidAmount || 0)}
                  placeholder="e.g., 50000"
                  value={poPaymentAmt}
                  onChange={(e) => setPoPaymentAmt(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded p-2 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
                <span className="text-[10px] text-slate-400 italic block">
                  Remaining liability limit: Rs. {(showPOPaymentModal.totalAmount - (showPOPaymentModal.paidAmount || 0)).toFixed(2)}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment receipt memo / details</label>
                <input
                  type="text"
                  placeholder="e.g., Bank deposit receipt 39 or cash pay"
                  value={poPaymentNote}
                  onChange={(e) => setPoPaymentNote(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPOPaymentModal(null);
                    setPoPaymentAmt('');
                    setPoPaymentNote('');
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-600 rounded text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs cursor-pointer shadow-xs"
                >
                  Confirm Cash Installment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Plan PO Installments Schedule */}
      {showPOScheduleModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setShowPOScheduleModal(null);
                setPoSchedAmount('');
                setPoSchedDate('');
                setPoSchedNote('');
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="font-bold text-slate-900 text-sm mb-1">Schedule PO Instalment Plan</h4>
            <p className="text-xs text-slate-500 mb-4 block">Set a scheduled payment installment due date on PO <b>{showPOScheduleModal.id}</b></p>

            <form onSubmit={handleCreatePOSchedule} className="space-y-4 text-xs select-none">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Due Installment Amount (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g., 40000"
                  value={poSchedAmount}
                  onChange={(e) => setPoSchedAmount(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded p-2 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-505 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Due Date</label>
                <input
                  type="date"
                  value={poSchedDate}
                  onChange={(e) => setPoSchedDate(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded p-2 text-xs focus:ring-2 focus:ring-indigo-505 outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Installment Memo / Check Number</label>
                <input
                  type="text"
                  placeholder="e.g., Post-dated check installment"
                  value={poSchedNote}
                  onChange={(e) => setPoSchedNote(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded p-2 text-xs focus:ring-2 focus:ring-indigo-505 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPOScheduleModal(null);
                    setPoSchedAmount('');
                    setPoSchedDate('');
                    setPoSchedNote('');
                  }}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs cursor-pointer shadow-xs"
                >
                  Plan Installment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
