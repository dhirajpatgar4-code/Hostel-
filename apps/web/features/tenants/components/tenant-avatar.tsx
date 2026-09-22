"use client";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTenantPhotoSignedUrl } from "../api";
import { cn } from "@/lib/utils";

export function TenantAvatar({
  path,
  name,
  className,
}: {
  path: string | null;
  name: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!path) { setUrl(null); return; }
    getTenantPhotoSignedUrl(path).then((u) => { if (active) setUrl(u); }).catch(() => {});
    return () => { active = false; };
  }, [path]);

  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Avatar className={cn("h-10 w-10", className)}>
      {url ? <AvatarImage src={url} alt={name} /> : null}
      <AvatarFallback>{initials || "?"}</AvatarFallback>
    </Avatar>
  );
}