import Link from "next/link";

export default function Logo({ dark = false, linked = true }: { dark?: boolean; linked?: boolean }) {
  const color = dark ? "text-white" : "text-[#00e401]";
  const content = (
    <span className={`text-xl font-bold ${color}`} style={{ fontFamily: "'UnifrakturMaguntia', serif" }}>
      Sentral
    </span>
  );

  if (!linked) return content;

  return (
    <Link href="/" className="no-underline">
      {content}
    </Link>
  );
}
