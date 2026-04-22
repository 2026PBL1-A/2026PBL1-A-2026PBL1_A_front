import Link from "next/link";
{/* ページ遷移 */}
type Props = {
  href: string;
  children: React.ReactNode;
};

export default function MyLink({ href, children }: Props) {
  return (
    <Link href={href} className="text-blue-500 hover:underline">
      {children}
    </Link>
  );
}