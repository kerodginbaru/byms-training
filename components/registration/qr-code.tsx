"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function RegistrationQrCode({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: 160, color: { dark: "#5c3814" } })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [value]);

  if (!dataUrl) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt={`QR code for ${value}`} width={160} height={160} />;
}
