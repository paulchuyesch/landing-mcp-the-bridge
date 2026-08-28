import React, { useState } from "react";
import { Loader2, Search, ArrowRight } from "lucide-react";

export type ScannerStatus = "idle" | "scanning" | "results" | "error";

interface Props {
  onScanRequest: (url: string) => Promise<void>;
  status: ScannerStatus;
  setStatus: (status: ScannerStatus) => void;
}

export function ScannerForm({ onScanRequest, status, setStatus }: Props) {
  const [url, setUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // Add protocol if missing
    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
      setUrl(finalUrl);
    }

    setStatus("scanning");
    try {
      await onScanRequest(finalUrl);
      setStatus("results");
    } catch (error) {
      setStatus("error");
    }
  };

  const isScanning = status === "scanning";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row w-full gap-3 relative">
      <div className="relative flex-grow flex items-center">
        <Search className="absolute left-5 w-5 h-5 text-[var(--color-foreground-muted)]" />
        <input
          type="url"
          required
          placeholder="https://tutienda.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isScanning}
          className="w-full pl-12 pr-4 py-4 bg-[var(--color-background-tertiary)] border border-[var(--color-border)] rounded-xl focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] outline-none text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-muted)] disabled:opacity-50 transition-all text-lg"
        />
      </div>
      <button
        type="submit"
        disabled={isScanning || !url}
        className="btn-primary rounded-xl h-auto py-4 px-8 w-full sm:w-auto text-lg flex items-center justify-center gap-2"
      >
        {isScanning ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Escaneando...</span>
          </>
        ) : (
          <>
            <span>Analizar</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}
