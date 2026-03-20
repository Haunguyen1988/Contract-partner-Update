
export function LoadingState() {
  return (
    <div className="flex h-[200px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
      </div>
    </div>
  );
}

export function EmptyState({ message = "Không tìm thấy dữ liệu." }: { message?: string }) {
  return (
    <div className="flex h-[200px] w-full flex-col items-center justify-center rounded-lg border border-dashed text-center">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
