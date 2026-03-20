
export interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  return (
    <div className="w-full overflow-auto rounded-md border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50/50">
          <tr className="border-b border-gray-200 transition-colors">
            {columns.map((column, i) => (
              <th
                key={i}
                className="h-10 px-4 text-left align-middle font-medium text-gray-500"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="h-24 text-center text-gray-500">
                Không có dữ liệu.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors hover:bg-gray-50/50 ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="p-4 align-middle">
                    {column.accessor(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
