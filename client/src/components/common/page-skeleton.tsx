import { useLocation } from "react-router"
import { Skeleton } from "@/components/ui/skeleton"

export function PageSkeleton() {
  const location = useLocation()
  const isDashboard = location.pathname === "/" || location.pathname === "/dashboard"

  if (isDashboard) {
    return <DashboardSkeleton />
  }

  return <TablePageSkeleton />
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* ── Title & Overview Header Shimmer ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* ── Attendance Calendar Grid (Large Card) ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-4 lg:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40 mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-60 mt-1.5" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-12 mx-auto" />
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="border border-border/20 rounded-lg p-2 min-h-[80px] flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-8 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full rounded mt-4" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Leave Balances ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/40 p-4 bg-card flex items-center gap-3 shadow-none">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Two-Column Bottom Row (Tasks & Announcements) ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tasks Card Skeleton */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-border/40 pb-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-48 flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Announcements Card Skeleton */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-border/40 pb-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2 py-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 rounded-full" />
                  <Skeleton className="h-3.5 w-12" />
                </div>
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TablePageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* ── Header Shimmer ── */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-48" />
      </div>

      {/* ── Filters Row Shimmer ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-border/30 pb-4">
        <div className="relative w-full sm:max-w-xs">
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* ── Table Card Shimmer ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Table Header Row */}
        <div className="grid grid-cols-5 gap-4 px-6 py-3.5 bg-muted/20 border-b border-border/40">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12 justify-self-end" />
        </div>

        {/* Table Body Rows */}
        <div className="divide-y divide-border/20">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 px-6 py-4 items-center">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4.5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-16 rounded-lg justify-self-end" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
