import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  className?: string;
}

export function StatsCard({ title, value, description, className }: StatsCardProps) {
  return (
    <div className={cn("rounded-lg border border-gray-200 bg-white p-5", className)}>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
    </div>
  );
}
