"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useViewerAccess } from "@/components/contracts/use-viewer-access";

export function ContractsHeaderAction() {
  const { loading, role } = useViewerAccess();

  if (loading) {
    return null;
  }

  if (role !== "manager" && role !== "staff") {
    return null;
  }

  return (
    <Button asChild size="lg" className="rounded-full">
      <Link href="/contracts/new">+ Tạo HĐ mới</Link>
    </Button>
  );
}
