import type { ReactNode } from "react";

interface DataTableProps {
  columns: string[];
  rows: Array<Array<ReactNode>>;
}

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div style={{ overflowX: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--line)", background: "var(--surface)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
        <thead>
          <tr style={{ background: "var(--bg-1)" }}>
            {columns.map((column) => (
              <th
                key={column}
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--muted)",
                  borderBottom: "1px solid var(--line)"
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} style={{ transition: "background 150ms ease" }}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`cell-${rowIndex}-${cellIndex}`}
                  style={{ 
                    padding: "14px 16px", 
                    borderBottom: rowIndex === rows.length - 1 ? "none" : "1px solid var(--line)", 
                    color: "var(--text)", 
                    fontSize: "14px" 
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

