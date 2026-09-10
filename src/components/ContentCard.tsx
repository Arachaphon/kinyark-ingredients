import React from "react";

type ContentCardProps = {
  title?: string;
  count?: number;
  children: React.ReactNode;
};

export default function ContentCard({ title, count, children }: ContentCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-sm p-6 md:p-10 shadow-sm">
      {title && (
        <div className="mb-8 flex items-baseline gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {count !== undefined && (
            <span className="text-xl font-medium text-gray-400">({count})</span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
