function UsersLoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="bg-bg-secondary/50 p-4 rounded-xl animate-pulse flex items-center gap-4">
          <div className="size-12 bg-border rounded-full flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-4 bg-border rounded w-2/3 mb-2.5"></div>
            <div className="h-3 bg-border/70 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
export default UsersLoadingSkeleton;
