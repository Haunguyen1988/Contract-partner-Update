"use client";

import Link from "next/link";
import { FileUp, Loader2, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { useViewerAccess } from "@/components/contracts/use-viewer-access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createContractDraft,
  getPartnerOptions,
  getStaffOptions,
  submitContract
} from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { SelectOptionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type FieldName =
  | "contract_number"
  | "partner_id"
  | "owner_id"
  | "title"
  | "value_vnd"
  | "start_date"
  | "expiry_date"
  | "budget_period"
  | "notes";

interface FormState {
  contract_number: string;
  partner_id: string;
  owner_id: string;
  title: string;
  value_vnd: string;
  start_date: string;
  expiry_date: string;
  budget_period: string;
  notes: string;
  file_path: string;
  file_url: string;
}

const REQUIRED_FIELDS: Array<{ key: FieldName; label: string }> = [
  { key: "contract_number", label: "Số HĐ" },
  { key: "partner_id", label: "Đối tác" },
  { key: "owner_id", label: "Owner phụ trách" },
  { key: "title", label: "Tiêu đề HĐ" },
  { key: "value_vnd", label: "Giá trị HĐ" },
  { key: "start_date", label: "Ngày bắt đầu" },
  { key: "expiry_date", label: "Ngày hết hạn" }
];

const INITIAL_FORM: FormState = {
  contract_number: "",
  partner_id: "",
  owner_id: "",
  title: "",
  value_vnd: "",
  start_date: "",
  expiry_date: "",
  budget_period: "",
  notes: "",
  file_path: "",
  file_url: ""
};

function fieldClass(hasError: boolean) {
  return hasError ? "border-rose-300 focus-visible:ring-rose-500" : "";
}

function formatCurrencyPreview(value: string) {
  const numericValue = Number(value);

  if (!value || Number.isNaN(numericValue)) {
    return "0 VNĐ";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(numericValue);
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function NewContractForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { loading: viewerLoading, role, ownerId, displayName, isDemo } = useViewerAccess();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [partners, setPartners] = useState<SelectOptionItem[]>([]);
  const [staffOptions, setStaffOptions] = useState<SelectOptionItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const hasPermission = role === "manager" || role === "staff";

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setLoadingOptions(true);

      try {
        const [partnerResponse, staffResponse] = await Promise.all([
          getPartnerOptions(),
          getStaffOptions()
        ]);

        if (!active) {
          return;
        }

        setPartners(partnerResponse.items);
        setStaffOptions(staffResponse.items);
      } catch {
        if (active) {
          setGlobalMessage(
            "Không tải được danh sách đối tác hoặc nhân sự. Bạn có thể thử lại sau."
          );
        }
      } finally {
        if (active) {
          setLoadingOptions(false);
        }
      }
    }

    if (!viewerLoading) {
      loadOptions();
    }

    return () => {
      active = false;
    };
  }, [viewerLoading]);

  useEffect(() => {
    if (role === "staff" && ownerId) {
      setForm((current) => ({
        ...current,
        owner_id: current.owner_id || ownerId
      }));
    }
  }, [role, ownerId]);

  const selectedOwnerLabel = useMemo(() => {
    return staffOptions.find((item) => item.id === form.owner_id)?.label || displayName;
  }, [staffOptions, form.owner_id, displayName]);

  function setField(field: FieldName, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validateRequiredFields() {
    const nextErrors: Partial<Record<FieldName, string>> = {};

    for (const field of REQUIRED_FIELDS) {
      if (!form[field.key].trim()) {
        nextErrors[field.key] = `${field.label} là bắt buộc.`;
      }
    }

    if (form.value_vnd && Number(form.value_vnd) <= 0) {
      nextErrors.value_vnd = "Giá trị HĐ phải lớn hơn 0.";
    }

    if (form.start_date && form.expiry_date && form.start_date > form.expiry_date) {
      nextErrors.expiry_date = "Ngày hết hạn phải sau hoặc bằng ngày bắt đầu.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildPayload() {
    return {
      contract_number: form.contract_number.trim() || null,
      partner_id: form.partner_id || null,
      owner_id: form.owner_id || null,
      title: form.title.trim() || null,
      value_vnd: form.value_vnd ? Number(form.value_vnd) : null,
      start_date: form.start_date || null,
      expiry_date: form.expiry_date || null,
      budget_period: form.budget_period.trim() || null,
      notes: form.notes.trim() || null,
      file_path: form.file_path || null,
      file_url: form.file_url || null
    };
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadMessage(file ? `Đã chọn file: ${file.name}` : null);
  }

  async function handleUploadFile() {
    setGlobalMessage(null);
    setGlobalSuccess(null);

    if (!selectedFile) {
      setUploadMessage("Vui lòng chọn file hợp đồng trước khi upload.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "contracts";

    if (!supabase) {
      setUploadMessage(
        "Thiếu cấu hình Supabase. Hãy điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }

    setUploading(true);
    setUploadMessage("Đang upload file hợp đồng...");

    try {
      const filePath = `contracts/${Date.now()}-${sanitizeFilename(selectedFile.name)}`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, selectedFile, {
          upsert: false
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

      setForm((current) => ({
        ...current,
        file_path: data.path,
        file_url: publicUrlData.publicUrl || ""
      }));
      setUploadMessage("Upload file hợp đồng thành công.");
    } catch (error) {
      setUploadMessage(
        error instanceof Error
          ? `Upload thất bại: ${error.message}`
          : "Upload thất bại. Vui lòng thử lại."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveDraft() {
    setSavingDraft(true);
    setGlobalMessage(null);
    setGlobalSuccess(null);

    try {
      const response = await createContractDraft(buildPayload());
      setGlobalSuccess(response.message);
      router.push(`/contracts/${response.contract_id}`);
      router.refresh();
    } catch (error) {
      setGlobalMessage(
        error instanceof Error
          ? error.message
          : "Không thể lưu draft. Vui lòng thử lại."
      );
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleSubmitForApproval() {
    setGlobalMessage(null);
    setGlobalSuccess(null);

    if (!validateRequiredFields()) {
      setGlobalMessage("Vui lòng điền đầy đủ các trường bắt buộc trước khi submit.");
      return;
    }

    const confirmed = window.confirm("Xác nhận submit hợp đồng này để gửi duyệt?");
    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await submitContract(buildPayload());
      setGlobalSuccess(response.message);
      router.push(`/contracts/${response.contract_id}`);
      router.refresh();
    } catch (error) {
      setGlobalMessage(
        error instanceof Error
          ? error.message
          : "Không thể submit hợp đồng để duyệt. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (viewerLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-6 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang kiểm tra quyền truy cập...
        </CardContent>
      </Card>
    );
  }

  if (!hasPermission) {
    return (
      <Card>
        <CardContent className="p-6 text-sm leading-7 text-slate-600">
          Bạn không có quyền tạo hợp đồng mới.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/70 bg-white/92 shadow-panel">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Thông tin hợp đồng mới</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-slate-200 bg-slate-50 text-slate-700"
            >
              {role === "manager" ? "Manager" : "Staff"}
            </Badge>
            {isDemo ? (
              <Badge className="border-transparent bg-amber-100 text-amber-700">
                Demo mode
              </Badge>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {globalMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {globalMessage}
            </div>
          ) : null}

          {globalSuccess ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {globalSuccess}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Số HĐ *</label>
                <Input
                  value={form.contract_number}
                  onChange={(event) => setField("contract_number", event.target.value)}
                  placeholder="VD: HD-PR-2026-001"
                  className={fieldClass(Boolean(errors.contract_number))}
                />
                {errors.contract_number ? (
                  <p className="text-sm text-rose-600">{errors.contract_number}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Đối tác *</label>
                <Select
                  value={form.partner_id}
                  onChange={(event) => setField("partner_id", event.target.value)}
                  className={fieldClass(Boolean(errors.partner_id))}
                  disabled={loadingOptions}
                >
                  <option value="">
                    {loadingOptions ? "Đang tải đối tác..." : "Chọn đối tác"}
                  </option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.label}
                    </option>
                  ))}
                </Select>
                {errors.partner_id ? (
                  <p className="text-sm text-rose-600">{errors.partner_id}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Owner phụ trách *
                </label>
                {role === "staff" ? (
                  <div
                    className={cn(
                      "flex h-11 items-center rounded-2xl border bg-slate-50 px-4 text-sm text-slate-700",
                      fieldClass(Boolean(errors.owner_id))
                    )}
                  >
                    {selectedOwnerLabel}
                  </div>
                ) : (
                  <Select
                    value={form.owner_id}
                    onChange={(event) => setField("owner_id", event.target.value)}
                    className={fieldClass(Boolean(errors.owner_id))}
                    disabled={loadingOptions}
                  >
                    <option value="">
                      {loadingOptions ? "Đang tải nhân sự..." : "Chọn owner phụ trách"}
                    </option>
                    {staffOptions.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.label}
                      </option>
                    ))}
                  </Select>
                )}
                {errors.owner_id ? (
                  <p className="text-sm text-rose-600">{errors.owner_id}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Tiêu đề HĐ *
                </label>
                <Input
                  value={form.title}
                  onChange={(event) => setField("title", event.target.value)}
                  placeholder="Tiêu đề hợp đồng"
                  className={fieldClass(Boolean(errors.title))}
                />
                {errors.title ? (
                  <p className="text-sm text-rose-600">{errors.title}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Giá trị HĐ *
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.value_vnd}
                  onChange={(event) => setField("value_vnd", event.target.value)}
                  placeholder="0"
                  className={fieldClass(Boolean(errors.value_vnd))}
                />
                <p className="text-sm text-slate-500">
                  {formatCurrencyPreview(form.value_vnd)}
                </p>
                {errors.value_vnd ? (
                  <p className="text-sm text-rose-600">{errors.value_vnd}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Ngày bắt đầu *
                </label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(event) => setField("start_date", event.target.value)}
                  className={fieldClass(Boolean(errors.start_date))}
                />
                {errors.start_date ? (
                  <p className="text-sm text-rose-600">{errors.start_date}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Ngày hết hạn *
                </label>
                <Input
                  type="date"
                  value={form.expiry_date}
                  onChange={(event) => setField("expiry_date", event.target.value)}
                  className={fieldClass(Boolean(errors.expiry_date))}
                />
                {errors.expiry_date ? (
                  <p className="text-sm text-rose-600">{errors.expiry_date}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Kỳ ngân sách
                </label>
                <Input
                  value={form.budget_period}
                  onChange={(event) => setField("budget_period", event.target.value)}
                  placeholder="VD: 2026, 2026-Q1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ghi chú</label>
            <Textarea
              value={form.notes}
              onChange={(event) => setField("notes", event.target.value)}
              placeholder="Thêm ghi chú nội bộ hoặc các lưu ý khi submit."
            />
          </div>

          <div className="space-y-4 rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/80 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Upload file HĐ</p>
                <p className="mt-2 text-sm text-slate-600">
                  Upload file lên Supabase Storage trước khi lưu draft hoặc submit.
                </p>
              </div>
              {form.file_path ? (
                <Badge className="border-transparent bg-emerald-100 text-emerald-700">
                  Đã upload
                </Badge>
              ) : null}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Chọn file
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleUploadFile}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileUp className="mr-2 h-4 w-4" />
                )}
                Upload file HĐ
              </Button>
              {selectedFile ? (
                <span className="text-sm text-slate-500">{selectedFile.name}</span>
              ) : null}
            </div>

            {uploadMessage ? (
              <p className="text-sm text-slate-600">{uploadMessage}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href="/contracts">Hủy</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={savingDraft || submitting}
            >
              {savingDraft ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Lưu Draft
            </Button>
            <Button
              type="button"
              onClick={handleSubmitForApproval}
              disabled={submitting || savingDraft}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit để duyệt
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
