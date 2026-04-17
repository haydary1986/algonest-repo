'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QrCodeProps {
  url: string;
  size?: number;
}

export function QrCode({ url, size = 200 }: QrCodeProps) {
  return (
    <div className="inline-flex rounded-lg border bg-white p-3">
      <QRCodeSVG value={url} size={size} marginSize={2} />
    </div>
  );
}
