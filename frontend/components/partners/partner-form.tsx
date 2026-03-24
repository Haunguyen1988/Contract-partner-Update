"use client";

import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useViewerAccess } from "@/components/contracts/use-viewer-access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createPartner,
  getPartnerDetail,
  getStaffOptions,
  updatePartner
} from "@/lib/api";
import { PartnerDetailItem, SelectOptionItem } from "@/lib/types";

interface PartnerFormProps {
  mode: "create" | "edit";
  partnerId?: string;
}

interface PartnerFormState {
  name: string;
  partner_type: string;
  tax_code: string;
  primary_owner_id: string;
  backup_owner_id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  notes: string;
  status: "active" | "inactive";
}

type RequiredField = "name" | "partner_type" | "primary_owner_id";

const INITIAL_STATE: PartnerFormState = {
  name: "",
  partner_type: "",
  tax_code: "",
  primary_owner_id: "",
  backup_owner_id: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  notes: "",
  status: "active"
};

function fieldClass(hasError: boolean) {
  return hasError ? "border-rose-300 focus-visible:ring-rose-500" : "";
}

function toFormState(item: PartnerDetailItem): PartnerFormState {
  return {
    name: item.name || "",
    partner_type: item.partner_type || "",
    tax_code: item.tax_code || "",
    primary_owner_id: item.primary_owner_id || "",
    backup_owner_id: item.backup_owner_id || "",
    contact_name: item.contact_name || "",
    contact_email: item.contact_email || "",
    contact_phone: item.contact_phone || "",
    notes: item.notes || "",
    status: item.status || "active"
  };
}

export function PartnerForm({ mode, partnerId }: PartnerFormProps) {
  const router = useRouter();
  const { loading: viewerLoading, role } = useViewerAccess();
  const [staffOptions, setStaffOptions] = useState<SelectOptionItem[]>([]);
  const [form, setForm] = useState<PartnerFormState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequiredField, string>>>(
    {}
  );

  useEffect(() => {
    if (viewerLoading) {
      return;
    }

    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [staffResponse, detailResponse] = await Promise.all([
          getStaffOptions(),
          mode === "edit" && partnerId ? getPartnerDetail(partnerId) : Promise.resolve(null)
        ]);

        if (!active) {
          return;
        }

        setStaffOptions(staffResponse.items);
        if (detailResponse?.item) {
          setForm(toFormState(detailResponse.item));
        }
      } catch {
        if (active) {
          setError("Không thể tải dữ liệu form đối tác. Vui lòng thử lại.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [viewerLoading, mode, partnerId]);

  function setField<K extends keyof PartnerFormState>(field: K, value: PartnerFormState[K]) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));

    setFieldErrors((current) => {
      if (!(field in current)) {
        return current;
      }

      const next = { ...current };
      delete next[field as RequiredField];
      return next;
    });
  }

  function validate() {
    const nextErrors: Partial<Record<RequiredField, string>> = {};

    if (!form.name.trim()) {
      nextErrors.name = "Tên đối tác là bắt buộc.";
    }

    if (!form.partner_type.trim()) {
      nextErrors.partner_type = "Loại đối tác là bắt buộc.";
    }

    if (!form.primary_owner_id.trim()) {
      nextErrors.primary_owner_id = "Owner chính là bắt buộc.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);

    if (!validate()) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        partner_type: form.partner_type.trim(),
        tax_code: form.tax_code.trim() || null,
        primary_owner_id: form.primary_owner_id || null,
        backup_owner_id: form.backup_owner_id || null,
        contact_name: form.contact_name.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        notes: form.notes.trim() || null,
        status: form.status
      };

      const response =
        mode === "create"
          ? await createPartner(payload)
          : await updatePartner(partnerId || "", payload);

      setSuccess(response.message);
      router.push(`/partners/${response.partner_id}`);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Không thể lưu đối tác. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  }

  if (viewerLoading || loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-6 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải form đối tác...
        </CardContent>
      </Card>
    );
  }

  if (role !== "manager") {
    return (
      <Card>
        <CardContent className="p-6 text-sm leading-7 text-slate-600">
          Bạn không có quyền thêm hoặc sửa đối tác.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/70 bg-white/92 shadow-panel">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">
            {mode === "create" ? "Thêm đối tác mới" : "Cập nhật đối tác"}
          </CardTitle>
          <Badge variant="outline" className="border-slate-200 bg-slate-50">
            Admin / Manager
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tên đối tác *</label>
                <Input
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="Tên đối tác báo chí"
                  className={fieldClass(Boolean(fieldErrors.name))}
                />
                {fieldErrors.name ? (
                  <p className="text-sm text-rose-600">{fieldErrors.name}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Loại *</label>
                <Input
                  value={form.partner_type}
                  onChange={(event) => setField("partner_type", event.target.value)}
                  placeholder="VD: Báo online, Báo in + online"
                  className={fieldClass(Boolean(fieldErrors.partner_type))}
                />
                {fieldErrors.partner_type ? (
                  <p className="text-sm text-rose-600">{fieldErrors.partner_type}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">MST</label>
                <Input
                  value={form.tax_code}
                  onChange={(event) => setField("tax_code", event.target.value)}
                  placeholder="Mã số thuế"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Owner chính *</label>
                <Select
                  value={form.primary_owner_id}
                  onChange={(event) => setField("primary_owner_id", event.target.value)}
                  className={fieldClass(Boolean(fieldErrors.primary_owner_id))}
                >
                  <option value="">Chọn owner chính</option>
                  {staffOptions.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.label}
                    </option>
                  ))}
                </Select>
                {fieldErrors.primary_owner_id ? (
                  <p className="text-sm text-rose-600">{fieldErrors.primary_owner_id}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Owner dự phòng</label>
                <Select
                  value={form.backup_owner_id}
                  onChange={(event) => setField("backup_owner_id", event.target.value)}
                >
                  <option value="">Chọn owner dự phòng</option>
                  {staffOptions.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tên liên hệ</label>
                <Input
                  value={form.contact_name}
                  onChange={(event) => setField("contact_name", event.target.value)}
                  placeholder="Người liên hệ chính"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email liên hệ</label>
                <Input
                  type="email"
                  value={form.contact_email}
                  onChange={(event) => setField("contact_email", event.target.value)}
                  placeholder="contact@partner.vn"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Số điện thoại</label>
                <Input
                  value={form.contact_phone}
                  onChange={(event) => setField("contact_phone", event.target.value)}
                  placeholder="0901234567"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Trạng thái</label>
                <Select
                  value={form.status}
                  onChange={(event) =>
                    setField("status", event.target.value as PartnerFormState["status"])
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ghi chú</label>
            <Textarea
              value={form.notes}
              onChange={(event) => setField("notes", event.target.value)}
              placeholder="Ghi chú nội bộ về đối tác, cách làm việc hoặc các lưu ý vận hành."
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href={partnerId ? `/partners/${partnerId}` : "/partners"}>Hủy</Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {mode === "create" ? "Lưu đối tác" : "Lưu thay đổi"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
