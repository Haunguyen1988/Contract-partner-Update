"use client";

import { useState } from "react";
import { ImportValidationCard } from "../../../src/components/import-validation-card";
import { apiRequest } from "../../../src/lib/api";
import { useAsyncAction } from "../../../src/lib/async-action";
import { mockContractCsv, mockPartnerCsv } from "../../../src/lib/mocks";
import { useSession } from "../../../src/lib/session";

type ValidationAction = ReturnType<typeof useAsyncAction>;

async function runValidation<TResult>(
  action: ValidationAction,
  request: () => Promise<TResult>,
  errorMessage: string,
  setResult: (value: string) => void
) {
  const result = await action.run(request, {
    errorMessage,
    onError: (message) => setResult(message)
  });

  if (result) {
    setResult(JSON.stringify(result, null, 2));
  }
}

export default function ImportsPage() {
  const { token } = useSession();
  const validatePartnerAction = useAsyncAction();
  const validateContractAction = useAsyncAction();
  const [partnerCsv, setPartnerCsv] = useState(mockPartnerCsv);
  const [contractCsv, setContractCsv] = useState(mockContractCsv);
  const [partnerResult, setPartnerResult] = useState<string>("");
  const [contractResult, setContractResult] = useState<string>("");

  return (
    <div className="grid-2">
      <ImportValidationCard
        title="Validate partner CSV"
        eyebrow="Migration"
        headerTitle="Kiểm tra file đối tác"
        description="Bước này giúp chuẩn hóa owner, tax code và duplicate name trước khi import thật."
        value={partnerCsv}
        result={partnerResult}
        pending={validatePartnerAction.pending}
        buttonLabel="Validate partner file"
        pendingLabel="Đang kiểm tra..."
        onChange={setPartnerCsv}
        onValidate={() => runValidation(
          validatePartnerAction,
          () => apiRequest("/api/internal/imports/partners/validate", {
            method: "POST",
            body: JSON.stringify({ csv: partnerCsv })
          }, token),
          "Không thể validate partner CSV.",
          setPartnerResult
        )}
      />

      <ImportValidationCard
        title="Validate contract CSV"
        eyebrow="Migration"
        headerTitle="Kiểm tra file hợp đồng"
        description="Xác nhận contractNo, owner, partner reference, giá trị và ngày trước khi nạp dữ liệu lịch sử."
        value={contractCsv}
        result={contractResult}
        pending={validateContractAction.pending}
        buttonLabel="Validate contract file"
        pendingLabel="Đang kiểm tra..."
        onChange={setContractCsv}
        onValidate={() => runValidation(
          validateContractAction,
          () => apiRequest("/api/internal/imports/contracts/validate", {
            method: "POST",
            body: JSON.stringify({ csv: contractCsv })
          }, token),
          "Không thể validate contract CSV.",
          setContractResult
        )}
      />
    </div>
  );
}
