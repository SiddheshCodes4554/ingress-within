import React from 'react';

export default function ExerciseLoading() {
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center border-b border-primary/5 pb-4">
        <div className="h-6 w-48 bg-primary/10 rounded-md" />
        <div className="h-4 w-12 bg-primary/10 rounded-md" />
      </div>

      {/* Progress Skeleton */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-20 bg-primary/5 rounded-md" />
          <div className="h-3 w-16 bg-primary/5 rounded-md" />
        </div>
        <div className="h-1.5 w-full bg-primary/5 rounded-full" />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-6 py-4">
        <div className="space-y-3">
          <div className="h-6 w-3/4 bg-primary/10 rounded-md" />
          <div className="h-4 w-1/2 bg-primary/5 rounded-md" />
        </div>
        <div className="h-36 w-full bg-primary/5 rounded-2xl" />
      </div>

      {/* Navigation Skeleton */}
      <div className="flex justify-between border-t border-primary/5 pt-6">
        <div className="h-9 w-24 bg-primary/5 rounded-md" />
        <div className="h-9 w-24 bg-primary/10 rounded-md" />
      </div>
    </div>
  );
}
