import React from "react";
import Link from "next/link";
import { LucideIcon, Rocket } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Rocket,
  actionLabel = "Deploy Your First Token",
  actionHref = "/deploy",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center glass-card animate-fade-in">
      <div className="mb-6 rounded-full bg-stellar-500/10 p-6 ring-1 ring-stellar-500/20">
        <Icon className="h-12 w-12 text-stellar-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="max-w-xs text-sm text-gray-400 mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button className="px-8 py-2.5 font-semibold transition-all hover:scale-105 active:scale-95">
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}
