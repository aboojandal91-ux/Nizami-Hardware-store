export type UnitType = 'pc' | 'kg' | 'ft' | 'box';

export interface Product {
  id: string;
  code: string; // SKU or Barcode
  name: string;
  category: string;
  unit: UnitType;
  retailPrice: number;
  wholesalePrice: number;
  costPrice: number; // Cost of Goods Sold (COGS)
  stock: number;
  threshold: number; // Low stock alert mark
  location: string; // E.g., "Aisle A, Shelf 2"
}

export interface CartItem {
  product: Product;
  quantity: number;
  sellingPrice: number; // Default to retail Price or wholesale Price or editable override
}

export interface SavedCart {
  id: string;
  name: string;
  items: CartItem[];
  priceTier: 'retail' | 'wholesale';
  customerId: string | null;
  heldAt: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'purchase' | 'payment'; // 'purchase' increases debt, 'payment' decreases debt
  amount: number;
  description: string;
  balanceAfter: number;
}

export interface PaymentSchedule {
  id: string;
  dueDate: string;
  amount: number;
  status: 'pending' | 'paid';
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  isContractor: boolean;
  balance: number; // Positive is credit owed to store
  ledger: LedgerEntry[];
  paymentSchedule?: PaymentSchedule[];
}

export interface SupplierLedgerEntry {
  id: string;
  date: string;
  type: 'purchase_order' | 'payment'; // 'purchase_order' increases our payable, 'payment' decreases it
  amount: number;
  description: string;
  balanceAfter: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  contactPerson: string;
  balance: number; // Positive is what we owe to the supplier
  ledger: SupplierLedgerEntry[];
}

export interface POItem {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: POItem[];
  totalAmount: number;
  status: 'draft' | 'ordered' | 'received';
  paidAmount?: number;
  paymentSchedule?: PaymentSchedule[];
}

export interface SaleRecord {
  id: string;
  date: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    costPrice: number;
    sellingPrice: number;
    unit: UnitType;
  }[];
  totalAmount: number;
  totalCost: number;
  profit: number;
  customerId: string | null;
  customerName: string; // e.g., "Walk-in Customer" or registered name
  paymentMethod: 'cash' | 'card' | 'khata';
}

export interface Expense {
  id: string;
  type: 'shop' | 'transport';
  description: string;
  amount: number;
  date: string;
}

export interface UserAccount {
  id: string;
  username: string;
  fullname: string;
  pin: string;
  role: 'admin' | 'cashier';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  role: 'admin' | 'cashier';
  actionType: 'add_product' | 'edit_product' | 'delete_product' | 'add_expense' | 'delete_expense' | 'add_customer' | 'khata_payment' | 'add_supplier' | 'pay_supplier' | 'create_po' | 'receive_po' | 'update_po_status' | 'pos_checkout' | 'system';
  details: string;
}

export interface StoreSettings {
  storeName: string;
  storePhone: string;
  storeEmail: string;
  storeAddress: string;
}



