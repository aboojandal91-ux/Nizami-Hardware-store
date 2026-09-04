import React, { useState, useEffect } from 'react';
import { 
  Product, 
  Customer, 
  Supplier, 
  PurchaseOrder, 
  SaleRecord, 
  CartItem, 
  SavedCart,
  LedgerEntry,
  SupplierLedgerEntry,
  Expense,
  UserAccount,
  AuditLog,
  StoreSettings
} from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_SUPPLIERS, 
  INITIAL_PURCHASE_ORDERS, 
  INITIAL_SALES,
  INITIAL_EXPENSES
} from './data/mockData';

// Tabs
import DashboardTab from './components/DashboardTab';
import InventoryTab from './components/InventoryTab';
import POSTab from './components/POSTab';
import KhataTab from './components/KhataTab';
import SupplierTab from './components/SupplierTab';
import ReportsTab from './components/ReportsTab';
import StaffTab from './components/StaffTab';
import PrintSheetPage from './components/PrintSheetPage';
import BackupManagerModal from './components/BackupManagerModal';
import { AbooLogo } from './components/AbooLogo';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { ElectronDesktopBar } from './components/ElectronDesktopBar';

// Icons
import LoginScreen from './components/LoginScreen';
import { translations, Language } from './translations';
import { 
  LogOut,
  Globe,
  LayoutDashboard, 
  Boxes, 
  Receipt, 
  NotebookPen, 
  Warehouse, 
  LineChart, 
  Bell, 
  HardHat,
  AlertTriangle,
  HeartHandshake,
  ShieldAlert,
  KeyRound
} from 'lucide-react';

