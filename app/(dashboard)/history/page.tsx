import { PageHeader, PageShell } from "@/components/page-shell";
import { ServiceHistoryList } from "@/components/history/service-history-list";

export default function HistoryPage() {
  return (
    <PageShell>
      <PageHeader
        title="ประวัติการเข้าใช้บริการ"
        description="ดูประวัติการเข้าใช้บริการของลูกค้าทั้งหมด"
      />
      <div className="flex flex-col lg:min-h-0 lg:flex-1">
        <ServiceHistoryList />
      </div>
    </PageShell>
  );
}
