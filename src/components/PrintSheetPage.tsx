import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import { Printer, ArrowLeft } from 'lucide-react';

interface PrintConfig {
  printList: Product[];
  includeBranding: boolean;
  includePrice: boolean;
  includeLocation: boolean;
  printColumns: number;
}

export default function PrintSheetPage() {
  const [config, setConfig] = useState<PrintConfig | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hw_pending_print');
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to parse print configuration', err);
    }
  }, []);

  // Trigger print dialog once config is loaded and rendering is complete
  useEffect(() => {
    if (config && config.printList.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [config]);

  if (!config || !config.printList || config.printList.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
            <Printer className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-sans">No Barcodes Selected</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            There are no pending barcodes configured for printing. Please go back to the inventory panel, select your products, and click "Print Sheet Now" again.
          </p>
          <button
            onClick={() => window.close()}
            className="w-full py-2.5 bg-slate-750 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer border border-slate-700"
          >
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  const { printList, includeBranding, includePrice, includeLocation, printColumns } = config;
  const gridCols = printColumns || 4;

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased" id="print-section">
      {/* Sticky controls bar - invisible in print mode */}
      <div className="no-print sticky top-0 left-0 right-0 bg-slate-900 text-white border-b border-slate-800 p-3 flex flex-wrap gap-4 items-center justify-between z-50 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.close()}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xs font-black tracking-wider uppercase font-sans">PRINT SHEET MATRIX ACTIVE</h1>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Ready to transmit with layout grid matrix</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 mr-2">
            <span>Stickers: </span>
            <strong className="text-blue-400 font-extrabold">{printList.length}</strong>
            <span className="mx-1">•</span>
            <span>Columns: </span>
            <strong className="text-blue-400 font-extrabold">{gridCols}</strong>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Now
          </button>
          <button
            onClick={() => window.close()}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-lg transition border border-slate-700 cursor-pointer"
          >
            Close Tab
          </button>
        </div>
      </div>

      {/* Styled inline style overrides specifically for print format */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm 10mm;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-padding-container {
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Page Body */}
      <div className="print-padding-container p-6 max-w-4xl mx-auto">
        
        {/* Print Branding Header */}
        <div className="border-b-2 border-slate-900 pb-3 mb-6 flex justify-between items-end w-full">
          <div>
            <h1 className="margin-0 text-sm font-black text-slate-900 uppercase tracking-widest">
              ★ BARCODE SHEET MATRIX ★
            </h1>
            <p className="margin-0 text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Aboo's Software Management System • Standard Layout Sheet Matrix
            </p>
          </div>
          <div className="text-right font-mono text-[10px] text-slate-750 font-bold leading-normal">
            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mr-1.5">
              COLUMNS: {gridCols}
            </span>
            <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-blue-700">
              TOTAL STICKERS: {printList.length}
            </span>
          </div>
        </div>

        {/* Matrix Grid */}
        <div 
          className="grid gap-3 w-full bg-white"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
          }}
        >
          {printList.map((prod, idx) => {
            if (!prod) return null;

            // Generate specific deterministic pseudo barcode bars
            const bars: boolean[] = [];
            const hash = prod.code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            for (let i = 0; i < 40; i++) {
              const bit = ((hash + i * 3) % 7) > 2;
              bars.push(bit);
            }

            return (
              <div 
                key={`printable-item-${prod.id}-${idx}`}
                className="border-2 border-slate-950 rounded-lg p-2 flex flex-col justify-between items-center text-center bg-white min-h-[125px] w-full page-break-inside-avoid"
                style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
              >
                {includeBranding && (
                  <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest border-b border-dashed border-slate-300 pb-1 mb-1 w-full truncate whitespace-nowrap">
                    ★ ABOO'S SOFTWARE MANAGEMENT SYSTEM ★
                  </div>
                )}
                
                <div className="text-[11px] font-black text-slate-900 leading-tight h-[28px] flex items-center justify-center w-full overflow-hidden text-ellipsis">
                  {prod.name}
                </div>

                <div className="flex items-center justify-between w-full my-1.5 gap-1">
                  {includePrice ? (
                    <span className="text-[10px] font-black font-mono bg-slate-100 border border-slate-300 px-1.5 py-0.2 rounded text-slate-900 whitespace-nowrap">
                      Rs. {prod.retailPrice.toFixed(0)}
                    </span>
                  ) : <span />}
                  
                  {includeLocation && prod.location ? (
                    <span className="text-[8.5px] font-black font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.2 text-slate-700 rounded truncate max-w-[65px] whitespace-nowrap">
                      {prod.location}
                    </span>
                  ) : <span />}
                </div>

                <div className="flex flex-col items-center w-full mt-auto">
                  {/* SVG Barcode */}
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="block w-[140px] h-[34px]"
                    viewBox="0 0 40 10" 
                    preserveAspectRatio="none"
                    style={{ height: '34px', width: '140px', background: 'white' }}
                  >
                    <rect x="0" y="0" width="1" height="10" fill="black" />
                    <rect x="39" y="0" width="1" height="10" fill="black" />
                    {bars.map((bar, barIdx) => {
                      const x = 1 + barIdx * 0.95;
                      const width = barIdx % 4 === 0 ? "0.6" : "0.35";
                      const fill = bar ? 'black' : 'transparent';
                      return (
                        <rect 
                          key={`bar-${barIdx}`} 
                          x={x} 
                          y="0" 
                          width={width} 
                          height="10" 
                          fill={fill} 
                        />
                      );
                    })}
                  </svg>
                  
                  <span className="text-[8.5px] font-mono font-bold tracking-widest text-slate-900 mt-1 select-none">
                    {prod.code}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
