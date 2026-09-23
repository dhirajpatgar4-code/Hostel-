"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/** Built-in SVG fallback */
function DefaultLogo({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-md", className)}
      fill="none"
    >
      <rect width="64" height="64" rx="14" fill="#2563eb" />
      <path d="M14 26 L32 14 L50 26 V48 A2 2 0 0 1 48 50 H16 A2 2 0 0 1 14 48 Z" fill="white" opacity="0.15" />
      <path d="M14 26 L32 14 L50 26 V48 A2 2 0 0 1 48 50 H16 A2 2 0 0 1 14 48 Z"
            stroke="white" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <rect x="26" y="34" width="12" height="16" rx="1.5" fill="white" />
      <circle cx="35" cy="42" r="1.2" fill="#2563eb" />
      <rect x="22" y="26" width="6" height="6" rx="1" fill="white" />
      <rect x="36" y="26" width="6" height="6" rx="1" fill="white" />
    </svg>
  );
}

/** Resolve a logo path (in `documents` bucket) to a public URL */
export function usePropertyLogo(): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;
        const { data: pu } = await sb
          .from("property_users")
          .select("property_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        if (!pu) return;

        const { data: prop } = await sb
          .from("properties")
          .select("logo_url")
          .eq("id", pu.property_id)
          .maybeSingle();
        if (!prop?.logo_url || !alive) return;

        // logo_url is either a full URL or a storage path
        if (/^https?:\/\//.test(prop.logo_url)) {
          setUrl(prop.logo_url);
        } else {
          const { data } = sb.storage.from("documents").getPublicUrl(prop.logo_url);
          if (alive) setUrl(data.publicUrl);
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  return url;
}

export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  const uploaded = usePropertyLogo();
  const [errored, setErrored] = useState(false);

  if (uploaded && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={uploaded}
        alt="Logo"
        width={size}
        height={size}
        onError={() => setErrored(true)}
        className={cn("shrink-0 rounded-md object-contain bg-background", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return <DefaultLogo size={size} className={className} />;
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Logo size={28} />
      <span className="font-semibold tracking-tight">HostelHub PMS</span>
    </div>
  );
}
