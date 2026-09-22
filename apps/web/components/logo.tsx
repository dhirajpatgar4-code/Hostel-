import { cn } from "@/lib/utils";

export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      fill="none"
    >
      <rect width="64" height="64" rx="14" fill="#2563eb" />
      <path d="M14 26 L32 14 L50 26 V48 A2 2 0 0 1 48 50 H16 A2 2 0 0 1 14 48 Z"
            fill="white" opacity="0.15" />
      <path d="M14 26 L32 14 L50 26 V48 A2 2 0 0 1 48 50 H16 A2 2 0 0 1 14 48 Z"
            stroke="white" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <rect x="26" y="34" width="12" height="16" rx="1.5" fill="white" />
      <circle cx="35" cy="42" r="1.2" fill="#2563eb" />
      <rect x="22" y="26" width="6" height="6" rx="1" fill="white" />
      <rect x="36" y="26" width="6" height="6" rx="1" fill="white" />
    </svg>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Logo size={28} />
      <span className="font-semibold tracking-tight">HostelHub PMS</span>
    </div>
  );
}
