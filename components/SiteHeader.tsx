import Link from "next/link";
import NavMenu from "./NavMenu";

type SiteHeaderProps = {
  dark?: boolean;
  className?: string;
};

export default function SiteHeader({ dark = false, className = "" }: SiteHeaderProps) {
  return (
    <nav className={`flex justify-between items-center px-4 sm:px-6 py-4 max-w-[720px] mx-auto ${className}`.trim()}>
      <Link href="/" className="no-underline">
        <span
          className={`${dark ? "text-white" : "text-[#00e401]"} text-2xl leading-none`}
          style={{ fontFamily: "var(--font-old-english)" }}
        >
          Sentral
        </span>
      </Link>
      <NavMenu dark={dark} />
    </nav>
  );
}
