import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import Link from "next/link";

/** The only button styles on the site. Pills everywhere; three heights. */
export const buttonStyles = cva(
  "press inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-navy text-white hover:bg-navy-hover",
        secondary: "border border-navy/20 bg-white text-navy hover:border-navy/40 hover:bg-navy/[0.03]",
        gold: "bg-gold-light text-navy hover:bg-white",
        light: "bg-white text-navy hover:bg-cream",
        outlineLight: "border border-white/30 text-white hover:bg-white/10",
        ghost: "text-navy hover:bg-navy/[0.05]",
        danger: "bg-ember text-white hover:bg-ember/90",
      },
      size: {
        sm: "h-10 px-4 text-[14px]",
        md: "h-12 px-6 text-[15px]",
        lg: "h-14 px-7 text-[15px]",
      },
      full: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Variants = VariantProps<typeof buttonStyles>;

type ButtonProps = Variants & React.ButtonHTMLAttributes<HTMLButtonElement>;
export function Button({ variant, size, full, className, ...rest }: ButtonProps) {
  return <button {...rest} className={clsx(buttonStyles({ variant, size, full }), className)} />;
}

type LinkButtonProps = Variants & { href: string; className?: string; children: React.ReactNode };
export function LinkButton({ variant, size, full, className, href, children }: LinkButtonProps) {
  const cls = clsx(buttonStyles({ variant, size, full }), className);
  return href.startsWith("#") ? (
    <a href={href} className={cls}>{children}</a>
  ) : (
    <Link href={href} className={cls}>{children}</Link>
  );
}
