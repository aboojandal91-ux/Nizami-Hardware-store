import { Product, Customer, Supplier, PurchaseOrder, SaleRecord } from '../types';

export const HARDWARE_CATEGORIES = [
  'Plumbing',
  'Fasteners & Screws',
  'Tools & Equipment',
  'Building Materials',
  'Electrical & Lighting',
  'Paints & Adhesives'
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: '789012345601',
    name: 'Heavy Duty Steel Adjustable Wrench 12"',
    category: 'Tools & Equipment',
    unit: 'pc',
    retailPrice: 24.99,
    wholesalePrice: 19.50,
    costPrice: 12.00,
    stock: 14,
    threshold: 5,
    location: 'Aisle 3, Shelf B'
  },
  {
    id: 'prod-2',
    code: '789012345602',
    name: 'Galvanized Drywall Screws 2" (3kg Box)',
    category: 'Fasteners & Screws',
    unit: 'box',
    retailPrice: 18.50,
    wholesalePrice: 14.80,
    costPrice: 9.00,
    stock: 22,
    threshold: 8,
    location: 'Aisle 1, Shelf D'
  },
  {
    id: 'prod-3',
    code: '789012345603',
    name: 'Copper Plumbing Pipe 1/2" Type M',
    category: 'Plumbing',
    unit: 'ft',
    retailPrice: 3.20,
    wholesalePrice: 2.40,
    costPrice: 1.50,
    stock: 120,
    threshold: 40,
    location: 'Rack A, Row 1'
  },
  {
    id: 'prod-4',
    code: '789012345604',
    name: 'Premium Portland Cement Type I (50kg)',
    category: 'Building Materials',
    unit: 'box', // Sell as bag/box
    retailPrice: 12.00,
    wholesalePrice: 9.50,
    costPrice: 6.80,
    stock: 4, // Trigger stock alert
    threshold: 15,
    location: 'Warehouse Back Area'
  },
  {
    id: 'prod-5',
    code: '789012345605',
    name: 'Steel Common Wire Nails 3"',
    category: 'Fasteners & Screws',
    unit: 'kg',
    retailPrice: 4.50,
    wholesalePrice: 3.60,
    costPrice: 2.10,
    stock: 45,
    threshold: 15,
    location: 'Aisle 1, bin 12'
  },
  {
    id: 'prod-6',
    code: '789012345606',
    name: 'Brass Ball Valve 3/4" Threaded',
    category: 'Plumbing',
    unit: 'pc',
    retailPrice: 14.25,
    wholesalePrice: 11.00,
    costPrice: 7.20,
    stock: 8,
    threshold: 10, // Stock alert triggered (8 < 10)
    location: 'Aisle 2, Row A'
  },
  {
    id: 'prod-7',
    code: '789012345607',
    name: '12/2 NM-B Wire Speed Cable (100 ft Roll)',
    category: 'Electrical & Lighting',
    unit: 'box',
    retailPrice: 78.00,
    wholesalePrice: 64.00,
    costPrice: 42.00,
    stock: 6,
    threshold: 3,
    location: 'Aisle 4, Shelf C'
  },
  {
    id: 'prod-8',
    code: '789012345608',
    name: 'High Heat PVC Solvent Cement (Yellow Can)',
    category: 'Paints & Adhesives',
    unit: 'pc',
    retailPrice: 6.75,
    wholesalePrice: 5.20,
    costPrice: 3.10,
    stock: 19,
    threshold: 6,
    location: 'Aisle 2, Shelf F'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Muhammad Ali (Al-Fatah Plumbing)',
    phone: '555-0182',
    isContractor: true,
    balance: 450.00, // owes us money
    ledger: [
      {
        id: 'cl-1',
        date: '2026-05-10T09:00:00Z',
        type: 'purchase',
        amount: 600.00,
        description: 'Bulk Plumbing Order (Copper pipes, brass valves)',
        balanceAfter: 600.00
      },
      {
        id: 'cl-2',
        date: '2026-05-15T14:30:00Z',
        type: 'payment',
        amount: 150.00,
        description: 'Partial payment on outstanding invoice #1042',
        balanceAfter: 450.00
      }
    ]
  },
  {
    id: 'cust-2',
    name: 'Aisha Fatima (Al-Madinah Builders)',
    phone: '555-9281',
    isContractor: true,
    balance: 180.50,
    ledger: [
      {
        id: 'cl-3',
        date: '2026-05-12T11:20:00Z',
        type: 'purchase',
        amount: 180.50,
        description: 'Assorted drywall screws (10x boxes) and joint compound',
        balanceAfter: 180.50
      }
    ]
  },
  {
    id: 'cust-3',
    name: 'Bilal Ibrahim (Ibrahim Contractors)',
    phone: '555-3342',
    isContractor: false,
    balance: 0.00,
    ledger: []
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'supp-1',
    name: 'Al-Farooq Steel & Pipe Supply',
    phone: '1-800-555-0321',
    contactPerson: 'Tariq Bin Ziyad',
    balance: 1200.00, // We owe them money
    ledger: [
      {
        id: 'sl-1',
        date: '2026-04-20T10:00:00Z',
        type: 'purchase_order',
        amount: 2200.00,
        description: 'Delivered Order #PO-104 (Copper valves and flanges)',
        balanceAfter: 2200.00
      },
      {
        id: 'sl-2',
        date: '2026-05-01T16:00:00Z',
        type: 'payment',
        amount: 1000.00,
        description: 'Wire Transfer ref #883210',
        balanceAfter: 1200.00
      }
    ]
  },
  {
    id: 'supp-2',
    name: 'An-Noor Fastener Works',
    phone: '555-882-9900',
    contactPerson: 'Abdur Rahman',
    balance: 0.00,
    ledger: []
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-101',
    supplierId: 'supp-1',
    supplierName: 'Al-Farooq Steel & Pipe Supply',
    date: '2026-05-18T10:00:00Z',
    items: [
      {
        productId: 'prod-3',
        productName: 'Copper Plumbing Pipe 1/2" Type M',
        quantity: 100,
        costPrice: 1.50
      },
      {
        productId: 'prod-6',
        productName: 'Brass Ball Valve 3/4" Threaded',
        quantity: 20,
        costPrice: 7.20
      }
    ],
    totalAmount: 294.00,
    status: 'received'
  },
  {
    id: 'PO-102',
    supplierId: 'supp-2',
    supplierName: 'An-Noor Fastener Works',
    date: '2026-05-24T14:15:00Z',
    items: [
      {
        productId: 'prod-2',
        productName: 'Galvanized Drywall Screws 2" (3kg Box)',
        quantity: 15,
        costPrice: 9.00
      },
      {
        productId: 'prod-5',
        productName: 'Steel Common Wire Nails 3"',
        quantity: 30,
        costPrice: 2.10
      }
    ],
    totalAmount: 198.00,
    status: 'ordered'
  }
];

