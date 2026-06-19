import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Eye, X } from "lucide-react";
import { ordersApi } from "../api/orders";
import { productsApi } from "../api/products";
import { customersApi } from "../api/customers";
import { getErrorMessage } from "../api/client";
import { useToast } from "../hooks/useToast";
import { formatMoney, formatDate } from "../lib";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Field, Select, Input } from "../components/ui/Field";
import { Spinner, ErrorState, EmptyState, CodeChip } from "../components/ui/States";

// A single editable line in the order builder.
const blankLine = { product_id: "", quantity: "1" };

export default function Orders() {
  const qc = useQueryClient();
  const toast = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([{ ...blankLine }]);
  const [formError, setFormError] = useState("");

  const ordersQuery = useQuery({ queryKey: ["orders"], queryFn: ordersApi.list });
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: productsApi.list });
  const customersQuery = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });

  const productById = useMemo(() => {
    const map = {};
    (productsQuery.data ?? []).forEach((p) => (map[p.id] = p));
    return map;
  }, [productsQuery.data]);

  const customerById = useMemo(() => {
    const map = {};
    (customersQuery.data ?? []).forEach((c) => (map[c.id] = c));
    return map;
  }, [customersQuery.data]);

  // Client-side preview only. The backend recomputes the authoritative total.
  const previewTotal = useMemo(() => {
    return lines.reduce((sum, line) => {
      const product = productById[line.product_id];
      const qty = Number(line.quantity);
      if (!product || !qty) return sum;
      return sum + Number(product.price) * qty;
    }, 0);
  }, [lines, productById]);

  const createMutation = useMutation({
    mutationFn: (payload) => ordersApi.create(payload),
    onSuccess: () => {
      toast.success("Order created.");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] }); // stock changed
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setCreateOpen(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => ordersApi.remove(id),
    onSuccess: () => {
      toast.success("Order cancelled and stock restored.");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  function openCreate() {
    setCustomerId("");
    setLines([{ ...blankLine }]);
    setFormError("");
    setCreateOpen(true);
  }

  function updateLine(index, patch) {
    setLines((current) => current.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((current) => [...current, { ...blankLine }]);
  }

  function removeLine(index) {
    setLines((current) => current.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    setFormError("");
    if (!customerId) return setFormError("Please select a customer.");
    const items = lines
      .filter((l) => l.product_id && Number(l.quantity) > 0)
      .map((l) => ({ product_id: Number(l.product_id), quantity: Number(l.quantity) }));
    if (items.length === 0) return setFormError("Add at least one product with a quantity.");

    createMutation.mutate({ customer_id: Number(customerId), items });
  }

  function handleCancel(order) {
    if (window.confirm(`Cancel order #${order.id}? Stock will be restored.`)) {
      cancelMutation.mutate(order.id);
    }
  }

  const orders = ordersQuery.data ?? [];
  const noCustomers = (customersQuery.data ?? []).length === 0;
  const noProducts = (productsQuery.data ?? []).length === 0;

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Create orders and track what's been sold."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create order
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {ordersQuery.isLoading ? (
          <Spinner />
        ) : ordersQuery.isError ? (
          <ErrorState
            message={getErrorMessage(ordersQuery.error)}
            onRetry={ordersQuery.refetch}
          />
        ) : orders.length === 0 ? (
          <EmptyState title="No orders yet" hint="Create your first order to see it here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 text-right font-medium">Items</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-3">
                      <CodeChip>#{o.id}</CodeChip>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {customerById[o.customer_id]?.full_name ?? `Customer #${o.customer_id}`}
                    </td>
                    <td className="nums px-4 py-3 text-right text-zinc-600">{o.items.length}</td>
                    <td className="nums px-4 py-3 text-right font-medium text-zinc-900">
                      {formatMoney(o.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewing(o)}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleCancel(o)}>
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create order modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create order">
        {noCustomers || noProducts ? (
          <p className="text-sm text-zinc-600">
            You need at least one customer and one product before creating an order.
          </p>
        ) : (
          <div className="space-y-4">
            <Field label="Customer">
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Select a customer…</option>
                {customersQuery.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </Select>
            </Field>

            <div>
              <span className="mb-1 block text-sm font-medium text-zinc-700">Items</span>
              <div className="space-y-2">
                {lines.map((line, index) => {
                  const product = productById[line.product_id];
                  return (
                    <div key={index} className="flex items-start gap-2">
                      <div className="flex-1">
                        <Select
                          value={line.product_id}
                          onChange={(e) => updateLine(index, { product_id: e.target.value })}
                        >
                          <option value="">Select product…</option>
                          {productsQuery.data.map((p) => (
                            <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                              {p.name} ({p.quantity} in stock)
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          min="1"
                          max={product?.quantity ?? undefined}
                          value={line.quantity}
                          onChange={(e) => updateLine(index, { quantity: e.target.value })}
                        />
                      </div>
                      <button
                        onClick={() => removeLine(index)}
                        disabled={lines.length === 1}
                        className="mt-2 text-zinc-400 hover:text-rose-600 disabled:opacity-30"
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={addLine}
                className="mt-2 text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                + Add another item
              </button>
            </div>

            {/* Live preview — backend recomputes the real total on submit. */}
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
              <span className="text-sm text-zinc-500">Estimated total</span>
              <span className="nums text-base font-semibold text-zinc-900">
                {formatMoney(previewTotal)}
              </span>
            </div>

            {formError && <p className="text-sm text-rose-600">{formError}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={createMutation.isPending}>
                Create order
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Order details modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Order #${viewing?.id}`}>
        {viewing && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Customer</span>
              <span className="font-medium text-zinc-900">
                {customerById[viewing.customer_id]?.full_name ??
                  `Customer #${viewing.customer_id}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Date</span>
              <span className="text-zinc-700">{formatDate(viewing.created_at)}</span>
            </div>

            <div className="rounded-lg border border-zinc-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-3 py-2 font-medium">Product</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">Unit price</th>
                    <th className="px-3 py-2 text-right font-medium">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {viewing.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-zinc-900">
                        {productById[item.product_id]?.name ?? `Product #${item.product_id}`}
                      </td>
                      <td className="nums px-3 py-2 text-right text-zinc-700">{item.quantity}</td>
                      <td className="nums px-3 py-2 text-right text-zinc-700">
                        {formatMoney(item.unit_price)}
                      </td>
                      <td className="nums px-3 py-2 text-right text-zinc-900">
                        {formatMoney(Number(item.unit_price) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
              <span className="font-medium text-zinc-700">Total</span>
              <span className="nums text-lg font-semibold text-zinc-900">
                {formatMoney(viewing.total_amount)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
