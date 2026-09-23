// Cross-platform share/download helpers.

async function fetchAsFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "application/octet-stream" });
}

function filenameFromUrl(url: string, fallback = "file") {
  try {
    const u = new URL(url);
    const name = u.pathname.split("/").pop();
    return name && name.length ? name : fallback;
  } catch {
    return fallback;
  }
}

export async function shareFiles(
  items: { url: string; name?: string }[],
  fallbackText?: string
): Promise<{ method: "native" | "download"; count: number }> {
  if (!items.length) return { method: "download", count: 0 };

  const nav: any = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav && typeof nav.share === "function" && typeof nav.canShare === "function") {
    try {
      const files = await Promise.all(
        items.map((it) => fetchAsFile(it.url, it.name || filenameFromUrl(it.url)))
      );
      if (nav.canShare({ files })) {
        await nav.share({
          files,
          title: fallbackText || "Share",
          text: fallbackText,
        });
        return { method: "native", count: items.length };
      }
    } catch (e) {
      console.warn("[share] native share failed, falling back:", e);
    }
  }

  for (const it of items) {
    try {
      const res = await fetch(it.url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = it.name || filenameFromUrl(it.url);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
    } catch (e) {
      console.error("[share] download failed:", e);
    }
  }
  return { method: "download", count: items.length };
}

export async function shareLink(url: string, text?: string) {
  const nav: any = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav && typeof nav.share === "function") {
    try {
      await nav.share({ url, text, title: text || "Share" });
      return "native" as const;
    } catch {}
  }
  try {
    await navigator.clipboard.writeText(text ? `${text}\n${url}` : url);
    return "copied" as const;
  } catch {
    return "failed" as const;
  }
}

export function whatsappShareUrl(text: string, phone?: string) {
  const clean = phone ? phone.replace(/\D/g, "") : "";
  const base = clean ? `https://wa.me/${clean}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

export async function downloadOne(url: string, name: string) {
  await shareFiles([{ url, name }]);
}