export const INITIAL_SALES: SaleRecord[] = [
  {
    id: 'sale-1',
    date: '2026-05-25T10:30:00Z',
    items: [
      {
        productId: 'prod-1',
        name: 'Heavy Duty Steel Adjustable Wrench 12"',
        quantity: 2,
        costPrice: 12.00,
        sellingPrice: 24.99,
        unit: 'pc'
      },
      {
        productId: 'prod-5',
        name: 'Steel Common Wire Nails 3"',
        quantity: 5,
        costPrice: 2.10,
        sellingPrice: 4.50,
        unit: 'kg'
      }
    ],
    totalAmount: 72.48,
    totalCost: 34.50,
    profit: 37.98,
    customerId: null,
    customerName: 'Walk-in Customer',
    paymentMethod: 'cash'
  },
  {
    id: 'sale-2',
    date: '2026-05-25T14:20:00Z',
    items: [
      {
        productId: 'prod-3',
        name: 'Copper Plumbing Pipe 1/2" Type M',
        quantity: 30,
        costPrice: 1.50,
        sellingPrice: 2.40, // Contractor wholesale rate
        unit: 'ft'
      },
      {
        productId: 'prod-6',
        name: 'Brass Ball Valve 3/4" Threaded',
        quantity: 4,
        costPrice: 7.20,
        sellingPrice: 11.00, // wholesale
        unit: 'pc'
      }
    ],
    totalAmount: 116.00,
    totalCost: 73.80,
    profit: 42.20,
    customerId: 'cust-1',
    customerName: 'Muhammad Ali (Al-Fatah Plumbing)',
    paymentMethod: 'khata'
  },
  {
    id: 'sale-3',
    date: '2026-05-24T09:15:00Z',
    items: [
      {
        productId: 'prod-4',
        name: 'Premium Portland Cement Type I (50kg)',
        quantity: 10,
        costPrice: 6.80,
        sellingPrice: 12.00,
        unit: 'box'
      }
    ],
    totalAmount: 120.00,
    totalCost: 68.00,
    profit: 52.00,
    customerId: null,
    customerName: 'Walk-in Customer',
    paymentMethod: 'card'
  }
];

export const INITIAL_EXPENSES = [
  {
    id: 'exp-1',
    type: 'shop',
    description: 'Monthly electricity bill for Aboo\'s Software Management System',
    amount: 150.00,
    date: '2026-05-25T11:00:00Z'
  },
  {
    id: 'exp-2',
    type: 'transport',
    description: 'Delivery truck fuel and carrier cost for cement restock',
    amount: 85.00,
    date: '2026-05-26T14:30:00Z'
  },
  {
    id: 'exp-3',
    type: 'shop',
    description: 'Lunch for warehouse workers & helpers',
    amount: 32.50,
    date: '2026-05-27T13:10:00Z'
  },
  {
    id: 'exp-4',
    type: 'transport',
    description: 'Loading / Unloading logistics cost for PVC pipes shipment',
    amount: 60.00,
    date: '2026-05-27T16:00:00Z'
  }
];

