import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { productsApi } from "../api/products";
import { getErrorMessage } from "../api/client";
import { useToast } from "../hooks/useToast";
import { formatMoney } from "../lib";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Field, Input } from "../components/ui/Field";
import { Spinner, ErrorState, EmptyState, Badge, CodeChip } from "../components/ui/States";

const LOW_STOCK = 10;

const empty = { name: "", sku: "", price: "", quantity: "" };

function validate(form) {
  const e = {};
  if (!form.name.trim()) e.name = "Name is required.";
  if (!form.sku.trim()) e.sku = "SKU is required.";
  if (form.price === "" || Number(form.price) < 0) e.price = "Enter a price of 0 or more.";
  if (form.quantity === "" || !Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0)
    e.quantity = "Enter a whole number of 0 or more.";
  return e;
}

function stockBadge(qty) {
  if (qty === 0) return <Badge tone="danger">Out of stock</Badge>;
  if (qty <= LOW_STOCK) return <Badge tone="warning">Low</Badge>;
  return <Badge tone="success">In stock</Badge>;
}

export default function Products() {
  const qc = useQueryClient();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // product being edited, or null for "add"
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  const { data: products, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });

  // After any change, refresh both the product list and the dashboard counts.
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing ? productsApi.update(editing.id, payload) : productsApi.create(payload),
    onSuccess: () => {
      toast.success(editing ? "Product updated." : "Product added.");
      invalidate();
      closeModal();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productsApi.remove(id),
    onSuccess: () => {
      toast.success("Product deleted.");
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  function openAdd() {
    setEditing(null);
    setForm(empty);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantity: String(product.quantity),
    });
    setErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function handleSubmit() {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    saveMutation.mutate({
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
    });
  }

  function handleDelete(product) {
    if (window.confirm(`Delete "${product.name}"? This can't be undone.`)) {
      deleteMutation.mutate(product.id);
    }
  }

  return (
    <>
     <PageHeader
  title="Products"
  subtitle="Manage your catalogue and stock levels."
  action={
    <Button
      onClick={openAdd}
      className="
        px-5
        py-2.5
        shadow-md
        hover:shadow-lg
      "
    >
      <Plus className="h-4 w-4" />
      Add Product
    </Button>
  }
/>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
        ) : products.length === 0 ? (
          <EmptyState title="No products yet" hint="Add your first product to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-3 font-medium text-zinc-900">{p.name}</td>
                    <td className="px-4 py-3">
                      <CodeChip>{p.sku}</CodeChip>
                    </td>
                    <td className="nums px-4 py-3 text-right text-zinc-700">
                      {formatMoney(p.price)}
                    </td>
                    <td className="nums px-4 py-3 text-right text-zinc-700">{p.quantity}</td>
                    <td className="px-4 py-3">{stockBadge(p.quantity)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p)}>
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

      <Modal open={modalOpen} onClose={closeModal} title={editing ? "Edit product" : "Add product"}>
        <div className="space-y-4">
          <Field label="Product name" error={errors.name}>
            <Input
              value={form.name}
              error={errors.name}
              placeholder="e.g. Mechanical Keyboard"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="SKU / code" error={errors.sku}>
            <Input
              value={form.sku}
              error={errors.sku}
              placeholder="e.g. KB-100"
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price" error={errors.price}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                error={errors.price}
                placeholder="0.00"
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Field>
            <Field label="Quantity in stock" error={errors.quantity}>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.quantity}
                error={errors.quantity}
                placeholder="0"
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saveMutation.isPending}>
              {editing ? "Save changes" : "Add product"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
