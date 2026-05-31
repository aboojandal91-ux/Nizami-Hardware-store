import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Product, UnitType } from '../types';
import { HARDWARE_CATEGORIES } from '../data/mockData';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MapPin, 
  Barcode, 
  Package, 
  Check, 
  AlertTriangle, 
  X,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface InventoryTabProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onBulkAddProducts?: (products: Omit<Product, 'id'>[]) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onSimulateScanInPOS?: (barcode: string) => void; // Link to fill POS cart
}

export default function InventoryTab({
  products,
  onAddProduct,
  onBulkAddProducts,
  onUpdateProduct,
  onDeleteProduct,
  onSimulateScanInPOS,
}: InventoryTabProps) {
  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'All' | 'Low' | 'Out'>('All');

  // Bulk upload states
  const [showBulkUploadModal, setShowBulkUploadModal] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [bulkImportList, setBulkImportList] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // Print states
  const [printMode, setPrintMode] = useState<'all' | 'single' | null>(null);
  const [printProduct, setPrintProduct] = useState<Product | null>(null);
  const [printCopies, setPrintCopies] = useState<number>(40);
  const [printType, setPrintType] = useState<'single' | 'all'>('single');
  const [printColumns, setPrintColumns] = useState<number>(4);
  const [copiesPerProduct, setCopiesPerProduct] = useState<number>(1);
  const [selectedPrintId, setSelectedPrintId] = useState<string>('');
  const [includeBranding, setIncludeBranding] = useState<boolean>(true);
  const [includePrice, setIncludePrice] = useState<boolean>(true);
  const [includeLocation, setIncludeLocation] = useState<boolean>(true);
  const [printScope, setPrintScope] = useState<'all' | 'custom' | 'category' | 'selected'>('all');
  const [printCategory, setPrintCategory] = useState<string>('All');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Form toggles
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Search Results
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;

    let matchesStock = true;
    if (selectedStockFilter === 'Low') {
      matchesStock = product.stock <= product.threshold && product.stock > 0;
    } else if (selectedStockFilter === 'Out') {
      matchesStock = product.stock === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Derived printable barcode entities
  const activeSingleProduct = products.find(p => p.id === selectedPrintId) || printProduct || products[0] || null;

  const printList: Product[] = [];
  if (printMode) {
    if (printType === 'single') {
      if (activeSingleProduct) {
        for (let i = 0; i < printCopies; i++) {
          printList.push(activeSingleProduct);
        }
      }
    } else {
      let targetProductsToPrint = products;
      if (printScope === 'selected') {
        targetProductsToPrint = products.filter(p => selectedProductIds.includes(p.id));
        if (targetProductsToPrint.length === 0) {
          targetProductsToPrint = [];
        }
      } else if (printScope === 'custom') {
        // Filter only products added by user (id starts with 'prod-')
        targetProductsToPrint = products.filter(p => p.id.startsWith('prod-'));
        // Fallback to all products if no custom products exist yet so the sheet is never empty by mistake
        if (targetProductsToPrint.length === 0) {
          targetProductsToPrint = products;
        }
      } else if (printScope === 'category') {
        if (printCategory !== 'All') {
          targetProductsToPrint = products.filter(p => p.category === printCategory);
        }
      }
      
      targetProductsToPrint.forEach(p => {
        for (let i = 0; i < copiesPerProduct; i++) {
          printList.push(p);
        }
      });
    }
  }

  // Synchronize barcodes to localStorage continuously to avoid async race conditions
  useEffect(() => {
    if (printMode && printList.length > 0) {
      try {
        localStorage.setItem('hw_pending_print', JSON.stringify({
          printList,
          includeBranding,
          includePrice,
          includeLocation,
          printColumns
        }));
      } catch (err) {
        console.error('Failed to sync barcode print configuration in effect', err);
      }
    }
  }, [printMode, printList, includeBranding, includePrice, includeLocation, printColumns]);

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    try {
      const headers = [
        "Product Name", 
        "SKU Code", 
        "Category", 
        "Unit", 
        "Cost Price", 
        "Retail Price", 
        "Wholesale Price", 
        "Stock", 
        "Threshold", 
        "Location"
      ];
      const sampleData = [
        ["Adjustable Wrench Heavy Duty 12\"", "SKU-9901", "Tools & Equipment", "pc", 450, 800, 720, 25, 5, "Aisle 3, Shelf A"],
        ["Galvanized Drywall Screws 2\" Box", "SKU-2055", "Fasteners & Screws", "box", 800, 1500, 1350, 10, 2, "Aisle 1, Shelf B"],
        ["PVC Elbow Bend 4 inch", "", "Plumbing", "pc", 120, 280, 240, 40, 8, "Aisle 2, Bin C"],
        ["Electrical Brass Switch Double", "SKU-4402", "Electrical & Lighting", "pc", 185, 320, 290, 60, 10, "Aisle 4, Box A"]
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
      
      // Auto-size columns slightly for prettier appearance
      const colsWidth = headers.map(h => ({ wch: Math.max(h.length + 4, 15) }));
      worksheet['!cols'] = colsWidth;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "InventoryTemplate");
      XLSX.writeFile(workbook, "pak_auto_inventory_import_template.xlsx");
    } catch (err) {
      console.error(err);
      alert("Failed to generate Excel template. Please try again.");
    }
  };

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (['xlsx', 'xls', 'csv'].includes(fileExt || '')) {
        parseFile(file);
      } else {
        setImportError("Unsupported file type! Please upload a valid .xlsx, .xls, or .csv file.");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseFile(e.target.files[0]);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Raw matrix format is best to handle dynamic index mapping
        const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        
        if (rawRows.length <= 1) {
          setImportError("The uploaded spreadsheet seems empty or format is unsupported.");
          setBulkImportList([]);
          return;
        }

        const headers = (rawRows[0] as any[]).map(h => String(h || '').trim().toLowerCase());
        const dataRows = rawRows.slice(1);

        // Helper to find column values across dynamic header aliases
        const getVal = (rowArray: any[], headerAliases: string[], defValue: any = '') => {
          for (const alias of headerAliases) {
            const idx = headers.indexOf(alias.toLowerCase());
            if (idx !== -1 && rowArray[idx] !== undefined && rowArray[idx] !== null) {
              return rowArray[idx];
            }
          }
          return defValue;
        };

        const processed = dataRows.map((row_cells, index) => {
          if (!row_cells || row_cells.filter(Boolean).length === 0) return null; // skip empty rows

          const name = String(getVal(row_cells, ["Product Name", "Name", "Product", "Title", "Item Name", "Item"], '')).trim();
          let code = String(getVal(row_cells, ["SKU Code", "Code", "Barcode", "SKU", "Part Number"], '')).trim();
          const categoryVal = String(getVal(row_cells, ["Category", "Type", "Department"], 'Tools & Equipment')).trim();
          const unitVal = String(getVal(row_cells, ["Unit", "Unit Type", "UOM"], 'pc')).trim().toLowerCase();
          
          const costVal = parseFloat(getVal(row_cells, ["Cost Price", "Cost", "Buying Price", "CostPrice"], 0));
          const retailVal = parseFloat(getVal(row_cells, ["Retail Price", "Retail", "Price", "Sale Price", "RetailPrice"], 0));
          const wholesaleParam = getVal(row_cells, ["Wholesale Price", "Wholesale", "WholesalePrice"], null);
          const wholesaleVal = wholesaleParam !== null ? parseFloat(wholesaleParam) : retailVal;
          
          const stockVal = parseInt(getVal(row_cells, ["Stock", "Qty", "Quantity", "Initial Stock", "Stock level"], 0)) || 0;
          const thresholdVal = parseInt(getVal(row_cells, ["Threshold", "Warning Stock", "Min Stock", "Limit"], 5)) || 5;
          const locationVal = String(getVal(row_cells, ["Rack Location", "Location", "Rack", "Shelf"], 'General Aisle')).trim();

          const costPrice = isNaN(costVal) ? 0 : costVal;
          const retailPrice = isNaN(retailVal) ? 0 : retailVal;
          const wholesalePrice = isNaN(wholesaleVal) ? retailPrice : wholesaleVal;
          const stock = isNaN(stockVal) ? 0 : stockVal;
          const threshold = isNaN(thresholdVal) ? 5 : thresholdVal;
          const location = locationVal || 'Aisle 1';

          // Category mapping
          let category = 'Tools & Equipment';
          const matchedCategory = HARDWARE_CATEGORIES.find(
            c => c.toLowerCase() === categoryVal.toLowerCase() ||
                 c.toLowerCase().replace(/\s/g, '') === categoryVal.toLowerCase().replace(/\s/g, '')
          );
          if (matchedCategory) {
            category = matchedCategory;
          }

          // Unit mapping
          let unit: UnitType = 'pc';
          const u_clean = unitVal.replace(/\s+/g, '');
          if (['pc', 'piece', 'pcs', 'unit', 'pieces', 'each', 'no', 'number'].includes(u_clean)) unit = 'pc';
          else if (['kg', 'kilo', 'kilogram', 'kgs', 'kgm'].includes(u_clean)) unit = 'kg';
          else if (['ft', 'foot', 'feet', 'ft.', 'meter', 'meters', 'm', 'mtr'].includes(u_clean)) unit = 'ft';
          else if (['box', 'carton', 'bx', 'pkg', 'pack', 'packet'].includes(u_clean)) unit = 'box';

          let isBarcodeAutoGenerated = false;
          if (!code) {
            // Auto generate highly specific modern barcode for Nizami Hardware store
            const rand = Math.floor(1000 + Math.random() * 9000);
            code = `PA${Date.now().toString().slice(-6)}${rand}`;
            isBarcodeAutoGenerated = true;
          }

          const isValid = name.length > 0;
          const errorReason = !isValid ? "Product Name field is empty or missing" : "";

          return {
            rowNumber: index + 2,
            name,
            code,
            category,
            unit,
            costPrice,
            retailPrice,
            wholesalePrice,
            stock,
            threshold,
            location,
            isBarcodeAutoGenerated,
            isValid,
            errorReason
          };
        }).filter(Boolean);

        setBulkImportList(processed);
        setImportError(null);
      } catch (err) {
        console.error(err);
        setImportError("Parsing spreadsheet failed. Please check file columns structure and try again.");
        setBulkImportList([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmBulkImport = () => {
    const validItems = bulkImportList.filter(item => item.isValid);
    if (validItems.length === 0) {
      setImportError("No valid products can be imported from this file.");
      return;
    }

    const itemsToImport: Omit<Product, 'id'>[] = validItems.map(item => ({
      name: item.name,
      code: item.code,
      category: item.category,
      unit: item.unit,
      costPrice: item.costPrice,
      retailPrice: item.retailPrice,
      wholesalePrice: item.wholesalePrice,
      stock: item.stock,
      threshold: item.threshold,
      location: item.location
    }));

    if (onBulkAddProducts) {
      onBulkAddProducts(itemsToImport);
    } else {
      // Fallback to iterative additions if prop is somehow missing
      validItems.forEach(item => {
        onAddProduct({
          name: item.name,
          code: item.code,
          category: item.category,
          unit: item.unit,
          costPrice: item.costPrice,
          retailPrice: item.retailPrice,
          wholesalePrice: item.wholesalePrice,
          stock: item.stock,
          threshold: item.threshold,
          location: item.location
        });
      });
    }

    setSuccessNotification(`Successfully bulk-imported ${validItems.length} products to your stock inventory catalog!`);
    setShowBulkUploadModal(false);
    setBulkImportList([]);
    setImportError(null);

    // Fade notification
    setTimeout(() => {
      setSuccessNotification(null);
    }, 5000);
  };

  const handlePrintSheet = () => {
    // 1. Save configurations to localStorage for the standalone print page
    try {
      localStorage.setItem('hw_pending_print', JSON.stringify({
        printList,
        includeBranding,
        includePrice,
        includeLocation,
        printColumns
      }));
    } catch (err) {
      console.error('Failed to sync barcode print configuration', err);
    }

    // 2. Open printable route in a new tab smoothly
    const url = window.location.origin + window.location.pathname + '?print=true';
    const win = window.open(url, '_blank');
    if (!win) {
      setSuccessNotification("⚠️ Pop-up blocked! Please click 'Print Sheet Now' to render representation.");
    }
  };

  // Adding product state form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState(HARDWARE_CATEGORIES[0]);
  const [newUnit, setNewUnit] = useState<UnitType>('pc');
  const [newRetailPrice, setNewRetailPrice] = useState('');
  const [newWholesalePrice, setNewWholesalePrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [newLocation, setNewLocation] = useState('');

  // Editing state form
  const [editFormValues, setEditFormValues] = useState<Partial<Product>>({});

  const generateRandomSKU = () => {
    const randomCode = '7890' + Math.floor(10000000 + Math.random() * 90000000).toString();
    if (showEditForm) {
      setEditFormValues(prev => ({ ...prev, code: randomCode }));
    } else {
      setNewCode(randomCode);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRetailPrice || !newCostPrice || !newStock || !newThreshold) {
      alert('Please fill out all required numeric fields');
      return;
    }

    onAddProduct({
      code: newCode || '7890' + Math.floor(10000000 + Math.random() * 90000000).toString(),
      name: newName,
      category: newCategory,
      unit: newUnit,
      retailPrice: parseFloat(newRetailPrice),
      wholesalePrice: parseFloat(newWholesalePrice || newRetailPrice),
      costPrice: parseFloat(newCostPrice),
      stock: parseFloat(newStock),
      threshold: parseFloat(newThreshold),
      location: newLocation || 'Unassigned',
    });

    // Reset Form
    setNewCode('');
    setNewName('');
    setNewUnit('pc');
    setNewRetailPrice('');
    setNewWholesalePrice('');
    setNewCostPrice('');
    setNewStock('');
    setNewThreshold('');
    setNewLocation('');
    setShowAddForm(false);
  };

  const handleEditClick = (product: Product) => {
    setShowEditForm(product);
    setEditFormValues(product);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormValues.name || !editFormValues.retailPrice || !editFormValues.costPrice) {
      alert('Required fields cannot be empty');
      return;
    }

    onUpdateProduct(editFormValues as Product);
    setShowEditForm(null);
  };

  const [activeBarcodeDemo, setActiveBarcodeDemo] = useState<string | null>(null);

  // Custom SVG Barcode Builder
  const renderSVGBarcode = (text: string) => {
    // Generate a pseudo-random looking series of bars based on the SKU code
    const bars: boolean[] = [];
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Create zebra lines
    for (let i = 0; i < 40; i++) {
      const bit = ((hash + i * 3) % 7) > 2;
      bars.push(bit);
    }

    return (
      <svg className="h-10 w-44 bg-white" viewBox="0 0 40 10" preserveAspectRatio="none">
        {/* Border indicators */}
        <rect x="0" y="0" width="1" height="10" fill="black" />
        <rect x="39" y="0" width="1" height="10" fill="black" />
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={1 + idx * 0.95}
            y="0"
            width={idx % 4 === 0 ? "0.6" : "0.35"}
            height="10"
            fill={bar ? 'black' : 'transparent'}
          />
        ))}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Success Notification banner */}
      {successNotification && (
        <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-bold shadow-xs animate-pulse">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            <span>{successNotification}</span>
          </div>
          <button 
            onClick={() => setSuccessNotification(null)}
            className="text-emerald-500 hover:text-emerald-700 transition cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Quick Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by part name, SKU code, location (e.g., Aisle 3)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-slate-100 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category selection */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700 outline-hidden hover:bg-slate-50 transition focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              {HARDWARE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Quick stock status selection */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setSelectedStockFilter('All')}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${selectedStockFilter === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                All Stock
              </button>
              <button
                onClick={() => setSelectedStockFilter('Low')}
                className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1 cursor-pointer ${selectedStockFilter === 'Low' ? 'bg-white text-amber-600 shadow-xs font-semibold' : 'text-slate-500 hover:text-amber-500'}`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Low Stock
              </button>
              <button
                onClick={() => setSelectedStockFilter('Out')}
                className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1 cursor-pointer ${selectedStockFilter === 'Out' ? 'bg-white text-rose-600 shadow-xs font-semibold' : 'text-slate-500 hover:text-rose-500'}`}
              >
                Stockouts
              </button>
            </div>

            {/* Create & Print Triggers */}
            <div className="ml-auto flex items-center gap-1.5">
              {selectedProductIds.length > 0 && (
                <>
                  <button
                    onClick={() => setSelectedProductIds([])}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded text-xs font-semibold transition cursor-pointer"
                  >
                    Clear Selected ({selectedProductIds.length})
                  </button>
                  <button
                    onClick={() => {
                      setPrintMode('all');
                      setPrintType('all');
                      setPrintScope('selected');
                      setPrintProduct(null);
                      setPrintCopies(40);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded text-xs font-bold transition shadow-md cursor-pointer animate-pulse"
                  >
                    <Printer className="w-4 h-4" />
                    Print Selected ({selectedProductIds.length})
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setPrintMode('all');
                  setPrintType('all');
                  setPrintScope('all');
                  setPrintProduct(null);
                  setPrintCopies(40);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white rounded text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print All Barcodes
              </button>
            </div>

            <button
              onClick={() => {
                setShowBulkUploadModal(true);
                setBulkImportList([]);
                setImportError(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Import from Excel
            </button>

            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Main Items Grid */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-4 w-12 text-center select-none">
                  <input
                    type="checkbox"
                    title="Select/deselect all filtered barcodes"
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer align-middle"
                    checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.includes(p.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newIds = Array.from(new Set([...selectedProductIds, ...filteredProducts.map(p => p.id)]));
                        setSelectedProductIds(newIds);
                      } else {
                        const filteredSet = new Set(filteredProducts.map(p => p.id));
                        setSelectedProductIds(selectedProductIds.filter(id => !filteredSet.has(id)));
                      }
                    }}
                  />
                </th>
                <th className="py-3 px-4 font-bold">SKU & Product Description</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold">Rack Location</th>
                <th className="py-3 px-4 font-bold">Sales Pricing</th>
                <th className="py-3 px-4 font-bold text-center">Stock Balance</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No products match your active system filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isLow = product.stock <= product.threshold;
                  const isOut = product.stock === 0;

                  return (
                    <tr key={product.id} className={`hover:bg-slate-50/50 transition ${selectedProductIds.includes(product.id) ? 'bg-blue-50/20' : ''}`}>
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center select-none">
                        <input
                          type="checkbox"
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer align-middle"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds([...selectedProductIds, product.id]);
                            } else {
                              setSelectedProductIds(selectedProductIds.filter(id => id !== product.id));
                            }
                          }}
                        />
                      </td>
                      {/* Description + Barcode info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <button
                            title="Click to view details and simulate scanning"
                            type="button"
                            onClick={() => setActiveBarcodeDemo(activeBarcodeDemo === product.id ? null : product.id)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2.5 rounded-lg shrink-0 transition"
                          >
                            <Barcode className="w-4.5 h-4.5" />
                          </button>
                          <div>
                            <span className="font-semibold text-slate-900 line-clamp-1 block text-sm">{product.name}</span>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                              <span className="font-mono text-slate-500 font-semibold">{product.code}</span>
                              <span className="text-slate-300">|</span>
                              <span className="text-slate-500 font-medium">Billed by: <b className="text-slate-800 lowercase">{product.unit}</b></span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Barcode Simulator Panel in row */}
                        {activeBarcodeDemo === product.id && (
                          <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 max-w-sm">
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span>SIMULATOR BARCODE SHEET</span>
                              <button
                                onClick={() => setActiveBarcodeDemo(null)}
                                className="text-slate-400 hover:text-slate-700"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex flex-col items-center py-1.5 bg-white rounded border border-slate-200/55 shadow-xs">
                              {renderSVGBarcode(product.code)}
                              <span className="text-[10px] font-mono tracking-widest text-slate-600 mt-1">{product.code}</span>
                            </div>
                            {onSimulateScanInPOS && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSimulateScanInPOS(product.code);
                                  alert(`Successfully simulated scanning code ${product.code}! Left in POS cart queue.`);
                                }}
                                className="w-full text-center py-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition"
                              >
                                Simulate Physical Scan in POS
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setPrintMode('single');
                                setPrintProduct(product);
                                setPrintCopies(40);
                              }}
                              className="w-full mt-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Print Multi-Label Sheet (Page Grid)
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {product.category}
                      </td>

                      {/* Rack Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-[11px] font-medium bg-slate-100 hover:bg-slate-200/60 px-2 py-0.5 rounded cursor-help" title="Exact hardware slot coordinate">
                            {product.location}
                          </span>
                        </div>
                      </td>

                      {/* Price Tier */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs">
                          <div className="text-slate-950 font-semibold">
                            Retail: <span className="font-mono text-slate-900">Rs. {product.retailPrice.toFixed(2)}</span>
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Wholesale: <span className="font-mono text-blue-600 font-medium">Rs. {product.wholesalePrice.toFixed(2)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Cost: <span className="font-mono">Rs. {product.costPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Balances */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-block text-center space-y-1">
                          <div className={`font-mono text-sm font-bold ${
                            isOut ? 'text-rose-600' :
                            isLow ? 'text-amber-500' :
                            'text-slate-900'
                          }`}>
                            {product.stock} {product.unit}
                          </div>
                          {isOut ? (
                            <span className="px-2 py-0.5 text-[9px] uppercase font-mono bg-red-100 text-red-700 font-bold rounded-full">CRITICAL</span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 text-[9px] uppercase font-mono bg-amber-100 text-amber-700 font-bold rounded-full">LOW STOCK</span>
                          ) : (
                            <span className="px-2 py-0.5 text-[9px] uppercase font-mono bg-emerald-100 text-emerald-700 font-bold rounded-full">IN STOCK</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Edit details"
                            onClick={() => handleEditClick(product)}
                            className="p-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Delete item"
                            onClick={() => {
                              setProductToDelete(product);
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-red-50 hover:text-red-700 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Panel Overlay 0: Bulk Excel Import */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>Bulk Inventory Spreadsheet Import</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mt-1">
                  Upload Excel (.xlsx, .xls) or CSV files to add multiple products in bulk
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkUploadModal(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-slate-600">
              
              {/* Import Setup and Instruction Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Guidelines */}
                <div className="md:col-span-7 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    How to Format Your Spreadsheet
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    To import correctly, your file must contain a header row. The importer is smart and will automatically map different variations of header names:
                  </p>
                  
                  {/* Grid of Columns */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-white p-2 rounded border border-slate-100">
                      <span className="font-bold text-slate-900 block">Product Name *</span>
                      <span className="text-[9px] text-slate-400 font-medium">Title, Name, Item, Product (Required)</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-100">
                      <span className="font-bold text-slate-900 block">SKU Code / Barcode</span>
                      <span className="text-[9px] text-slate-400 font-medium">Auto-generated if left blank</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-100">
                      <span className="font-bold text-slate-900 block">Prices (Cost, Retail, Wholesale)</span>
                      <span className="text-[9px] text-slate-400 font-medium">Defaults to zero if omitted/invalid</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-100">
                      <span className="font-bold text-slate-900 block">Category & Unit Type</span>
                      <span className="text-[9px] text-slate-400 font-medium">Units: pc, box, kg, ft (pc is default)</span>
                    </div>
                  </div>
                </div>

                {/* Template download action card */}
                <div className="md:col-span-5 bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-bold text-blue-900 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-blue-600" />
                      Get Verified Template
                    </h4>
                    <p className="text-[11px] text-blue-700/80 leading-relaxed">
                      Download our clean pre-formatted Microsoft Excel template. Populating this ensures maximum accuracy with correct unit values and category options.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download Sample Excel
                  </button>
                </div>
              </div>

              {/* Drag and Drop File Selection Area */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center cursor-pointer relative ${
                  dragActive 
                    ? "border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/10" 
                    : bulkImportList.length > 0 
                      ? "border-emerald-300 bg-emerald-50/10 hover:border-emerald-500" 
                      : "border-slate-300 hover:border-slate-400 bg-white"
                }`}
              >
                <input
                  type="file"
                  id="excel-file-uploader"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  title="Upload spreadsheet file"
                />
                
                {bulkImportList.length > 0 ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold text-xs">Spreadsheet loaded successfully!</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Found {bulkImportList.length} rows in your sheet. View the sheet preview matrix below.</p>
                    </div>
                    <span className="inline-block mt-2 font-bold px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-700 rounded-lg border border-slate-200 transition">
                      Click or drag to replace file
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-slate-700 font-bold text-xs">Drag and drop sheet file here</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Supports Microsoft Excel (.xlsx, .xls) or comma separated values (.csv)</p>
                    </div>
                    <span className="inline-block mt-2 font-bold px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] rounded-lg border border-blue-100 transition">
                      Browse Files on your Computer
                    </span>
                  </div>
                )}
              </div>

              {/* Error Warning Display */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-semibold flex items-start gap-2 animate-pulse">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>{importError}</div>
                </div>
              )}

              {/* Live Preview Sheet Matrix Table */}
              {bulkImportList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-805 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Live Spreadsheet Parsing Preview Sheet Matrix
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">
                      Row counts: <b className="text-slate-855">{bulkImportList.length} total rows parsed</b>
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 text-[10px] font-bold sticky top-0 uppercase tracking-wider select-none">
                          <th className="py-2.5 px-3 w-12 text-center">Row</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3">Barcode SKUs</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Unit</th>
                          <th className="py-2.5 px-3 text-right">Cost</th>
                          <th className="py-2.5 px-3 text-right">Retail</th>
                          <th className="py-2.5 px-3 text-right">Wholesale</th>
                          <th className="py-2.5 px-3 text-center">Stock</th>
                          <th className="py-2.5 px-3">Rack</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px] text-slate-750">
                        {bulkImportList.map((item, index) => {
                          const isConflict = products.some(p => p.code === item.code && p.code !== '');
                          return (
                            <tr 
                              key={index} 
                              className={`hover:bg-slate-50/70 transition ${!item.isValid ? "bg-rose-50/30" : ""}`}
                            >
                              <td className="py-2 px-3 text-center text-slate-400 font-mono font-bold font-mono">
                                {item.rowNumber}
                              </td>
                              <td className="py-2 px-3 font-semibold text-center select-none">
                                {item.isValid ? (
                                  <div className="flex justify-center">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center gap-0.5">
                                      <Check className="w-2.5 h-2.5" /> Valid
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex justify-center" title={item.errorReason}>
                                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-bold flex items-center gap-0.5">
                                      <X className="w-2.5 h-2.5" /> Error
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3 font-bold truncate max-w-[140px]" title={item.name}>
                                {item.name || <span className="text-rose-500 italic block">Empty Title Name</span>}
                              </td>
                              <td className="py-2 px-3 font-mono">
                                {item.isBarcodeAutoGenerated ? (
                                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] font-bold border border-amber-100 flex items-center gap-0.5 w-fit" title="Auto Generated Code">
                                    <Sparkles className="w-2.5 h-2.5" /> Auto-Barcode
                                  </span>
                                ) : isConflict ? (
                                  <span className="text-amber-600 font-bold" title="SKU Code duplicates an existing inventory item. Ensure it is unique.">
                                    {item.code} ⚠️
                                  </span>
                                ) : (
                                  <span className="text-slate-900 font-semibold">{item.code}</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-500">{item.category}</td>
                              <td className="py-2 px-3 text-slate-400 font-bold">{item.unit}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-500">Rs. {item.costPrice.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-900 font-semibold text-emerald-700">Rs. {item.retailPrice.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-500">Rs. {item.wholesalePrice.toFixed(2)}</td>
                              <td className={`py-2 px-3 text-center font-mono font-bold ${item.stock === 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                {item.stock}
                              </td>
                              <td className="py-2 px-3 text-slate-550 font-medium truncate max-w-[100px]">{item.location}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {!bulkImportList.every(item => item.isValid) && (
                    <div className="text-[10px] text-rose-600 font-bold bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                      ⚠️ WARNING: Some rows have validation errors (such as blank titles) and will be skipped during the import process. Please review your table first!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between rounded-b-2xl">
              <div>
                {bulkImportList.length > 0 && (
                  <div className="text-[11px] text-slate-650">
                    Will import <b className="text-emerald-600 font-bold text-xs">{bulkImportList.filter(item => item.isValid).length}</b> valid items out of <b className="text-slate-800">{bulkImportList.length}</b> rows listed.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    setBulkImportList([]);
                    setImportError(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-bold transition cursor-pointer text-xs"
                >
                  Discard Clean & Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkImport}
                  disabled={bulkImportList.filter(item => item.isValid).length === 0}
                  className={`px-5 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    bulkImportList.filter(item => item.isValid).length > 0
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white active:bg-emerald-800"
                      : "bg-slate-200 text-slate-400 border border-slate-350 cursor-not-allowed"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Confirm and Settle Bulk Import
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Slide-out Panel Overlay: Delete Confirmation */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setProductToDelete(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-900">
                  Confirm Deletion
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Are you absolutely sure you want to remove this item from your stock inventory catalogs? This action is irreversible.
                </p>
              </div>
            </div>

            <div className="bg-rose-50/20 border border-rose-100 p-3 rounded-xl mb-5 space-y-1">
              <div className="text-xs font-bold text-slate-800 line-clamp-1">{productToDelete.name}</div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                <span>SKU: {productToDelete.code}</span>
                <span>•</span>
                <span>Category: {productToDelete.category}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-bold transition cursor-pointer"
              >
                No, Keep Item
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(productToDelete.id);
                  setSuccessNotification(`Successfully removed "${productToDelete.name}" from inventory.`);
                  setProductToDelete(null);
                  setTimeout(() => {
                    setSuccessNotification(null);
                  }, 5000);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg font-bold transition cursor-pointer shadow-sm"
              >
                Yes, Delete Irreversibly
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Panel Overlay 1: Add Item */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Log New Inventory Product</h3>
            <p className="text-xs text-slate-500 mb-5">Create fresh stock registers with location mappings and dual price tags.</p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs select-none">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Part Barcode / SKU Code</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Can self-generate"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-hidden focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={generateRandomSKU}
                      className="px-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0 text-slate-600"
                      title="Generate secure code"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Storage Location (Rack/Aisle)</label>
                  <input
                    type="text"
                    placeholder="e.g., Aisle 2, Shelf F-3"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Product Title / Spec Description</label>
                <input
                  type="text"
                  placeholder="e.g., Copper Plumbing Pipe 1/2 inch Type M (Solder joint)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Broad Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold outline-hidden focus:border-emerald-500"
                  >
                    {HARDWARE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Billing Measurement Unit</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as UnitType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold outline-hidden focus:border-emerald-500"
                  >
                    <option value="pc">Piece (pc / wrench / valves)</option>
                    <option value="kg">Weight (kg / nails / packing)</option>
                    <option value="ft">Length (ft / copper pipe / wire)</option>
                    <option value="box">Packet or Box (box / screw blocks)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Cost Price (Rs. COGS)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 4.50"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Regular Retail Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 8.99"
                    value={newRetailPrice}
                    onChange={(e) => setNewRetailPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Wholesale Contractor Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Defaults if empty"
                    value={newWholesalePrice}
                    onChange={(e) => setNewWholesalePrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-emerald-700">Starting Stock Inventory</label>
                  <input
                    type="number"
                    placeholder="e.g., 50"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold font-mono outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-amber-700">Low Stock Trigger Threshold</label>
                  <input
                    type="number"
                    placeholder="e.g., 10"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold font-mono outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 text-center py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 text-center py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs transition shadow-xs cursor-pointer"
                >
                  Confirm & Write to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-out Panel Overlay 2: Edit Item */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowEditForm(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Modify Product Profile</h3>
            <p className="text-xs text-slate-500 mb-5">Update pricing strategies and locator aisle details for live POS scanning.</p>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs select-none">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Part Barcode / SKU Code</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Can self-generate"
                      value={editFormValues.code || ''}
                      onChange={(e) => setEditFormValues(prev => ({ ...prev, code: e.target.value }))}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-hidden focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={generateRandomSKU}
                      className="px-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0 text-slate-600"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Storage Location (Rack/Aisle)</label>
                  <input
                    type="text"
                    placeholder="e.g., Aisle 2, Shelf F-3"
                    value={editFormValues.location || ''}
                    onChange={(e) => setEditFormValues(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Product Title / Spec Description</label>
                <input
                  type="text"
                  placeholder="name"
                  value={editFormValues.name || ''}
                  onChange={(e) => setEditFormValues(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Broad Category</label>
                  <select
                    value={editFormValues.category || HARDWARE_CATEGORIES[0]}
                    onChange={(e) => setEditFormValues(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold outline-hidden focus:border-emerald-500"
                  >
                    {HARDWARE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Billing Measurement Unit</label>
                  <select
                    value={editFormValues.unit || 'pc'}
                    onChange={(e) => setEditFormValues(prev => ({ ...prev, unit: e.target.value as UnitType }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold outline-hidden focus:border-emerald-500"
                  >
                    <option value="pc">Piece (pc / wrench)</option>
                    <option value="kg">Weight (kg / nails)</option>
                    <option value="ft">Length (ft / piping etc)</option>
                    <option value="box">Packet or Box (box)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Cost Price (Rs. COGS)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="cost"
                    value={editFormValues.costPrice === undefined || isNaN(editFormValues.costPrice!) ? '' : editFormValues.costPrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditFormValues(prev => ({ ...prev, costPrice: val === '' ? undefined : parseFloat(val) }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Regular Retail Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="retail"
                    value={editFormValues.retailPrice === undefined || isNaN(editFormValues.retailPrice!) ? '' : editFormValues.retailPrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditFormValues(prev => ({ ...prev, retailPrice: val === '' ? undefined : parseFloat(val) }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Wholesale Contractor Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="wholesale"
                    value={editFormValues.wholesalePrice === undefined || isNaN(editFormValues.wholesalePrice!) ? '' : editFormValues.wholesalePrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditFormValues(prev => ({ ...prev, wholesalePrice: val === '' ? undefined : parseFloat(val) }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-emerald-700">Stock Inventory</label>
                  <input
                    type="number"
                    placeholder="stock"
                    value={editFormValues.stock === undefined || isNaN(editFormValues.stock!) ? '' : editFormValues.stock}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditFormValues(prev => ({ ...prev, stock: val === '' ? undefined : parseFloat(val) }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold font-mono outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-amber-700">Low Stock Trigger Threshold</label>
                  <input
                    type="number"
                    placeholder="threshold"
                    value={editFormValues.threshold === undefined || isNaN(editFormValues.threshold!) ? '' : editFormValues.threshold}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditFormValues(prev => ({ ...prev, threshold: val === '' ? undefined : parseFloat(val) }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold font-mono outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditForm(null)}
                  className="flex-1 text-center py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 text-center py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs transition shadow-xs cursor-pointer"
                >
                  Update Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide Modal 3: Fully Customizable Barcode Generator & Live Sheet Preview */}
      {printMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans flex items-center gap-2">
                  <Printer className="w-5 h-5 text-blue-600" />
                  Printable Barcode Sheet Generator
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Configure sheet templates and print single item repeated or all catalog files.
                </p>
              </div>
              <button
                onClick={() => setPrintMode(null)}
                className="text-slate-400 hover:text-slate-600 border border-slate-200/60 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Body split into left options / right preview */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
              {/* LEFT COLUMN: Controls & Setup */}
              <div className="lg:col-span-5 space-y-5 flex flex-col min-h-0">
                {/* Print Strategy Selector */}
                <div className="space-y-1 select-none">
                  <label className="font-bold text-slate-700 text-xs block mb-1">Print Mode Option:</label>
                  <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setPrintType('single')}
                      className={`flex-1 py-2 text-center text-xs font-semibold rounded-md transition cursor-pointer ${
                        printType === 'single'
                          ? 'bg-white text-slate-950 shadow-xs border border-slate-100'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Single Item repeated
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintType('all')}
                      className={`flex-1 py-2 text-center text-xs font-semibold rounded-md transition cursor-pointer ${
                        printType === 'all'
                          ? 'bg-white text-slate-950 shadow-xs border border-slate-100'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All hardware items
                    </button>
                  </div>
                </div>

                {/* Single Item Selector */}
                {printType === 'single' && (
                  <div className="space-y-1.5 bg-blue-50/40 p-3 rounded-xl border border-blue-100/40">
                    <label className="font-semibold text-slate-800 text-[11px] block">Select Active Product:</label>
                    <select
                      value={activeSingleProduct?.id || ''}
                      onChange={(e) => {
                        const targetId = e.target.value;
                        setSelectedPrintId(targetId);
                        const matched = products.find(p => p.id === targetId);
                        if (matched) {
                          setPrintProduct(matched);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} [{p.code}]
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Copies Configuration for single product repeated */}
                {printType === 'single' && (
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 text-xs block">Number of stickers in full page:</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={printCopies}
                        onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value) || 12))}
                        className="w-20 bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold font-mono text-center text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <div className="flex flex-wrap gap-1">
                        {[12, 24, 40, 60, 80].map(cnt => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => setPrintCopies(cnt)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                              printCopies === cnt 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/80'
                            }`}
                          >
                            {cnt} tags
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Product Scope Configuration for all products */}
                {printType === 'all' && (
                  <div className="space-y-2 bg-blue-50/30 p-3 rounded-xl border border-blue-100/30">
                    <label className="font-bold text-slate-700 text-xs block">Print Scope Selection:</label>
                    <div className="flex gap-1.5 p-0.5 bg-slate-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setPrintScope('selected')}
                        className={`flex-1 py-1 text-center text-[10px] font-bold rounded-md transition cursor-pointer ${
                          printScope === 'selected'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-950'
                        }`}
                      >
                        Selected ({selectedProductIds.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintScope('all')}
                        className={`flex-1 py-1 text-center text-[10px] font-bold rounded-md transition cursor-pointer ${
                          printScope === 'all'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-950'
                        }`}
                      >
                        All Products
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintScope('custom')}
                        className={`flex-1 py-1 text-center text-[10px] font-bold rounded-md transition cursor-pointer ${
                          printScope === 'custom'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-950'
                        }`}
                      >
                        Only Added Barcodes
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintScope('category')}
                        className={`flex-1 py-1 text-center text-[10px] font-bold rounded-md transition cursor-pointer ${
                          printScope === 'category'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-950'
                        }`}
                      >
                        By Category
                      </button>
                    </div>

                    {printScope === 'selected' && selectedProductIds.length === 0 && (
                      <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                        No product barcodes are selected. Check the checkboxes next to products in the table first!
                      </div>
                    )}

                    {printScope === 'category' && (
                      <div className="mt-2 select-none">
                        <select
                          value={printCategory}
                          onChange={(e) => setPrintCategory(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="All">All Categories</option>
                          {HARDWARE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Copies configuration for all products */}
                {printType === 'all' && (
                  <div className="space-y-2.5 bg-amber-50/20 p-3 rounded-xl border border-amber-100/30">
                    <label className="font-bold text-slate-700 text-xs block">Copies per hardware item:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={copiesPerProduct}
                        onChange={(e) => setCopiesPerProduct(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 bg-white border border-slate-200 rounded-lg p-2 font-bold font-mono text-center text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <span className="text-slate-500 text-[10px] select-none">
                        (Total labels on page: <b className="text-slate-800">{printList.length}</b> barcodes)
                      </span>
                    </div>
                  </div>
                )}

                {/* Sticker Element Toggle Options */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 space-y-2.5">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-0.5">Customize Sticker Info:</span>
                  <div className="space-y-2 text-xs select-none">
                    <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeBranding}
                        onChange={(e) => setIncludeBranding(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      Show Shop Brand header
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includePrice}
                        onChange={(e) => setIncludePrice(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      Show Product Retail Price (Rs.)
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeLocation}
                        onChange={(e) => setIncludeLocation(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      Show Storage Rack Location
                    </label>
                  </div>
                </div>

                {/* Printable Column Count */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 text-xs block">Page Columns Fitting:</label>
                  <div className="flex gap-1.5 select-none">
                    {[2, 3, 4, 5].map(cols => (
                      <button
                        key={cols}
                        type="button"
                        onClick={() => setPrintColumns(cols)}
                        className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold border transition ${
                          printColumns === cols
                            ? 'bg-slate-800 border-slate-800 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {cols} Columns
                      </button>
                    ))}
                  </div>
                          {/* Iframe Print Notice Banner */}
                {typeof window !== 'undefined' && window.self !== window.top && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-200 leading-relaxed mb-3">
                    <span className="font-extrabold text-blue-400 block font-sans mb-1 uppercase tracking-wider">ℹ️ Direct Tab Printing enabled</span>
                    Click <strong className="text-white">"Print Sheet Now"</strong> below to open the printable sheet in a clean browser tab and trigger printing instantly!
                  </div>
                )}

                {/* Interactive Action Triggers */}
                <div className="pt-4 flex gap-2 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setPrintMode(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Close Preview
                  </button>
                  <a
                    href={`${window.location.origin}${window.location.pathname}?print=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      // Save configurations to localStorage for the standalone print page
                      try {
                        localStorage.setItem('hw_pending_print', JSON.stringify({
                          printList,
                          includeBranding,
                          includePrice,
                          includeLocation,
                          printColumns
                        }));
                      } catch (err) {
                        console.error('Failed to sync barcode print configuration', err);
                      }
                    }}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-lg text-center"
                  >
                    <Printer className="w-4 h-4" />
                    Print Sheet Now
                  </a>
                </div>
              </div>
              </div>

              {/* RIGHT COLUMN: Live Interactive Sheet Preview */}
              <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-4 flex flex-col min-h-0 text-white">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest pb-2 border-b border-slate-800 mb-3 select-none">
                  <span>Paper Layout Preview (Sheet Matrix)</span>
                  <span className="text-blue-400 font-mono">
                    {printList.length} total cells
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                  <div className={`grid gap-2 p-2 bg-slate-800 rounded-xl ${
                    printColumns === 2 ? 'grid-cols-2' :
                    printColumns === 3 ? 'grid-cols-3' :
                    printColumns === 4 ? 'grid-cols-4' :
                    'grid-cols-5'
                  }`}>
                    {printList.map((prod, idx) => {
                      if (!prod) return null;
                      return (
                        <div 
                          key={`preview-sticker-${prod.id}-${idx}`}
                          className="bg-white border border-slate-200 p-2 rounded-lg flex flex-col items-center justify-between text-center font-sans shadow-xs min-h-[110px]"
                        >
                          <div className="w-full">
                            {includeBranding && (
                              <div className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-dashed border-slate-200 pb-0.5 mb-1 truncate">
                                ★ NIZAMI HARDWARE STORE ★
                              </div>
                            )}
                            <div className="text-[9px] font-extrabold text-slate-800 line-clamp-1 leading-tight mb-0.5">
                              {prod.name}
                            </div>
                            
                            <div className="flex items-center justify-between gap-1 text-[8px] font-bold px-0.5 text-slate-600">
                              {includePrice ? (
                                <span className="text-emerald-700 font-mono">
                                  Rs.{prod.retailPrice.toFixed(0)}
                                </span>
                              ) : <span />}
                              {includeLocation && prod.location && (
                                <span className="text-[7px] bg-slate-100 px-0.5 rounded text-slate-500 font-mono truncate max-w-[40px]">
                                  {prod.location}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-center mt-1 w-full shrink-0">
                            {renderSVGBarcode(prod.code)}
                            <span className="text-[8px] font-mono tracking-widest text-slate-500 mt-0.5 font-bold">
                              {prod.code}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PHYSICAL PRINT SECTION PICKED BY @MEDIA PRINT DESIGN RULES */}
      {printMode && (
        <div id="print-section" className="hidden print:block bg-white text-black p-4">
          <div className={`grid ${
            printColumns === 2 ? 'grid-cols-2 gap-4' :
            printColumns === 3 ? 'grid-cols-3 gap-3.5' :
            printColumns === 4 ? 'grid-cols-4 gap-2.5' :
            'grid-cols-5 gap-2'
          }`}>
            {printList.map((prod, idx) => {
              if (!prod) return null;
              return (
                <div 
                  key={`physical-print-sticker-${prod.id}-${idx}`}
                  className="bg-white border-2 border-slate-950 p-3 rounded-lg flex flex-col items-center justify-between text-center font-sans page-break-inside-avoid min-h-[140px] w-full"
                  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                >
                  <div className="w-full">
                    {includeBranding && (
                      <div className="text-[10px] font-extrabold text-slate-700 uppercase tracking-widest border-b border-dashed border-slate-300 pb-1 mb-1.5 truncate">
                        ★ NIZAMI HARDWARE STORE ★
                      </div>
                    )}
                    <div className="text-xs font-black text-slate-900 line-clamp-2 leading-tight h-8 flex items-center justify-center px-1 font-sans">
                      {prod.name}
                    </div>
                    
                    <div className="flex items-center justify-between gap-1 mt-1 px-1 text-[11px] font-bold select-none text-slate-800">
                      {includePrice ? (
                        <span className="text-slate-900 font-black font-mono text-[13px] bg-slate-100 border border-slate-300 px-1 rounded-sm">
                          Rs. {prod.retailPrice.toFixed(0)}
                        </span>
                      ) : <span />}
                      {includeLocation && prod.location && (
                        <span className="text-slate-700 bg-slate-50 border border-slate-200 px-1 py-0.5 rounded text-[10px] font-mono font-bold">
                          {prod.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center mt-2 w-full shrink-0">
                    {renderSVGBarcode(prod.code)}
                    <span className="text-[10px] font-mono tracking-widest text-slate-950 font-black mt-1">
                      {prod.code}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
