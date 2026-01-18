import { GalleryVerticalEnd } from "lucide-react";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 24, className }: LogoProps) {
  return (
    <GalleryVerticalEnd
      className={className}
      width={size}
      height={size}
      strokeWidth={1.75}
    />
  );
}
