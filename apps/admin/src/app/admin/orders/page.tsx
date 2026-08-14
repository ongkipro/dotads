import { OrderDataTable } from "@/components/OrderDataTable";

export default function AdminOrdersPage() {
  return (
    <section aria-label="Daftar dan pengelolaan pesanan" className="space-y-6 pb-8">
      <OrderDataTable />
    </section>
  );
}
