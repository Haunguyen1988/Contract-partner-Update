"use client";

import Link from "next/link";

import { useViewerAccess } from "@/components/contracts/use-viewer-access";
import { Button } from "@/components/ui/button";

export function PartnersHeaderAction() {
  const { loading, role } = useViewerAccess();

  if (loading || role !== "manager") {
    return null;
  }

  return (
    <Button asChild size="lg" className="rounded-full">
      <Link href="/partners/new">+ Thêm đối tác</Link>
    </Button>
  );
}
