import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { DatasetResponse } from "@/lib/types";

interface DataTableCardProps {
  title: string;
  description: string;
  dataset: DatasetResponse;
}

function getColumns(items: Record<string, unknown>[]) {
  const keys = Array.from(new Set(items.flatMap((item) => Object.keys(item))));
  return keys.slice(0, 5);
}

function renderValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function DataTableCard({
  title,
  description,
  dataset
}: DataTableCardProps) {
  const columns = getColumns(dataset.items);

  return (
    <Card className="animate-slide-up">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Badge variant={dataset.connected ? "default" : "outline"}>
          {dataset.connected ? `${dataset.count ?? dataset.items.length} rows` : "Offline"}
        </Badge>
      </CardHeader>
      <CardContent>
        {dataset.message ? (
          <div className="mb-4 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            {dataset.message}
          </div>
        ) : null}

        {!dataset.items.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            Chua co ban ghi de hien thi.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataset.items.map((item, index) => (
                <TableRow key={`${dataset.table}-${index}`}>
                  {columns.map((column) => (
                    <TableCell
                      key={`${dataset.table}-${index}-${column}`}
                      className="max-w-[220px] truncate text-sm text-slate-700"
                    >
                      {renderValue(item[column])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
