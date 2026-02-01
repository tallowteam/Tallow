export default function AppLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Loading Tallow</p>
          <p className="text-sm text-muted-foreground">Preparing secure transfer...</p>
        </div>
      </div>
    </div>
  );
}
