import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
}

export default function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary md:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-text-secondary md:text-base">{subtitle}</p>
          )}
        </div>
        {action && (
          <Link
            to={action.href}
            className="group flex shrink-0 items-center gap-1 text-sm font-medium text-primary-light hover:underline"
          >
            {action.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      <div className="mt-3 h-px bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
    </div>
  );
}
