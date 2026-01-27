import { ServiceHistoryList } from "@/components/history/service-history-list";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          ประวัติการเข้าใช้บริการ
        </h1>
        <p className="text-muted-foreground">
          ดูประวัติการเข้าใช้บริการของลูกค้าทั้งหมด
        </p>
      </div>
      <ServiceHistoryList />
    </div>
  );
}
