import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

interface SummaryCardProps {
  label: string;
  count: number | null;
  connected: boolean;
}

export function SummaryCard({ label, count, connected }: SummaryCardProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{label}</CardDescription>
          <Badge variant={connected ? "default" : "outline"}>
            {connected ? "Live" : "Pending"}
          </Badge>
        </div>
        <CardTitle className="text-4xl">{count ?? "--"}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Hien thi so ban ghi hien co tu Supabase cho nhom van hanh.
        </p>
      </CardContent>
    </Card>
  );
}
