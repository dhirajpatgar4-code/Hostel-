"use client";
import { useEffect, useState } from "react";
import { ImageIcon, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBillPhotoSignedUrl } from "../api";

export function BillPhotoViewer({
  path,
  onView,
}: {
  path: string | null;
  onView?: (url: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!path) { setUrl(null); return; }
    getBillPhotoSignedUrl(path).then((u) => { if (active) setUrl(u); }).catch(() => {});
    return () => { active = false; };
  }, [path]);

  if (!path) {
    return (
      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
        <ImageIcon className="h-4 w-4" />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="h-10 w-10 rounded bg-muted overflow-hidden flex items-center justify-center relative group"
      onClick={async () => {
        if (!url) return;
        if (onView) onView(url);
        else window.open(url, "_blank", "noopener,noreferrer");
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="bill" className="w-full h-full object-cover" />
      ) : (
        <ImageIcon className="h-4 w-4" />
      )}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
        <Eye className="h-3.5 w-3.5 text-white" />
      </div>
    </button>
  );
}