export default function App() {
  // Check if we are in printable mode
  const isPrintRoute = typeof window !== 'undefined' && window.location.search.includes('print=true');

  if (isPrintRoute) {
    return <PrintSheetPage />;
  }

  // Auth state
  const [currentUser, setCurrentUser] = useState<{username: string; role: 'admin' | 'cashier'} | null>(() => {
    const saved = localStorage.getItem('hw_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Language state
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('hw_language');
    return (saved === 'ur' || saved === 'en') ? saved as Language : 'en';
  });

  // Store General Profile Settings (Dynamic company details)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('hw_store_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.storeName?.includes('Hardware') || parsed.storeName?.includes('Nizami')) {
          parsed.storeName = "Aboo's Software Management System";
          parsed.storePhone = '03321666300';
          parsed.storeEmail = 'aboojandal91@gmail.com';
          parsed.storeAddress = 'Duki, Balochistan, Pakistan';
        }
        return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return {
      storeName: "Aboo's Software Management System",
      storePhone: '03321666300',
      storeEmail: 'aboojandal91@gmail.com',
      storeAddress: 'Duki, Balochistan, Pakistan'
    };
  });

  // Sync Auth, Language & Store Settings to client Storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('hw_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('hw_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('hw_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('hw_store_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  const handleUpdateStoreSettings = (newSettings: StoreSettings) => {
    setStoreSettings(newSettings);
    logActivity('system', `Updated business profile properties. Store: "${newSettings.storeName}".`);
    alert(language === 'ur' ? 'ماشاءاللہ! دکان کی معلومات کامیابی سے محفوظ کر دی گئی ہیں۔' : 'Physical store settings committed successfully!');
  };

  const t = translations[language];

  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showOverdueDetails, setShowOverdueDetails] = useState(false);

  // Relational Storage States
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('hw_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('hw_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('hw_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('hw_purchase_orders');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem('hw_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('hw_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('hw_users');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'u-1', username: 'admin', fullname: 'Umar Farooq (Manager)', pin: 'forge123', role: 'admin', createdAt: '2026-05-28T00:00:00Z' },
      { id: 'u-2', username: 'staff', fullname: 'Hamza Yusuf (Cashier)', pin: 'staff123', role: 'cashier', createdAt: '2026-05-28T00:00:00Z' }
    ];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('hw_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // POS Temporary Cart states
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [heldCarts, setHeldCarts] = useState<SavedCart[]>([]);
  const [priceTier, setPriceTier] = useState<'retail' | 'wholesale'>('retail');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [prefilledPOProductId, setPrefilledPOProductId] = useState<string | null>(null);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Initial Auto-Backup Prompt
  useEffect(() => {
    const isElectron = !!(window as any).require;
    if (isElectron && !localStorage.getItem('hw_auto_backup_path') && !localStorage.getItem('hw_backup_prompted')) {
      setShowBackupManager(true);
      localStorage.setItem('hw_backup_prompted', 'true');
    }
  }, []);

  // Synced side-effects to LocalStorage
  useEffect(() => {
    localStorage.setItem('hw_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('hw_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('hw_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('hw_purchase_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('hw_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('hw_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('hw_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('hw_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Local Electron automatic backup sync
  useEffect(() => {
    const isElectron = !!(window as any).require;
    const primaryPath = localStorage.getItem('hw_auto_backup_path');
    const secondaryPath = localStorage.getItem('hw_secondary_backup_path');

    if (isElectron && primaryPath) {
      try {
        const fs = (window as any).require('fs');
        const pathModule = (window as any).require('path');
        const backupData = {
          appSign: "aboo-hardware-pos-ledger",
          timestamp: new Date().toISOString(),
          storeSettings, products, customers, suppliers, purchaseOrders, sales, expenses, users, auditLogs
        };
        const stringified = JSON.stringify(backupData, null, 2);
        
        const customFileName = `ABOOHP_AUTO_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.json`;
        
        if (!fs.existsSync(primaryPath)) {
          fs.mkdirSync(primaryPath, { recursive: true });
        }
        
        const fullPath = pathModule.join(primaryPath, customFileName);
        fs.writeFileSync(fullPath, stringified, 'utf8');

        if (secondaryPath) {
            if (!fs.existsSync(secondaryPath)) fs.mkdirSync(secondaryPath, { recursive: true });
            const secPath = pathModule.join(secondaryPath, customFileName);
            fs.writeFileSync(secPath, stringified, 'utf8');
        }
      } catch (err) {
        console.error("Auto Backup Error:", err);
      }
    }
  }, [products, customers, suppliers, purchaseOrders, sales, expenses, users, auditLogs, storeSettings]);

  // Log Activity Helper
  const logActivity = (actionType: AuditLog['actionType'], details: string) => {
    if (!currentUser) return;
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      username: currentUser.username,
      role: currentUser.role || 'cashier',
      actionType,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleAddUser = (uname: string, fname: string, pinCode: string) => {
    const newUser: UserAccount = {
      id: 'u-' + Date.now(),
      username: uname,
      fullname: fname,
      pin: pinCode,
      role: 'cashier',
      createdAt: new Date().toISOString()
    };
    setUsers([...users, newUser]);
    logActivity('add_product', `Manager registered new staff cashier account: @${uname} (${fname})`);
  };

  const handleDeleteUser = (id: string) => {
    const target = users.find(u => u.id === id);
    if (target) {
      setUsers(users.filter(u => u.id !== id));
      logActivity('delete_product', `Manager deleted staff cashier account: @${target.username} (${target.fullname})`);
    }
  };

  const handleUpdateUserPin = (userId: string, newPin: string, newFullname?: string) => {
    setUsers(prevUsers => {
      const updated = prevUsers.map(u => {
        if (u.id === userId || u.username === userId) {
          return {
            ...u,
            pin: newPin,
            fullname: newFullname || u.fullname
          };
        }
        return u;
      });
      localStorage.setItem('hw_users', JSON.stringify(updated));
      return updated;
    });
    const target = users.find(u => u.id === userId || u.username === userId);
    logActivity('add_product', `Updated security password/PIN for user account @${target?.username || userId}`);
  };

  // Global Actions - Expenses
  const handleAddExpense = (newExpense: Omit<Expense, 'id' | 'date'>) => {
    const expense: Expense = {
      ...newExpense,
      id: 'exp-' + Date.now(),
      date: new Date().toISOString()
    };
    setExpenses([...expenses, expense]);
    logActivity('add_expense', `Added operational expense: "${newExpense.description}" of Rs. ${newExpense.amount.toFixed(2)} (${newExpense.type})`);
  };

  const handleDeleteExpense = (id: string) => {
    const target = expenses.find(e => e.id === id);
    setExpenses(expenses.filter(e => e.id !== id));
    if (target) {
      logActivity('delete_expense', `Deleted operational expense: "${target.description}" of Rs. ${target.amount.toFixed(2)} (${target.type})`);
    }
  };

  const handleUpdateExpense = (id: string, updatedFields: Partial<Omit<Expense, 'id' | 'date'>>) => {
    setExpenses(prev => prev.map(exp => {
      if (exp.id === id) {
        const after = { ...exp, ...updatedFields };
        logActivity('add_expense', `Edited operational expense "${exp.description}" (Old: Rs. ${exp.amount.toFixed(2)}) to "${after.description}" (New: Rs. ${after.amount.toFixed(2)})`);
        return after;
      }
      return exp;
    }));
  };

  // Systems Integration - Secure JSON Backup & Restore Flow
  const handleExportBackup = () => {
    try {
      const backupData = {
        appSign: "aboo-hardware-pos-ledger",
        timestamp: new Date().toISOString(),
        storeSettings,
        products,
        customers,
        suppliers,
        purchaseOrders,
        sales,
        expenses,
        users,
        auditLogs
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Aboos_SMS_DataBackup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logActivity('system', 'Exported comprehensive database backup file.');
      alert(language === 'ur' ? 'شاباش! ڈیٹا بیک اپ کامیابی سے ڈاؤن لوڈ کر لیا گیا ہے۔' : 'System backup file generated and downloaded successfully!');
    } catch (e) {
      alert('Backup failed: ' + (e as Error).message);
    }
  };

  const handleImportBackup = (fileContent: string) => {
    try {
      const parsedData = JSON.parse(fileContent);
      const validSigns = ["aboo-software-management-system", "aboo-hardware-pos-ledger", "nizami-hardware-pos-ledger"];
      if (!parsedData || !validSigns.includes(parsedData.appSign)) {
        throw new Error(language === 'ur' ? 'غلط فائل فارمیٹ! برائے مہربانی صرف ابو سافٹ ویئر مینجمنٹ سسٹم کی بیک اپ فائل منتخب کریں۔' : 'Invalid file format! Please select a valid backup data file exported from Aboo\'s Software Management System.');
      }

      const confirmMsg = language === 'ur'
        ? 'کیا آپ واقعی اس بیک اپ فائل کو بحال (Restore) کرنا چاہتے ہیں؟ موجودہ تمام ڈیٹا اس سے تبدیل ہو جائے گا!'
        : 'Are you sure you want to restore the entire database from this backup? Your current session data will be fully overwritten!';

      if (!window.confirm(confirmMsg)) {
        return;
      }

      // Safe State Restorations
      if (parsedData.storeSettings) setStoreSettings(parsedData.storeSettings);
      if (Array.isArray(parsedData.products)) setProducts(parsedData.products);
      if (Array.isArray(parsedData.customers)) setCustomers(parsedData.customers);
      if (Array.isArray(parsedData.suppliers)) setSuppliers(parsedData.suppliers);
      if (Array.isArray(parsedData.purchaseOrders)) setPurchaseOrders(parsedData.purchaseOrders);
      if (Array.isArray(parsedData.sales)) setSales(parsedData.sales);
      if (Array.isArray(parsedData.expenses)) setExpenses(parsedData.expenses);
      if (Array.isArray(parsedData.users)) setUsers(parsedData.users);
      if (Array.isArray(parsedData.auditLogs)) {
        setAuditLogs(parsedData.auditLogs);
      } else {
        setAuditLogs([]);
      }

      // Post-restore activity logging
      const restLog: AuditLog = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString(),
        username: currentUser?.username || 'system',
        role: currentUser?.role || 'admin',
        actionType: 'system',
        details: `Restored local database backup file compiled on: ${parsedData.timestamp}`
      };
      setAuditLogs(prev => [restLog, ...(Array.isArray(parsedData.auditLogs) ? parsedData.auditLogs : [])]);

      alert(language === 'ur' ? 'ماشاءاللہ! تمام ڈیٹا کامیابی سے بحال کر دیا گیا ہے۔' : 'Excellent! All databases have been successfully restored and synchronized.');
    } catch (e) {
      alert((language === 'ur' ? 'ریسٹور سسٹم ایرر: ' : 'Restore system error: ') + (e as Error).message);
    }
  };

  const handleRestoreFromPath = (filePath: string) => {
    try {
      const fs = (window as any).require('fs');
      const content = fs.readFileSync(filePath, 'utf8');
      handleImportBackup(content);
    } catch (e: any) {
      alert("Error reading backup file: " + e.message);
    }
  };

  // Global Actions - Products
  const handleAddProduct = (newProduct: Omit<Product, 'id'>) => {
    const id = 'prod-' + Date.now();
    setProducts(prevProducts => [...prevProducts, { ...newProduct, id }]);
    logActivity('add_product', `Added product specs for: "${newProduct.name}" [SKU: ${newProduct.code}, Category: ${newProduct.category}] with stock ${newProduct.stock}`);
  };

  const handleBulkAddProducts = (newProducts: Omit<Product, 'id'>[]) => {
    const timestamp = Date.now();
    const createdProducts: Product[] = newProducts.map((p, index) => ({
      ...p,
      id: `prod-${timestamp}-${index}`
    }));
    setProducts(prevProducts => [...prevProducts, ...createdProducts]);
    logActivity('add_product', `Bulk imported ${newProducts.length} products to stock inventory catalog via Excel.`);
  };

  const handleUpdateProduct = (updated: Product) => {
    const old = products.find(p => p.id === updated.id);
    setProducts(products.map(p => p.id === updated.id ? updated : p));
    if (old) {
      logActivity('edit_product', `Updated product details for "${updated.name}" [SKU: ${updated.code}] - Price: Rs. ${updated.retailPrice}/Rs. ${updated.wholesalePrice}, Stock: ${updated.stock} (was ${old.stock})`);
    }
  };

  const handleDeleteProduct = (id: string) => {
    const target = products.find(p => p.id === id);
    setProducts(products.filter(p => p.id !== id));
    if (target) {
      logActivity('delete_product', `Deleted product from catalog: "${target.name}" [SKU: ${target.code}]`);
    }
  };

  // Global Actions - Customers (Khata Credit Ledger)
  const handleAddCustomer = (newCustomer: Omit<Customer, 'id' | 'balance' | 'ledger'>) => {
    const id = 'cust-' + Date.now();
    setCustomers([...customers, { ...newCustomer, id, balance: 0.0, ledger: [] }]);
    logActivity('add_customer', `Registered new credit contractor customer: "${newCustomer.name}" (Phone: ${newCustomer.phone})`);
  };

  const handleReceiveKhataPayment = (customerId: string, amount: number, note: string) => {
    const target = customers.find(c => c.id === customerId);
    setCustomers(customers.map(cust => {
      if (cust.id === customerId) {
        const revisedBalance = cust.balance - amount;
        const entry: LedgerEntry = {
          id: 'cl-pay-' + Date.now(),
          date: new Date().toISOString(),
          type: 'payment',
          amount,
          description: note,
          balanceAfter: revisedBalance
        };
        return {
          ...cust,
          balance: revisedBalance,
          ledger: [...cust.ledger, entry]
        };
      }
      return cust;
    }));
    if (target) {
      logActivity('khata_payment', `Received Khata outstanding payment of Rs. ${amount.toFixed(2)} from "${target.name}" - Note: "${note}"`);
    }
  };

  // Global Actions - Suppliers
  const handleAddSupplier = (newSupplier: Omit<Supplier, 'id' | 'balance' | 'ledger'>) => {
    const id = 'supp-' + Date.now();
    setCustomers([...customers]); // placeholder dummy
    setSuppliers([...suppliers, { ...newSupplier, id, balance: 0.0, ledger: [] }]);
    logActivity('add_supplier', `Registered new partner supplier: "${newSupplier.name}" (Phone: ${newSupplier.phone})`);
  };

  const handlePaySupplier = (supplierId: string, amount: number, memo: string) => {
    const target = suppliers.find(s => s.id === supplierId);
    setSuppliers(suppliers.map(supp => {
      if (supp.id === supplierId) {
        const revisedBalance = supp.balance - amount;
        const entry: SupplierLedgerEntry = {
          id: 'sl-pay-' + Date.now(),
          date: new Date().toISOString(),
          type: 'payment',
          amount,
          description: memo,
          balanceAfter: revisedBalance
        };
        return {
          ...supp,
          balance: revisedBalance,
          ledger: [...supp.ledger, entry]
        };
      }
      return supp;
    }));
    if (target) {
      logActivity('pay_supplier', `Disbursed supplier payment of Rs. ${amount.toFixed(2)} to "${target.name}" - Memo: "${memo}"`);
    }
  };

  // Global Actions - Purchase Orders
  const handleCreatePurchaseOrder = (newPO: Omit<PurchaseOrder, 'id' | 'supplierName'>) => {
    const count = purchaseOrders.length + 101;
    const id = `PO-${count}`;
    const correspondingSupplier = suppliers.find(s => s.id === newPO.supplierId);
    const supplierName = correspondingSupplier ? correspondingSupplier.name : 'Unknown Factory';

    setPurchaseOrders([...purchaseOrders, { ...newPO, id, supplierName }]);
    logActivity('create_po', `Created purchase order draft ${id} for "${supplierName}" - total amount Rs. ${newPO.totalAmount.toFixed(2)}`);
  };

  const handleUpdatePOStatus = (poId: string, status: 'draft' | 'ordered' | 'received') => {
    setPurchaseOrders(purchaseOrders.map(po => po.id === poId ? { ...po, status } : po));
    logActivity('update_po_status', `Updated purchase order ${poId} status to "${status}"`);
  };

  // Heavy replenishment action (mark PO received increment stock & record suppliers credit liability dues)
  const handleReceivePurchaseOrderArticles = (receivedPO: PurchaseOrder) => {
    // 1. Sync stock levels inside product catalog
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const orderedItem = receivedPO.items.find(item => item.productId === prod.id);
        if (orderedItem) {
          return {
            ...prod,
            stock: prod.stock + orderedItem.quantity
          };
        }
        return prod;
      });
    });

    // 2. Log purchase order liabilities onto supplier ledger balance
    setSuppliers(prevSuppliers => {
      return prevSuppliers.map(supp => {
        if (supp.id === receivedPO.supplierId) {
          const finalBal = supp.balance + receivedPO.totalAmount;
          const entry: SupplierLedgerEntry = {
            id: 'sl-recv-' + Date.now(),
            date: new Date().toISOString(),
            type: 'purchase_order',
            amount: receivedPO.totalAmount,
            description: `Received parts delivery check-in for Order ${receivedPO.id}`,
            balanceAfter: finalBal
          };
          return {
            ...supp,
            balance: finalBal,
            ledger: [...supp.ledger, entry]
          };
        }
        return supp;
      });
    });

    // 3. Mark the Outgoing PO status as Received
    setPurchaseOrders(prevPOs => {
      return prevPOs.map(po => po.id === receivedPO.id ? { ...po, status: 'received' as const } : po);
    });

    logActivity('receive_po', `Received Purchase Order delivery and checked in items for PO ${receivedPO.id} on behalf of "${receivedPO.supplierName}" - total liabilities increased by Rs. ${receivedPO.totalAmount.toFixed(2)}`);
  };

  // Global Actions - POS Checkout Terminal transaction settle
  const handleExecutePOSCheckout = (
    billedItems: CartItem[], 
    customerId: string | null, 
    paymentMethod: 'cash' | 'card' | 'khata',
    tier: 'retail' | 'wholesale'
  ) => {
    // 1. Decrement products inventory quantities
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const cartItem = billedItems.find(item => item.product.id === prod.id);
        if (cartItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - cartItem.quantity)
          };
        }
        return prod;
      });
    });

    // 2. Calculations
    const totalAmount = billedItems.reduce((acc, row) => acc + (row.sellingPrice * row.quantity), 0);
    const totalCost = billedItems.reduce((acc, row) => acc + (row.product.costPrice * row.quantity), 0);
    const profit = totalAmount - totalCost;

    const selectedCustomer = customers.find(c => c.id === customerId);
    const customerName = selectedCustomer ? selectedCustomer.name : 'Walk-in Customer';

    // 3. Store high-level historical Sales record
    const saleId = 'sale-' + Math.floor(100000 + Math.random() * 900000).toString();
    const newRecord: SaleRecord = {
      id: saleId,
      date: new Date().toISOString(),
      items: billedItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        costPrice: item.product.costPrice,
        sellingPrice: item.sellingPrice,
        unit: item.product.unit
      })),
      totalAmount,
      totalCost,
      profit,
      customerId,
      customerName,
      paymentMethod
    };

    setSales(prevSales => [...prevSales, newRecord]);

    // 4. If paymentMethod is "khata" (debit purchase on credit balance record), post transaction entry
    if (paymentMethod === 'khata' && customerId) {
      setCustomers(prevCustomers => {
        return prevCustomers.map(cust => {
          if (cust.id === customerId) {
            const finalCreditBal = cust.balance + totalAmount;
            const entry: LedgerEntry = {
              id: 'cl-deb-' + Date.now(),
              date: new Date().toISOString(),
              type: 'purchase',
              amount: totalAmount,
              description: `POS purchase list (Sale ID ${saleId})`,
              balanceAfter: finalCreditBal
            };
            return {
              ...cust,
              balance: finalCreditBal,
              ledger: [...cust.ledger, entry]
            };
          }
          return cust;
        });
      });
    }

    logActivity('pos_checkout', `Settled POS Checkout ${saleId} of Rs. ${totalAmount.toFixed(2)} using ${paymentMethod.toUpperCase()} (customer: ${customerName}) with ${billedItems.length} items`);
  };

  // Link barcode scans from outside directly to POS Shopping bags
  const handleSimulateScanInPOS = (scannedBarcode: string) => {
    const product = products.find(p => p.code === scannedBarcode);
    if (!product) return;

    // Direct add onto active cart
    const existingIndex = posCart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...posCart];
      updated[existingIndex].quantity += 1;
      setPosCart(updated);
    } else {
      setPosCart([...posCart, {
        product,
        quantity: 1,
        sellingPrice: priceTier === 'wholesale' ? product.wholesalePrice : product.retailPrice
      }]);
    }
  };

  // Quick PO from low stock alerts drawer
  const handleQuickRestockPO = (lowProduct: Product) => {
    // Open PO Draft with that item prefilled
    setPrefilledPOProductId(lowProduct.id);
    setActiveTab('suppliers');
  };

  // Return / Refund system
  const handleReturnPOSItem = (saleId: string, productId: string, qtyToReturn: number) => {
    const saleIndex = sales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) return;
    const sale = sales[saleIndex];
    
    const saleItemIndex = sale.items.findIndex(it => it.productId === productId);
    if (saleItemIndex === -1) return;
    const item = sale.items[saleItemIndex];
    
    if (qtyToReturn <= 0 || qtyToReturn > item.quantity) {
      alert(language === 'ur' ? 'غلط مقدار درج کی گئی ہے!' : 'Invalid quantity to return!');
      return;
    }

    const refundAmt = item.sellingPrice * qtyToReturn;
    const refundCost = item.costPrice * qtyToReturn;

    // 1. Update product stock
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, stock: p.stock + qtyToReturn };
      }
      return p;
    }));

    // 2. Adjust Sale Record items and totals
    const updatedSales = [...sales];
    const targetSale = { ...updatedSales[saleIndex] };
    
    targetSale.items = targetSale.items.map(it => {
      if (it.productId === productId) {
        return { ...it, quantity: it.quantity - qtyToReturn };
      }
      return it;
    }).filter(it => it.quantity > 0);

    targetSale.totalAmount = Math.max(0, targetSale.totalAmount - refundAmt);
    targetSale.totalCost = Math.max(0, targetSale.totalCost - refundCost);
    targetSale.profit = Math.max(0, targetSale.totalAmount - targetSale.totalCost);

    updatedSales[saleIndex] = targetSale;
    setSales(updatedSales);

    // 3. For Khata, update customer balance
    if (sale.paymentMethod === 'khata' && sale.customerId) {
      setCustomers(prev => prev.map(cust => {
        if (cust.id === sale.customerId) {
          const finalCreditBal = Math.max(0, cust.balance - refundAmt);
          const entry = {
            id: 'cl-ret-' + Date.now(),
            date: new Date().toISOString(),
            type: 'payment' as const,
            amount: refundAmt,
            description: `Returned ${qtyToReturn}x ${item.name} from Invoice ${saleId}`,
            balanceAfter: finalCreditBal
          };
          return {
            ...cust,
            balance: finalCreditBal,
            ledger: [...cust.ledger, entry]
          };
        }
        return cust;
      }));
    }

    logActivity('system', `Processed POS Return: Received back ${qtyToReturn}x "${item.name}" from Sale ${saleId}. Rs. ${refundAmt.toFixed(2)} adjusted.`);
    alert(language === 'ur'
      ? 'آئٹم کامیابی سے واپس کر دیا گیا ہے اور اسٹاک درست کر دیا گیا ہے۔'
      : `Item returned successfully! Rs. ${refundAmt.toFixed(2)} refunded/credited.`
    );
  };

  // Exchange system
  const handleExchangePOSItem = (
    saleId: string, 
    returnProductId: string, 
    qtyToReturn: number, 
    addProductId: string, 
    qtyToAdd: number
  ) => {
    const saleIndex = sales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) return;
    const sale = sales[saleIndex];
    
    const returnItem = sale.items.find(it => it.productId === returnProductId);
    if (!returnItem) return;

    if (qtyToReturn <= 0 || qtyToReturn > returnItem.quantity) {
      alert(language === 'ur' ? 'غلط مقدار درج کی گئی ہے!' : 'Invalid physical quantity to return!');
      return;
    }

    const replacementProduct = products.find(p => p.id === addProductId);
    if (!replacementProduct) {
      alert(language === 'ur' ? 'پروڈکٹ انوینٹری میں نہیں ملی!' : 'Replacement product not found in stock!');
      return;
    }

    if (replacementProduct.stock < qtyToAdd) {
      alert(language === 'ur' ? 'متبادل پروڈکٹ کا اسٹاک کافی نہیں ہے!' : 'Insufficient stock for exchange replacement!');
      return;
    }

    const returnCredit = returnItem.sellingPrice * qtyToReturn;
    const returnCostCredit = returnItem.costPrice * qtyToReturn;

    const addPrice = sale.paymentMethod === 'khata' && sale.customerId && customers.find(c => c.id === sale.customerId)?.isContractor
      ? replacementProduct.wholesalePrice 
      : replacementProduct.retailPrice;
    const addCost = replacementProduct.costPrice;

    const chargeDiff = (addPrice * qtyToAdd) - returnCredit;
    const costDiff = (addCost * qtyToAdd) - returnCostCredit;

    // 1. Update stock
    setProducts(prev => prev.map(p => {
      if (p.id === returnProductId && p.id === addProductId) {
        return { ...p, stock: p.stock + qtyToReturn - qtyToAdd };
      } else if (p.id === returnProductId) {
        return { ...p, stock: p.stock + qtyToReturn };
      } else if (p.id === addProductId) {
        return { ...p, stock: p.stock - qtyToAdd };
      }
      return p;
    }));

    // 2. Adjust Sale Record
    const updatedSales = [...sales];
    const targetSale = { ...updatedSales[saleIndex] };

    // Update returned item qty
    targetSale.items = targetSale.items.map(it => {
      if (it.productId === returnProductId) {
        return { ...it, quantity: it.quantity - qtyToReturn };
      }
      return it;
    }).filter(it => it.quantity > 0);

    // Add replacement item
    const existingReplacementIdx = targetSale.items.findIndex(it => it.productId === addProductId);
    if (existingReplacementIdx > -1) {
      targetSale.items[existingReplacementIdx].quantity += qtyToAdd;
    } else {
      targetSale.items.push({
        productId: replacementProduct.id,
        name: replacementProduct.name,
        quantity: qtyToAdd,
        costPrice: replacementProduct.costPrice,
        sellingPrice: addPrice,
        unit: replacementProduct.unit
      });
    }

    targetSale.totalAmount = Math.max(0, targetSale.totalAmount + chargeDiff);
    targetSale.totalCost = Math.max(0, targetSale.totalCost + costDiff);
    targetSale.profit = Math.max(0, targetSale.totalAmount - targetSale.totalCost);

    updatedSales[saleIndex] = targetSale;
    setSales(updatedSales);

    // 3. For Khata, update customer balance
    if (sale.paymentMethod === 'khata' && sale.customerId) {
      setCustomers(prev => prev.map(cust => {
        if (cust.id === sale.customerId) {
          const finalCreditBal = Math.max(0, cust.balance + chargeDiff);
          const entry = {
            id: 'cl-exch-' + Date.now(),
            date: new Date().toISOString(),
            type: chargeDiff >= 0 ? ('purchase' as const) : ('payment' as const),
            amount: Math.abs(chargeDiff),
            description: `Exchanged ${qtyToReturn}x ${returnItem.name} for ${qtyToAdd}x ${replacementProduct.name} (Invoice ${saleId})`,
            balanceAfter: finalCreditBal
          };
          return {
            ...cust,
            balance: finalCreditBal,
            ledger: [...cust.ledger, entry]
          };
        }
        return cust;
      }));
    }

    logActivity('system', `Processed Swap Exchange: Swapped ${qtyToReturn}x ${returnItem.name} with ${qtyToAdd}x ${replacementProduct.name} in Sale ${saleId}. Diff: Rs. ${chargeDiff.toFixed(2)}`);
    alert(language === 'ur'
      ? 'تبادلہ کامیابی سے مکمل ہو گیا ہے اور اسٹاک درست کر دیا گیا ہے۔'
      : `Exchange executed successfully! Rs. ${chargeDiff.toFixed(2)} difference adjusted.`
    );
  };

  // Customer Payment Schedule Update
  const handleUpdateCustomerSchedule = (customerId: string, scheduleList: any[]) => {
    setCustomers(prev => prev.map(cust => {
      if (cust.id === customerId) {
        return {
          ...cust,
          paymentSchedule: scheduleList
        };
      }
      return cust;
    }));
  };

  // Supplier PO Partial Payment Pay Hook
  const handlePayTowardsPO = (poId: string, paymentAmount: number, note: string) => {
    const poIndex = purchaseOrders.findIndex(p => p.id === poId);
    if (poIndex === -1) return;
    const po = purchaseOrders[poIndex];

    const currentPaid = po.paidAmount || 0;
    const nextPaid = currentPaid + paymentAmount;
    if (nextPaid > po.totalAmount) {
      alert(language === 'ur' ? 'ادائیگی کل آرڈر کی رقم سے بڑھ گئی ہے!' : 'Payment exceeds total purchase order value!');
      return;
    }

    // 1. Update PO paidAmount
    const updatedPOs = [...purchaseOrders];
    updatedPOs[poIndex] = {
      ...po,
      paidAmount: nextPaid
    };
    setPurchaseOrders(updatedPOs);

    // 2. Reduce supplier outstanding payable
    setSuppliers(prev => prev.map(supp => {
      if (supp.id === po.supplierId) {
        const revisedBalance = Math.max(0, supp.balance - paymentAmount);
        const entry = {
          id: 'spl-pay-' + Date.now(),
          date: new Date().toISOString(),
          type: 'payment' as const,
          amount: paymentAmount,
          description: `Partial payment on PO ${poId}: ${note}`,
          balanceAfter: revisedBalance
        };
        return {
          ...supp,
          balance: revisedBalance,
          ledger: [...supp.ledger, entry]
        };
      }
      return supp;
    }));

    logActivity('pay_supplier', `Disbursed partial installment of Rs. ${paymentAmount.toFixed(2)} towards PO ${poId} - Details: ${note}`);
    alert(language === 'ur'
      ? 'ادائیگی کامیابی سے تسلیم کی گئی اور سپلائر لیجر میں شامل کی گئی ہے۔'
      : `Partial payment of Rs. ${paymentAmount.toFixed(2)} posted towards PO ${poId} successfully.`
    );
  };

  // Supplier PO Payment Schedule Update
  const handleUpdatePOSchedule = (poId: string, scheduleList: any[]) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        return {
          ...po,
          paymentSchedule: scheduleList
        };
      }
      return po;
    }));
  };

  // Stockout notifications length helper
  const redAlertStockCounts = products.filter(p => p.stock <= p.threshold).length;

  // Overdue payment schedules calculation (due on or before today and still pending)
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueKhataSchedules = customers.flatMap(cust => {
    return (cust.paymentSchedule || [])
      .filter(s => s.status === 'pending' && s.dueDate <= todayStr)
      .map(s => ({
        ...s,
        customerId: cust.id,
        customerName: cust.name
      }));
  });

  const overduePOSchedules = purchaseOrders.flatMap(po => {
    return (po.paymentSchedule || [])
      .filter(s => s.status === 'pending' && s.dueDate <= todayStr)
      .map(s => ({
        ...s,
        poId: po.id,
        supplierName: po.supplierName
      }));
  });

  const totalOverdueCount = overdueKhataSchedules.length + overduePOSchedules.length;

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <ElectronDesktopBar onOpenBackupManager={() => setShowBackupManager(true)} lang={language} />
        <div className="flex-1 flex flex-col">
          <LoginScreen 
            onLoginSuccess={(name, role) => setCurrentUser({ username: name, role })}
            lang={language}
            onLanguageChange={(l) => setLanguage(l)}
            users={users}
            onUpdateUserPin={handleUpdateUserPin}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir={language === 'ur' ? 'rtl' : 'ltr'}>
      {/* Electron Desktop Native Window Bar */}
      <ElectronDesktopBar onOpenBackupManager={() => setShowBackupManager(true)} lang={language} />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Dynamic Nav Sidebar Column */}
        <aside className="w-full md:w-60 bg-slate-900 text-white flex flex-col z-20 shrink-0 border-r border-slate-800">
        
        {/* Brand logo header - Aboo's Software Management System */}
        <div className="p-4 flex items-center gap-3 border-b border-slate-800 bg-slate-900/80">
          <AbooLogo size="md" />
          <div className="overflow-hidden">
            <h2 className="text-xs font-bold leading-tight uppercase tracking-wider text-white truncate">
              {t.appName}
            </h2>
            <p className="text-[10px] text-cyan-400 font-sans tracking-wide font-medium truncate">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Tab Links divided into elegant sections */}
        <nav className="flex-1 py-4 px-3 space-y-2 select-none overflow-y-auto">
          {/* Dash */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-slate-800 text-white shadow-sm shadow-indigo-900/40 border border-slate-700/60' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
            }`}
          >
            <div className={`p-2 rounded-lg transition-all duration-200 shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xs'
                : 'bg-slate-800/45 text-slate-450 group-hover:text-slate-200'
            }`}>
              <LayoutDashboard className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col items-start leading-none gap-0.5 text-left">
              <span className="text-[11px] font-extrabold tracking-tight">{t.dashboard}</span>
              <span className="text-[8px] text-slate-500 font-sans tracking-tight">Main Hub</span>
            </div>
          </button>

          {/* POS Terminal */}
          <button
            onClick={() => setActiveTab('pos')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'pos' 
                ? 'bg-slate-800 text-white shadow-sm shadow-emerald-900/40 border border-slate-700/60' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
            }`}
          >
            <div className={`p-2 rounded-lg transition-all duration-200 shrink-0 relative ${
              activeTab === 'pos'
                ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-xs'
                : 'bg-slate-800/45 text-slate-450 group-hover:text-slate-200'
            }`}>
              <Receipt className="w-4.5 h-4.5" />
              {posCart.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              )}
            </div>
            <div className="flex flex-col items-start leading-none gap-0.5 text-left">
              <span className="text-[11px] font-extrabold tracking-tight">{t.pos}</span>
              <span className="text-[8px] text-slate-500 font-sans tracking-tight">
                {posCart.length > 0 ? `${posCart.length} items in draft` : 'Cash desk'}
              </span>
            </div>
            {posCart.length > 0 && (
              <span className="ml-auto bg-amber-500 text-slate-950 font-mono text-[9px] px-1.5 py-0.5 rounded-md font-black">
                {posCart.length}
              </span>
            )}
          </button>

          {/* Advanced Stock Inventory */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'inventory' 
                ? 'bg-slate-800 text-white shadow-sm shadow-amber-900/40 border border-slate-700/60' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
            }`}
          >
            <div className={`p-2 rounded-lg transition-all duration-200 shrink-0 ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xs'
                : 'bg-slate-800/45 text-slate-450 group-hover:text-slate-200'
            }`}>
              <Boxes className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col items-start leading-none gap-0.5 text-left">
              <span className="text-[11px] font-extrabold tracking-tight">{t.inventory}</span>
              <span className="text-[8px] text-slate-500 font-sans tracking-tight">Stock Levels</span>
            </div>
            {redAlertStockCounts > 0 && (
              <span className="ml-auto bg-rose-650 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-md font-black">
                {redAlertStockCounts}
              </span>
            )}
          </button>

          {/* Accounts Credit Khata */}
          <button
            onClick={() => setActiveTab('khata')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'khata' 
                ? 'bg-slate-800 text-white shadow-sm shadow-orange-900/40 border border-slate-700/60' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
            }`}
          >
            <div className={`p-2 rounded-lg transition-all duration-200 shrink-0 ${
              activeTab === 'khata'
                ? 'bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-xs'
                : 'bg-slate-800/45 text-slate-450 group-hover:text-slate-200'
            }`}>
              <NotebookPen className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col items-start leading-none gap-0.5 text-left">
              <span className="text-[11px] font-extrabold tracking-tight">{t.khata}</span>
              <span className="text-[8px] text-slate-500 font-sans tracking-tight">Credit Book</span>
            </div>
          </button>

          {/* Supplier PO cargo */}
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'suppliers' 
                ? 'bg-slate-800 text-white shadow-sm shadow-violet-900/40 border border-slate-700/60' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
            }`}
          >
            <div className={`p-2 rounded-lg transition-all duration-200 shrink-0 ${
              activeTab === 'suppliers'
                ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-xs'
                : 'bg-slate-800/45 text-slate-450 group-hover:text-slate-200'
            }`}>
              <Warehouse className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col items-start leading-none gap-0.5 text-left">
              <span className="text-[11px] font-extrabold tracking-tight">{t.suppliers}</span>
              <span className="text-[8px] text-slate-500 font-sans tracking-tight">Cargo & PO</span>
            </div>
          </button>

          {/* Reports Profit Audit */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'reports' 
                ? 'bg-slate-800 text-white shadow-sm shadow-cyan-900/40 border border-slate-700/60' 
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <div className={`p-2 rounded-lg transition-all duration-200 shrink-0 ${
              activeTab === 'reports'
                ? 'bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-xs'
                : 'bg-slate-800/45 text-slate-450 group-hover:text-slate-200'
            }`}>
              <LineChart className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col items-start leading-none gap-0.5 text-left">
              <span className="text-[11px] font-extrabold tracking-tight">{t.reports}</span>
              <span className="text-[8px] text-slate-500 font-sans tracking-tight">Profits & Swaps</span>
            </div>
          </button>

          {/* Staff Manager and Activity logs (Admin Manager only) */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === 'staff' 
                  ? 'bg-slate-800 text-white shadow-sm shadow-rose-900/40 border border-slate-700/60' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <div className={`p-2 rounded-lg transition-all duration-200 shrink-0 ${
                activeTab === 'staff'
                  ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xs'
                  : 'bg-slate-800/45 text-slate-450 group-hover:text-slate-200'
              }`}>
                <ShieldAlert className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col items-start leading-none gap-0.5 text-left">
                <span className="text-[11px] font-extrabold tracking-tight">{t.staffLogs}</span>
                <span className="text-[8px] text-slate-500 font-sans tracking-tight">Security Logs</span>
              </div>
            </button>
          )}
        </nav>

        {/* User Session Info Card */}
        <div className="p-3 mx-3 mb-2 bg-slate-950 border border-slate-850 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center font-bold text-xs ring-1 ring-blue-500/20 shrink-0">
              {currentUser.username[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-100 truncate leading-none">{currentUser.username}</p>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1 py-0.2 rounded inline-block uppercase mt-1">
                {currentUser.role === 'admin' ? t.adminRole : t.cashierRole}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-800">
            {/* Lang Shift */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
              className="px-1 py-1 text-[9px] flex items-center justify-center gap-1.5 bg-slate-900 text-slate-300 hover:bg-slate-805 hover:text-white rounded border border-slate-800 cursor-pointer transition select-none"
            >
              <Globe className="w-3 h-3 text-blue-400" />
              <span>{language === 'en' ? 'اردو' : 'EN'}</span>
            </button>
            {/* Logout */}
            <button
              onClick={() => {
                setCurrentUser(null);
                localStorage.removeItem('hw_current_user');
              }}
              className="px-1 py-1 text-[9px] flex items-center justify-center gap-1.5 bg-red-950/40 text-red-400 hover:bg-red-900/40 hover:text-white rounded border border-red-900/30 cursor-pointer transition select-none"
            >
              <LogOut className="w-3 h-3 text-red-400" />
              <span>{language === 'en' ? 'Logout' : 'خروج'}</span>
            </button>
          </div>

          {/* Change Password Button */}
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="w-full mt-2 py-1 px-2 text-[9px] flex items-center justify-center gap-1.5 bg-blue-950/40 text-cyan-300 hover:bg-blue-900/50 hover:text-white rounded border border-blue-900/30 cursor-pointer transition select-none font-semibold"
            title={language === 'ur' ? 'ایڈمن / کیشئیر پاس ورڈ تبدیل کریں' : 'Change Password / PIN'}
          >
            <KeyRound className="w-3 h-3 text-cyan-400" />
            <span>{language === 'ur' ? 'پاس ورڈ تبدیل کریں' : 'Change Password / PIN'}</span>
          </button>
        </div>

        {/* Dynamic Low Stock alerts panel at the footer of sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="bg-red-950/40 border border-red-900/40 p-3 rounded-lg">
            <p className="text-[10px] text-red-400 font-bold mb-1 tracking-wider uppercase">{t.lowStockAlerts} ({redAlertStockCounts})</p>
            {products.filter(p => p.stock <= p.threshold).slice(0, 2).map(p => (
              <p className="text-[10px] text-red-200/90 truncate" key={p.id}>
                - {p.name}
              </p>
            ))}
            {redAlertStockCounts > 2 && (
              <p className="text-[9px] text-slate-450 mt-1 italic">+{redAlertStockCounts - 2} {t.itemsCritical}</p>
            )}
            {redAlertStockCounts === 0 && (
              <p className="text-[10px] text-emerald-400">{t.allStockOptimal}</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Panel Viewport */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header bar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 relative z-10 shadow-3xs">
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-slate-100 uppercase tracking-widest text-slate-500 font-bold px-2.5 py-1 rounded">
              {t.activeLabel}
            </span>
            <span className="text-xs font-bold text-slate-800 capitalize">
              {activeTab === 'khata' 
                ? (language === 'ur' ? 'اکاؤنٹس لیجر (ادھار کھاتہ بک)' : 'Accounts Ledger (Khata Book)')
                : activeTab === 'dashboard' ? (language === 'ur' ? 'کنٹرول ہب' : 'Control Hub')
                : activeTab === 'pos' ? (language === 'ur' ? 'کیش ڈیسک پی او ایس' : 'POS Cash Desk')
                : activeTab === 'inventory' ? (language === 'ur' ? 'اسٹاک انوینٹری گودام' : 'Stock Inventory')
                : activeTab === 'suppliers' ? (language === 'ur' ? 'سپلائر آرڈرز اور کارگو' : 'Supplier Cargo')
                : activeTab === 'staff' ? (language === 'ur' ? 'کیشئیرز اور سیکیورٹی لاگز' : 'Cashiers & Security Logs')
                : (language === 'ur' ? 'منافع اور آڈٹ رپورٹ' : 'Markup Profit Audits')
              } {t.workspace}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Stock Notification flag summary */}
            {redAlertStockCounts > 0 && (
              <div className="flex items-center gap-1.5 p-1.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-amber-800 text-[10px] font-semibold transition">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{redAlertStockCounts} {t.lowStockLevels}</span>
              </div>
            )}

            {/* General Date Indicator */}
            <span className="text-xs font-mono font-medium text-slate-400 hidden sm:block">
              {t.timeLabel}: {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </header>

        {/* OVERDUE ALERTS EXPANDABLE BANNER SECTION */}
        {totalOverdueCount > 0 && (
          <div className="bg-rose-50 border-b border-rose-200 animate-in slide-in-from-top duration-300">
            <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping shrink-0" />
                <span className="text-xs font-black text-rose-950 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    {language === 'ur'
                      ? `واجب الادا الرٹ: ${totalOverdueCount} ادائیگیوں کی آخری تاریخ گزر چکی ہے!`
                      : `Overdue Alert: ${totalOverdueCount} payment schedules have exceeded their deadlines!`
                    }
                  </span>
                </span>
                
                <div className="flex gap-1.5 text-[10px] select-none font-bold">
                  {overdueKhataSchedules.length > 0 && (
                    <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded leading-none border border-rose-200">
                      {language === 'ur' ? `کھاتہ دار: ${overdueKhataSchedules.length}` : `Khata Books: ${overdueKhataSchedules.length}`}
                    </span>
                  )}
                  {overduePOSchedules.length > 0 && (
                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded leading-none border border-orange-200">
                      {language === 'ur' ? `سپلائر آرڈرز: ${overduePOSchedules.length}` : `Suppliers/POs: ${overduePOSchedules.length}`}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOverdueDetails(!showOverdueDetails)}
                  className="text-[10px] font-black uppercase text-rose-700 hover:text-rose-950 bg-rose-100/50 hover:bg-rose-100 border border-rose-250 px-2.5 py-1 rounded transition select-none cursor-pointer"
                >
                  {showOverdueDetails 
                    ? (language === 'ur' ? 'تفصیلات چھپائیں ▲' : 'Hide Details ▲') 
                    : (language === 'ur' ? 'واجب الادا تفصیلات دیکھیں ▼' : 'View Overdue Details ▼')
                  }
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (overdueKhataSchedules.length > 0) {
                      setActiveTab('khata');
                    } else {
                      setActiveTab('suppliers');
                    }
                  }}
                  className="text-[10px] font-black uppercase text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition select-none shadow-3xs cursor-pointer"
                >
                  {language === 'ur' ? 'ابھی حل کریں' : 'Resolve Settle'}
                </button>
              </div>
            </div>

            {/* EXPANDED DETAIL VIEW GRID */}
            {showOverdueDetails && (
              <div className="bg-rose-100/30 border-t border-rose-200 px-6 py-4 max-h-[300px] overflow-y-auto max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Column 1: Khata Accounts Overdue */}
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-extrabold text-rose-900 uppercase tracking-widest border-b border-rose-200 pb-1">
                      {language === 'ur' ? 'کھاتہ لیجر واجب الادا تفصیل' : 'Pending Khata Customers Overdue'}
                    </h5>
                    
                    {overdueKhataSchedules.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">No overdue client installment plans.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {overdueKhataSchedules.map(sched => (
                          <div key={sched.id} className="p-2.5 bg-white border border-rose-105 rounded-lg shadow-3xs flex justify-between items-center text-xs animate-in fade-in duration-200">
                            <div>
                              <div className="font-bold text-slate-900">{sched.customerName}</div>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {sched.note || 'Overdue partial payment plan'}
                              </p>
                              <span className="text-[9px] font-mono text-red-600 bg-red-50 px-1.5 py-0.2 rounded font-bold">
                                {language === 'ur' ? `آخری تاریخ: ${sched.dueDate}` : `Due: ${new Date(sched.dueDate).toLocaleDateString()}`}
                              </span>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="font-extrabold text-rose-700 font-mono block">Rs. {sched.amount.toFixed(0)}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomerId(sched.customerId);
                                  setActiveTab('khata');
                                }}
                                className="text-[9px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded cursor-pointer"
                              >
                                {language === 'ur' ? 'کھاتہ کھولیں' : 'Open Khata'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Column 2: Supplier Orders Overdue */}
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-extrabold text-amber-900 uppercase tracking-widest border-b border-rose-200 pb-1">
                      {language === 'ur' ? 'سپلائرز واجب الادا اقساط' : 'Pending Supplier PO Overdue'}
                    </h5>

                    {overduePOSchedules.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">No overdue supplier installments.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {overduePOSchedules.map(sched => (
                          <div key={sched.id} className="p-2.5 bg-white border border-amber-105 rounded-lg shadow-3xs flex justify-between items-center text-xs animate-in fade-in duration-200">
                            <div>
                              <div className="font-bold text-slate-900">{sched.supplierName}</div>
                              <p className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
                                PO: {sched.poId} • {sched.note || 'Purchase Installment'}
                              </p>
                              <span className="text-[9px] font-mono text-orange-600 bg-orange-50 px-1.5 py-0.2 rounded font-bold">
                                {language === 'ur' ? `آخری تاریخ: ${sched.dueDate}` : `Due: ${new Date(sched.dueDate).toLocaleDateString()}`}
                              </span>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="font-extrabold text-amber-700 font-mono block font-mono">Rs. {sched.amount.toFixed(0)}</span>
                              <button
                                type="button"
                                onClick={() => setActiveTab('suppliers')}
                                className="text-[9px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded cursor-pointer"
                              >
                                {language === 'ur' ? 'سپلائر کھولیں' : 'Open Cargo'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scrollable content register container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardTab
              products={products}
              customers={customers}
              sales={sales}
              purchaseOrders={purchaseOrders}
              lang={language}
              onNavigate={(tab) => {
                setActiveTab(tab);
                if (tab === 'pos') {
                  // highlight scanning simulator options
                }
              }}
              onQuickRestock={handleQuickRestockPO}
              onBackup={() => setShowBackupManager(true)}
              onRestore={handleImportBackup}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              products={products}
              onAddProduct={handleAddProduct}
              onBulkAddProducts={handleBulkAddProducts}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onSimulateScanInPOS={handleSimulateScanInPOS}
            />
          )}

          {activeTab === 'pos' && (
            <POSTab
              products={products}
              customers={customers}
              activeCart={posCart}
              setActiveCart={setPosCart}
              heldCarts={heldCarts}
              setHeldCarts={setHeldCarts}
              priceTier={priceTier}
              setPriceTier={setPriceTier}
              selectedCustomerId={selectedCustomerId}
              setSelectedCustomerId={setSelectedCustomerId}
              onCheckout={handleExecutePOSCheckout}
              lang={language}
              storeSettings={storeSettings}
              sales={sales}
              onReturnItem={handleReturnPOSItem}
              onExchangeItem={handleExchangePOSItem}
            />
          )}

          {activeTab === 'khata' && (
            <KhataTab
              customers={customers}
              onAddCustomer={handleAddCustomer}
              onReceivePayment={handleReceiveKhataPayment}
              onUpdateSchedule={handleUpdateCustomerSchedule}
              lang={language}
              initialCustomerId={selectedCustomerId}
            />
          )}

          {activeTab === 'suppliers' && (
            <SupplierTab
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              products={products}
              onAddSupplier={handleAddSupplier}
              onPaySupplier={handlePaySupplier}
              onCreatePO={handleCreatePurchaseOrder}
              onUpdatePOStatus={handleUpdatePOStatus}
              onReceivePOArticles={handleReceivePurchaseOrderArticles}
              prefilledProductId={prefilledPOProductId}
              clearPrefilledProductId={() => setPrefilledPOProductId(null)}
              onPayTowardsPO={handlePayTowardsPO}
              onUpdatePOSchedule={handleUpdatePOSchedule}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              sales={sales}
              products={products}
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onEditExpense={handleUpdateExpense}
              lang={language}
              storeSettings={storeSettings}
              onReturnPOSItem={handleReturnPOSItem}
              onExchangePOSItem={handleExchangePOSItem}
              customers={customers}
            />
          )}

          {activeTab === 'staff' && currentUser?.role === 'admin' && (
            <StaffTab
              users={users}
              auditLogs={auditLogs}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              onUpdateUserPin={handleUpdateUserPin}
              lang={language}
            />
          )}
        </div>

        {/* Developer Attribution Footer */}
        <footer className="px-6 py-3 border-t border-slate-200 bg-slate-50 mt-auto shrink-0 shadow-[0_-2px_10px_-4px_rgba(0,0,0,0.05)] relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5"><span className="text-slate-400">Developer:</span> AbooJandal</span>
            <span className="hidden md:block text-slate-300">•</span>
            <span className="flex items-center gap-1.5"><span className="text-slate-400">Contact:</span> 03321666300</span>
            <span className="hidden md:block text-slate-300">•</span>
            <span className="flex items-center gap-1.5"><span className="text-slate-400">Address:</span> Duki, Balochistan, Pakistan</span>
          </div>
        </footer>
      </main>

      </div>

      <BackupManagerModal
        isOpen={showBackupManager}
        onClose={() => setShowBackupManager(false)}
        lang={language}
        storeSettings={storeSettings}
        products={products}
        customers={customers}
        suppliers={suppliers}
        purchaseOrders={purchaseOrders}
        sales={sales}
        expenses={expenses}
        users={users}
        auditLogs={auditLogs}
        onRestoreFromPath={handleRestoreFromPath}
      />

      {showChangePasswordModal && currentUser && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          currentUser={currentUser}
          users={users}
          onUpdateUserPin={handleUpdateUserPin}
          lang={language}
        />
      )}
    </div>
  );
}
