import Link from "next/link";
{/* ページ遷移 */}
type Props = {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function MyLink({ href, children, onClick, className }: Props) {
  return (
    <Link href={href} className={`text-blue-500 hover:underline ${className}`} onClick={onClick}>
      {children}
    </Link>
  );
}