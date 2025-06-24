import React from "react";
import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      {children}
    </div>
  );
}

export function CardContent({ children }: { children: ReactNode }) {
  return <div className="text-sm text-gray-700">{children}</div>;
}