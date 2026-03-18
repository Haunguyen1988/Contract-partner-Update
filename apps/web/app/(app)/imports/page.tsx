"use client";

import { useState } from "react";
import { Card } from "@contract/ui";
import { PageHeader } from "../../../src/components/page-header";
import { apiRequest } from "../../../src/lib/api";
import { mockContractCsv, mockPartnerCsv } from "../../../src/lib/mocks";
import { useSession } from "../../../src/lib/session";

export default function ImportsPage() {
  const { token } = useSession();
  const [partnerCsv, setPartnerCsv] = useState(mockPartnerCsv);
  const [contractCsv, setContractCsv] = useState(mockContractCsv);
  const [partnerResult, setPartnerResult] = useState<string>("");
  const [contractResult, setContractResult] = useState<string>("");

  return (
    <div className="grid-2">
      <Card title="Validate partner CSV" eyebrow="Migration">
        <PageHeader title="Kiểm tra file đối tác" description="Bước này giúp chuẩn hóa owner, tax code và duplicate name trước khi import thật." />
        <div className="field">
          <label>Nội dung CSV</label>
          <textarea value={partnerCsv} onChange={(event) => setPartnerCsv(event.target.value)} />
        </div>
        <div className="button-row">
          <button
            className="button-primary"
            onClick={async () => {
              try {
                const result = await apiRequest("/imports/partners/validate", {
                  method: "POST",
                  body: JSON.stringify({ csv: partnerCsv })
                }, token);
                setPartnerResult(JSON.stringify(result, null, 2));
              } catch (error) {
                setPartnerResult(error instanceof Error ? error.message : "Không thể validate partner CSV.");
              }
            }}
          >
            Validate partner file
          </button>
        </div>
        <pre className="panel" style={{ padding: 16, overflowX: "auto" }}>{partnerResult || "Chưa có kết quả."}</pre>
      </Card>

      <Card title="Validate contract CSV" eyebrow="Migration">
        <PageHeader title="Kiểm tra file hợp đồng" description="Xác nhận contractNo, owner, partner reference, giá trị và ngày trước khi nạp dữ liệu lịch sử." />
        <div className="field">
          <label>Nội dung CSV</label>
          <textarea value={contractCsv} onChange={(event) => setContractCsv(event.target.value)} />
        </div>
        <div className="button-row">
          <button
            className="button-primary"
            onClick={async () => {
              try {
                const result = await apiRequest("/imports/contracts/validate", {
                  method: "POST",
                  body: JSON.stringify({ csv: contractCsv })
                }, token);
                setContractResult(JSON.stringify(result, null, 2));
              } catch (error) {
                setContractResult(error instanceof Error ? error.message : "Không thể validate contract CSV.");
              }
            }}
          >
            Validate contract file
          </button>
        </div>
        <pre className="panel" style={{ padding: 16, overflowX: "auto" }}>{contractResult || "Chưa có kết quả."}</pre>
      </Card>
    </div>
  );
}

