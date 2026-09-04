import React, { useState } from 'react';
import { UserAccount, AuditLog } from '../types';
import { translations, Language } from '../translations';
import { 
  UserPlus, 
  Trash2, 
  Shield, 
  History, 
  KeyRound, 
  Calendar, 
  Search, 
  AlertTriangle,
  User,
  Activity,
  UserCheck
} from 'lucide-react';

interface StaffTabProps {
  users: UserAccount[];
  auditLogs: AuditLog[];
  onAddUser: (username: string, fullname: string, pin: string) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUserPin?: (userId: string, newPin: string, newFullname?: string) => void;
  lang: Language;
}

export default function StaffTab({ users, auditLogs, onAddUser, onDeleteUser, onUpdateUserPin, lang }: StaffTabProps) {
  const t = translations[lang];

  // Forms
  const [newUsername, setNewUsername] = useState('');
  const [newFullname, setNewFullname] = useState('');
  const [newPin, setNewPin] = useState('');

  // Edit password modal state
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editNewPin, setEditNewPin] = useState('');
  const [editNewFullname, setEditNewFullname] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState('all');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const uname = newUsername.trim().toLowerCase();
    const fname = newFullname.trim();
    const pinVal = newPin.trim();

    if (!uname || !fname || !pinVal) {
      alert(lang === 'ur' ? 'برائے مہربانی تمام خانے پُر کریں!' : 'Please fill all input fields!');
      return;
    }

    if (uname === 'admin') {
      alert(lang === 'ur' ? 'لفظ admin بطور کسٹمر/اسٹاف نام محفوظ نہیں ہو سکتا!' : 'Username "admin" is reserved!');
      return;
    }

    if (users.some(u => u.username === uname)) {
      alert(lang === 'ur' ? 'یہ صارف پہلے سے موجود ہے!' : 'This username already exists!');
      return;
    }

    onAddUser(uname, fname, pinVal);
    setNewUsername('');
    setNewFullname('');
    setNewPin('');
    alert(lang === 'ur' ? 'نیا کیشئیر کامیابی سے رجسٹر کر دیا گیا ہے!' : 'New cashier registered successfully!');
  };

  // Process and filter logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUser = selectedUserFilter === 'all' || log.username === selectedUserFilter;
    const matchesAction = selectedActionFilter === 'all' || log.actionType === selectedActionFilter;

    return matchesSearch && matchesUser && matchesAction;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {/* Tab Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            {t.staffLogs}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {lang === 'ur' 
              ? 'کیشئیر عملے کے اکاؤنٹس کا انتظام کریں اور دکان اور اسٹاک میں کی جانے والی تمام تبدیلیاں لائیو مانیٹر کریں۔' 
              : 'Add, remove, and manage Cashier profiles, and audit precise logs for all actions performed on inventory, cash desk sales, and expense books.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Register Staff Account & Active Cashiers Directory */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Register Cashier Form */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
              <UserPlus className="w-4 h-4 text-blue-600" />
              {t.addStaffBtn}
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Username field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {lang === 'ur' ? 'صارف نام (username - لاگ ان کیلئے)' : 'Username (Unique login word)'}
                </label>
                <div className="relative">
                  <span className={`absolute ${lang === 'ur' ? 'right-3' : 'left-3'} top-2.5 text-slate-400`}>
                    @
                  </span>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.replace(/\s+/g, ''))}
                    placeholder="e.g. zahid12"
                    className={`w-full ${lang === 'ur' ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>
              </div>

              {/* Full name field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {t.fullnameLabel}
                </label>
                <div className="relative">
                  <span className={`absolute ${lang === 'ur' ? 'right-3' : 'left-3'} top-2.5 text-slate-400`}>
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={newFullname}
                    onChange={(e) => setNewFullname(e.target.value)}
                    placeholder="e.g. Zahid Mahmood"
                    className={`w-full ${lang === 'ur' ? 'pr-8' : 'pl-8'} py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>
              </div>

              {/* Secret PIN field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {t.secretPinLabel}
                </label>
                <div className="relative">
                  <span className={`absolute ${lang === 'ur' ? 'right-3' : 'left-3'} top-2.5 text-slate-400`}>
                    <KeyRound className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="••••••"
                    className={`w-full ${lang === 'ur' ? 'pr-8' : 'pl-8'} py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer select-none"
              >
                {lang === 'ur' ? 'نیا اسٹاف اکاؤنٹ رجسٹر کریں' : 'Register Secure Profile'}
              </button>
            </form>
          </div>

          {/* Active Cashiers List */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              {t.cashierList}
            </h3>

            <div className="space-y-2.5">
              {users.map(u => (
                <div 
                  key={u.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/50 rounded-lg border border-slate-150 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs truncate">{u.fullname}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-405 font-mono select-none">
                      <span className="text-slate-500 font-semibold bg-slate-200/60 px-1 py-0.2 rounded">@{u.username}</span>
                      <span>•</span>
                      <span className="text-slate-400 font-medium">Role: {u.role === 'admin' ? 'Manager' : 'Cashier'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUser(u);
                        setEditNewPin('');
                        setEditNewFullname(u.fullname);
                      }}
                      title={lang === 'ur' ? 'پاس ورڈ تبدیل کریں' : 'Change Password / PIN'}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    {u.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(lang === 'ur' ? `کیا آپ واقعی اس صارف "${u.fullname}" کا اکاؤنٹ حذف کرنا چاہتے ہیں؟` : `Are you sure you want to delete staff account "${u.fullname}"?`)) {
                            onDeleteUser(u.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Corporate Real-time Audit logs */}
        <div className="lg:col-span-8 bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-500" />
                  {t.auditLogsTitle}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t.auditLogsDesc}
                </p>
              </div>

              <span className="bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 rounded font-mono">
                {filteredLogs.length} Records
              </span>
            </div>

            {/* Logs Filter Toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 select-none">
              {/* Search input to match comments */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'ur' ? 'تفصیل یا ریمارکس سرچ کریں...' : 'Search logs description...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 pl-8 pr-3 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* User filter */}
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="all">
                  {lang === 'ur' ? 'تمام ملازمین دکھائیں' : 'All Performers (Users)'}
                </option>
                {Array.from(new Set(auditLogs.map(l => l.username))).map(uname => (
                  <option key={uname} value={uname}>@{uname}</option>
                ))}
              </select>

              {/* Action filter */}
              <select
                value={selectedActionFilter}
                onChange={(e) => setSelectedActionFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-705 outline-none"
              >
                <option value="all">
                  {lang === 'ur' ? 'تمام سرگرمیاں دکھائیں' : 'All Action Types'}
                </option>
                <option value="add_product">Add Product</option>
                <option value="edit_product">Edit Product</option>
                <option value="delete_product">Delete Product</option>
                <option value="pos_checkout">POS Settle Bill</option>
                <option value="add_expense">Add Expense</option>
                <option value="delete_expense">Delete Expense</option>
                <option value="khata_payment">Khata Payment</option>
                <option value="pay_supplier">Supplier Paid</option>
                <option value="create_po">Purchase Order Draft</option>
              </select>
            </div>

            {/* Log list viewport */}
            <div className="overflow-y-auto max-h-[460px] pr-1 space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-24 text-slate-400 text-xs italic">
                  {lang === 'ur' ? 'کوئی سرگرمی لاگ ریکارڈ نہیں ملی۔' : 'No audit trail logs matched your criteria.'}
                </div>
              ) : (
                filteredLogs.map(log => {
                  // Determine icon design and color by action type
                  let typeColor = "bg-slate-100 text-slate-700 border-slate-200";
                  if (log.actionType.startsWith('add_')) {
                    typeColor = "bg-blue-50 text-blue-700 border-blue-100";
                  } else if (log.actionType.startsWith('edit_')) {
                    typeColor = "bg-indigo-50 text-indigo-700 border-indigo-100";
                  } else if (log.actionType.startsWith('delete_')) {
                    typeColor = "bg-rose-50 text-rose-700 border-rose-100";
                  } else if (log.actionType === 'pos_checkout' || log.actionType === 'khata_payment') {
                    typeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  } else if (log.actionType === 'pay_supplier') {
                    typeColor = "bg-amber-50 text-amber-700 border-amber-100";
                  }

                  return (
                    <div 
                      key={log.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/50 rounded-lg border border-slate-150 transition gap-4 flex flex-col sm:flex-row sm:items-center justify-between"
                    >
                      <div className="min-w-0 flex items-start gap-2.5">
                        {/* Status Role Icon Badge */}
                        <div className={`px-2 py-1 rounded text-[9px] font-bold border shrink-0 text-center font-mono ${typeColor}`}>
                          {log.actionType.replace('_', ' ').toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 text-xs leading-relaxed">
                            {log.details}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                            <span className="font-semibold text-slate-600">
                              @{log.username} ({log.role === 'admin' ? 'Manager' : 'Cashier'})
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-sans">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Micro notifier banner for cashiers */}
                      {log.role === 'cashier' && (
                        <div className="bg-amber-100/40 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1 shrink-0 self-start sm:self-center">
                          <AlertTriangle className="w-3 h-3 text-amber-600 animate-bounce" />
                          <span>Audited Cashier Action</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Quick Password & Profile Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 mb-1">
              <KeyRound className="w-4 h-4 text-blue-600" />
              {lang === 'ur' ? 'پاس ورڈ / پن تبدیل کریں' : 'Update Password / PIN'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              @{editingUser.username} ({editingUser.fullname})
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editNewPin.trim().length < 4) {
                  alert(lang === 'ur' ? 'پاس ورڈ کم از کم 4 ہندسوں پر مشتمل ہونا چاہیے!' : 'PIN must be at least 4 characters long!');
                  return;
                }
                if (onUpdateUserPin) {
                  onUpdateUserPin(editingUser.id, editNewPin.trim(), editNewFullname.trim() || editingUser.fullname);
                }
                alert(lang === 'ur' ? 'پاس ورڈ کامیابی سے تبدیل ہو گیا ہے!' : 'Password updated successfully!');
                setEditingUser(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  {t.fullnameLabel}
                </label>
                <input
                  type="text"
                  value={editNewFullname}
                  onChange={(e) => setEditNewFullname(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  {lang === 'ur' ? 'نیا پاس ورڈ / پن کوڈ' : 'New Security PIN / Password'}
                </label>
                <input
                  type="password"
                  value={editNewPin}
                  onChange={(e) => setEditNewPin(e.target.value)}
                  placeholder="Min 4 characters"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                >
                  {lang === 'ur' ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm cursor-pointer"
                >
                  {lang === 'ur' ? 'محفوظ کریں' : 'Save PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
