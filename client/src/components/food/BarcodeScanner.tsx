import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
}

export default function BarcodeScanner({ onScan, onError }: BarcodeScannerProps) {
  const [started, setStarted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode('barcode-reader');
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 280, height: 150 },
        aspectRatio: 1.5,
      },
      (decodedText) => {
        if (scannedRef.current) return;
        scannedRef.current = true;
        onScan(decodedText);
      },
      () => {},
    ).then(() => {
      setStarted(true);
    }).catch((err: any) => {
      const msg = String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setPermissionDenied(true);
      }
      onError?.(msg);
    });

    return () => {
      scanner.isScanning && scanner.stop().catch(() => {});
    };
  }, []);

  if (permissionDenied) {
    return (
      <div className="text-center py-8">
        <CameraOff size={32} className="mx-auto text-brown-light mb-3" />
        <p className="text-sm text-brown-light font-medium">Camera access denied</p>
        <p className="text-xs text-brown-light mt-1">
          Allow camera access in your browser settings to scan barcodes, or use the Search tab instead.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        id="barcode-reader"
        ref={containerRef}
        className="rounded-xl overflow-hidden bg-black"
        style={{ minHeight: 220 }}
      />
      {!started && (
        <div className="text-center py-4">
          <Camera size={24} className="mx-auto text-brown-light mb-2 animate-pulse" />
          <p className="text-xs text-brown-light">Starting camera...</p>
        </div>
      )}
      <p className="text-xs text-brown-light text-center">
        Point your camera at a barcode on any food package
      </p>
    </div>
  );
}
