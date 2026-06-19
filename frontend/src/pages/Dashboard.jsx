import { useQuery } from "@tanstack/react-query";
import { Package, Users, ShoppingCart, AlertTriangle } from "lucide-react";
import { dashboardApi } from "../api/orders";
import PageHeader from "../components/PageHeader";
import { Spinner, ErrorState, EmptyState, CodeChip, Badge } from "../components/ui/States";
import { getErrorMessage } from "../api/client";

function StatCard({ icon: Icon, label, value, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="nums mt-3 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardApi.summary,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="A snapshot of your inventory and orders." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Package} label="Products" value={data.total_products} />
        <StatCard icon={Users} label="Customers" value={data.total_customers} />
        <StatCard icon={ShoppingCart} label="Orders" value={data.total_orders} />
        <StatCard
          icon={AlertTriangle}
          label="Low stock"
          value={data.low_stock_products.length}
          tone="amber"
        />
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="font-medium text-zinc-900">Low stock products</h2>
          <p className="text-sm text-zinc-500">Items at or below the reorder threshold.</p>
        </div>
        {data.low_stock_products.length === 0 ? (
          <EmptyState title="All stocked up" hint="No products are running low right now." />
        ) : (
          <ul className="divide-y divide-zinc-100">
            {data.low_stock_products.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900">{p.name}</p>
                  <span className="mt-0.5 inline-block">
                    <CodeChip>{p.sku}</CodeChip>
                  </span>
                </div>
                <Badge tone={p.quantity === 0 ? "danger" : "warning"}>
                  {p.quantity === 0 ? "Out of stock" : `${p.quantity} left`}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
