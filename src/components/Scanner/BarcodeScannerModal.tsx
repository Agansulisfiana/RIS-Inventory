import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  ScanLine, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCw, 
  Keyboard, 
  RotateCcw,
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';
import { InventoryItem, User, StockMovementType, ItemCondition, WarehouseSettings } from '../../types';
import { storageService } from '../../services/storage';
import { warehouseAudio } from '../../utils/audio';
import { getInventoryStockState } from '../../utils/inventoryStock';

interface BarcodeScannerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  currentUser?: User;
  onItemUpdated?: () => void;
  initialMode?: 'lookup' | 'inbound' | 'outbound' | 'demo_loan' | 'demo_return';
  items?: InventoryItem[];
  settings?: WarehouseSettings;
  onScanComplete?: (item: InventoryItem) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onItemUpdated,
  initialMode = 'lookup'
}) => {
  const [scanMode, setScanMode] = useState<'lookup' | 'inbound' | 'outbound' | 'demo_loan' | 'demo_return'>(initialMode);
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Inbound / Outbound Form state
  const [quantityInput, setQuantityInput] = useState<number>(1);
  const [refNumber, setRefNumber] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  // Demo Loan form state
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');

  // Demo Return form state
  const [returnCondition, setReturnCondition] = useState<ItemCondition>('bagus');
  const [returnLocation, setReturnLocation] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'interactive-barcode-scanner';

  useEffect(() => {
    setScanMode(initialMode);
  }, [initialMode]);

  // Start / Stop Camera Scanner
  useEffect(() => {
    if (isOpen && isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, isCameraActive]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.5
        },
        (decodedText) => {
          handleCodeFound(decodedText);
        },
        () => {
          // Ignore scanning frame errors
        }
      );
    } catch (err: unknown) {
      console.warn('Camera start error:', err);
      const errMsg = err instanceof Error ? err.message : 'Kamera tidak dapat diakses';
      setCameraError(`Izin kamera tidak aktif atau perangkat tidak mendukung. Gunakan input manual atau tombol simulasi di bawah.`);
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.warn('Camera stop error:', err);
      }
    }
  };

  const handleCodeFound = (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    warehouseAudio.playScanSuccess();
    const item = storageService.getItemByBarcodeOrSku(clean);

    if (item) {
      setScannedItem(item);
      setActionSuccess(`Barcode ${clean} terdeteksi: ${item.name}`);
      setActionError(null);
      setReturnLocation(item.location);
    } else {
      warehouseAudio.playError();
      setScannedItem(null);
      setActionError(`Item dengan Barcode/SKU "${clean}" tidak ditemukan di database gudang!`);
      setActionSuccess(null);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCodeFound(manualCode.trim());
    }
  };

  const handleExecuteAction = () => {
    if (!scannedItem) return;
    setActionSuccess(null);
    setActionError(null);

    if (scanMode === 'inbound') {
      const result = storageService.recordInbound(
        scannedItem.id,
        Number(quantityInput),
        refNumber,
        partnerName || 'Supplier Masuk',
        actionNotes,
        currentUser
      );
      if (result.success && result.item) {
        setScannedItem(result.item);
        setActionSuccess(result.message);
        onItemUpdated();
        resetForms();
      } else {
        setActionError(result.message);
      }
    } else if (scanMode === 'outbound') {
      const result = storageService.recordOutbound(
        scannedItem.id,
        Number(quantityInput),
        refNumber,
        partnerName || 'Penerima / Klien',
        actionNotes,
        currentUser
      );
      if (result.success && result.item) {
        setScannedItem(result.item);
        setActionSuccess(result.message);
        onItemUpdated();
        resetForms();
      } else {
        setActionError(result.message);
      }
    } else if (scanMode === 'demo_loan') {
      if (!borrowerName) {
        setActionError('Nama peminjam wajib diisi');
        return;
      }
      const defaultReturn = new Date();
      defaultReturn.setDate(defaultReturn.getDate() + 7);
      const res = storageService.loanDemoUnit(
        scannedItem.id,
        {
          borrowerName,
          borrowerContact: borrowerContact || '-',
          expectedReturnDate: expectedReturnDate || defaultReturn.toISOString(),
          purpose: loanPurpose || 'Demo Presentasi Klien',
          notes: actionNotes,
          referenceNumber: refNumber
        },
        currentUser
      );
      if (res.success && res.item) {
        setScannedItem(res.item);
        setActionSuccess(res.message);
        onItemUpdated();
        resetForms();
      } else {
        setActionError(res.message);
      }
    } else if (scanMode === 'demo_return') {
      const res = storageService.returnDemoUnitToWarehouse(
        scannedItem.id,
        {
          condition: returnCondition,
          rackLocation: returnLocation,
          returnNotes: actionNotes || 'Unit demo kembali dalam kondisi baik dan lengkap',
          referenceNumber: refNumber
        },
        currentUser
      );
      if (res.success && res.item) {
        setScannedItem(res.item);
        setActionSuccess(res.message);
        onItemUpdated();
        resetForms();
      } else {
        setActionError(res.message);
      }
    }
  };

  const resetForms = () => {
    setQuantityInput(1);
    setRefNumber('');
    setPartnerName('');
    setActionNotes('');
    setBorrowerName('');
    setBorrowerContact('');
    setLoanPurpose('');
  };

  if (!isOpen) return null;

  const allItems = storageService.getInventory();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
              <ScanLine className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                Pemindai Barcode & QR Gudang
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono font-medium">
                  Live Scanner
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Pindai label fisik barang untuk mutasi real-time, cek stok, atau kelola unit demo
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Mode Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
              Pilih Aksi Pemindaian:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setScanMode('lookup')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  scanMode === 'lookup'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Cek Info Stok
              </button>

              <button
                type="button"
                onClick={() => setScanMode('inbound')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  scanMode === 'inbound'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                Barang Masuk
              </button>

              <button
                type="button"
                onClick={() => setScanMode('outbound')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  scanMode === 'outbound'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Barang Keluar
              </button>

              <button
                type="button"
                onClick={() => setScanMode('demo_loan')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  scanMode === 'demo_loan'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Pinjam Demo
              </button>

              <button
                type="button"
                onClick={() => setScanMode('demo_return')}
                className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  scanMode === 'demo_return'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retur Demo
              </button>
            </div>
          </div>

          {/* Camera Scanner Viewport or Manual Toggle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Left: Scanner / Input */}
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600" />
                    Kamera Pemindai
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCameraActive(!isCameraActive)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isCameraActive
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isCameraActive ? 'Matikan Kamera' : 'Nyalakan Kamera HP/Webcam'}
                  </button>
                </div>

                {isCameraActive ? (
                  <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border border-blue-400">
                    <div id={scannerContainerId} className="w-full h-full" />
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-5 text-center border border-dashed border-slate-300 text-slate-500">
                    <Camera className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-xs">
                      Klik "Nyalakan Kamera" untuk memindai langsung menggunakan kamera perangkat Anda, atau ketik Barcode/SKU di bawah.
                    </p>
                  </div>
                )}

                {cameraError && (
                  <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span>{cameraError}</span>
                  </div>
                )}
              </div>

              {/* Manual Input Form / Barcode Gun Input */}
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Keyboard className="w-3.5 h-3.5 text-blue-600" />
                    Input Manual / Gun Scanner:
                  </span>
                  <span className="text-[11px] text-slate-400">Tekan Enter setelah scan</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Contoh: 8992753210014 atau GDG-DEMO-001"
                    className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Search className="w-4 h-4" />
                    Cari
                  </button>
                </div>
              </form>

              {/* Quick Sample Clickable Barcodes for Fast Testing */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  ⚡ Klik Sampel Barcode Cepat untuk Simulasi:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allItems.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleCodeFound(item.barcode)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-mono transition-colors text-left truncate max-w-[170px] cursor-pointer"
                      title={`${item.sku} - ${item.name}`}
                    >
                      {item.sku}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Scanned Item Details & Operation Confirmation */}
            <div className="space-y-4">
              {scannedItem ? (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                        {scannedItem.sku}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                        {scannedItem.name}
                      </h3>
                      <p className="text-xs text-slate-500">{scannedItem.brand} • {scannedItem.category}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      scannedItem.status === 'in_warehouse' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      scannedItem.status === 'demo_loaned' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {scannedItem.status === 'in_warehouse' ? 'Di Gudang' :
                       scannedItem.status === 'demo_loaned' ? 'Dipinjam (Demo)' : 'Perbaikan'}
                    </span>
                  </div>

                  {/* Details stats */}
                    <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                    {(() => {
                      const st = getInventoryStockState(scannedItem as any);
                      return (
                        <>
                          <div>
                            <div className="text-slate-400 text-[11px]">Stok Tersedia</div>
                            <div className={`font-bold text-sm ${st.readyQuantity <= scannedItem.minStock ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {st.readyQuantity} ready • {st.demoQuantity} demo
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[11px]">Lokasi Rak</div>
                            <div className="font-semibold text-slate-700 truncate">{scannedItem.location}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[11px]">Harga Satuan</div>
                            <div className="font-semibold text-slate-700">
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(scannedItem.price)}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                    <div>
                      <div className="text-slate-400 text-[11px]">Lokasi Rak</div>
                      <div className="font-semibold text-slate-700 truncate">{scannedItem.location}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[11px]">Harga Satuan</div>
                      <div className="font-semibold text-slate-700">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(scannedItem.price)}
                      </div>
                    </div>
                  </div>

                  {/* Active Demo Loan Note if loaned */}
                  {scannedItem.status === 'demo_loaned' && scannedItem.demoLoanInfo && (
                    <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs space-y-1">
                      <div className="font-semibold text-blue-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Sedang Dipinjam Oleh: {scannedItem.demoLoanInfo.borrowerName}
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        Kontak: {scannedItem.demoLoanInfo.borrowerContact} | Est. Kembali: {scannedItem.demoLoanInfo.expectedReturnDate.split('T')[0]}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Tujuan: {scannedItem.demoLoanInfo.purpose}
                      </div>
                    </div>
                  )}

                  {/* Action Forms based on Scan Mode */}
                  {scanMode === 'inbound' && (
                    <div className="pt-2 border-t border-slate-200 space-y-2.5">
                      <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                        <ArrowDownRight className="w-4 h-4" />
                        Form Penerimaan Barang Masuk (Inbound):
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-1 font-medium">Jumlah Masuk ({scannedItem.unit}):</label>
                          <input
                            type="number"
                            min="1"
                            value={quantityInput}
                            onChange={(e) => setQuantityInput(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-1 font-medium">No. PO / Surat Jalan:</label>
                          <input
                            type="text"
                            value={refNumber}
                            onChange={(e) => setRefNumber(e.target.value)}
                            placeholder="Contoh: PO-IN-0822"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600 block mb-1 font-medium">Nama Supplier / Vendor:</label>
                        <input
                          type="text"
                          value={partnerName}
                          onChange={(e) => setPartnerName(e.target.value)}
                          placeholder="PT Distributor Resmi..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleExecuteAction}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Konfirmasi Barang Masuk (+{quantityInput} {scannedItem.unit})
                      </button>
                    </div>
                  )}

                  {scanMode === 'outbound' && (
                    <div className="pt-2 border-t border-slate-200 space-y-2.5">
                      <div className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                        <ArrowUpRight className="w-4 h-4" />
                        Form Pengeluaran Barang Keluar (Outbound):
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-1 font-medium">Jumlah Keluar ({scannedItem.unit}):</label>
                          <input
                            type="number"
                            min="1"
                            max={getInventoryStockState(scannedItem as any).readyQuantity}
                            value={quantityInput}
                            onChange={(e) => setQuantityInput(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-1 font-medium">No. Surat Jalan / DO:</label>
                          <input
                            type="text"
                            value={refNumber}
                            onChange={(e) => setRefNumber(e.target.value)}
                            placeholder="SJ-OUT-809"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600 block mb-1 font-medium">Nama Customer / Lokasi Tujuan:</label>
                        <input
                          type="text"
                          value={partnerName}
                          onChange={(e) => setPartnerName(e.target.value)}
                          placeholder="PT Klien atau Cabang..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleExecuteAction}
                        disabled={getInventoryStockState(scannedItem as any).readyQuantity < quantityInput}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Konfirmasi Barang Keluar (-{quantityInput} {scannedItem.unit})
                      </button>
                    </div>
                  )}

                  {scanMode === 'demo_loan' && (
                    <div className="pt-2 border-t border-slate-200 space-y-2.5">
                      <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        Form Peminjaman Demo Unit:
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-1 font-medium">Nama Peminjam / Sales:*</label>
                          <input
                            type="text"
                            value={borrowerName}
                            onChange={(e) => setBorrowerName(e.target.value)}
                            placeholder="Ahmad Fauzi (Sales)"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-1 font-medium">No. Kontak Peminjam:</label>
                          <input
                            type="text"
                            value={borrowerContact}
                            onChange={(e) => setBorrowerContact(e.target.value)}
                            placeholder="0812-xxxx-xxxx"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-1 font-medium">Tujuan Demo / Client:</label>
                          <input
                            type="text"
                            value={loanPurpose}
                            onChange={(e) => setLoanPurpose(e.target.value)}
                            placeholder="Demo POC Tender..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-1 font-medium">Est. Tgl Pengembalian:</label>
                          <input
                            type="date"
                            value={expectedReturnDate}
                            onChange={(e) => setExpectedReturnDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleExecuteAction}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        Keluarkan Unit untuk Demo
                      </button>
                    </div>
                  )}

                  {scanMode === 'demo_return' && (
                    <div className="pt-2 border-t border-slate-200 space-y-2.5">
                      <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                        <RotateCcw className="w-4 h-4 text-blue-600" />
                        Form Pengembalian Demo Unit ke Gudang (Real-time):
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-1 font-medium">Kondisi Fisik Saat Kembali:</label>
                          <select
                            value={returnCondition}
                            onChange={(e) => setReturnCondition(e.target.value as ItemCondition)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="bagus">Bagus & Lengkap</option>
                            <option value="baru">Seperti Baru</option>
                            <option value="perlu_servis">Perlu Servis / Pengecekan</option>
                            <option value="rusak">Ada Kerusakan / Kelengkapan Hilang</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-1 font-medium">Lokasi Rak Simpan:</label>
                          <input
                            type="text"
                            value={returnLocation}
                            onChange={(e) => setReturnLocation(e.target.value)}
                            placeholder="Rak Zona Demo"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600 block mb-1 font-medium">Catatan Hasil Pemeriksaan:</label>
                        <input
                          type="text"
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          placeholder="Kelengkapan adaptor & remote lengkap..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleExecuteAction}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Kembalikan Unit & Pulihkan Status di Gudang
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                  <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-700">Belum ada barang yang dipindai</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Arahkan kamera ke barcode produk atau pilih sampel SKU di sebelah kiri.
                  </p>
                </div>
              )}

              {/* Status Message Alerts */}
              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{actionSuccess}</span>
                </div>
              )}
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{actionError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Petugas Aktif: <strong className="text-slate-800 font-semibold">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup Pemindai
          </button>
        </div>
      </div>
    </div>
  );
};
