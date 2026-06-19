import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { customersApi } from "../api/customers";
import { getErrorMessage } from "../api/client";
import { useToast } from "../hooks/useToast";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Field, Input } from "../components/ui/Field";
import { Spinner, ErrorState, EmptyState } from "../components/ui/States";

const empty = { full_name: "", email: "", phone: "" };

function validate(form) {
  const e = {};
  if (!form.full_name.trim()) e.full_name = "Full name is required.";
  // Simple email shape check; the backend validates strictly too.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
  if (!form.phone.trim()) e.phone = "Phone number is required.";
  return e;
}

export default function Customers() {
  const qc = useQueryClient();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  const { data: customers, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["customers"],
    queryFn: customersApi.list,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["customers"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => customersApi.create(payload),
    onSuccess: () => {
      toast.success("Customer added.");
      invalidate();
      setModalOpen(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => customersApi.remove(id),
    onSuccess: () => {
      toast.success("Customer deleted.");
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  function openAdd() {
    setForm(empty);
    setErrors({});
    setModalOpen(true);
  }

  function handleSubmit() {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    createMutation.mutate({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
  }

  function handleDelete(customer) {
    if (window.confirm(`Delete "${customer.full_name}"?`)) {
      deleteMutation.mutate(customer.id);
    }
  }

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="People who place orders."
        action={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add customer
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
        ) : customers.length === 0 ? (
          <EmptyState title="No customers yet" hint="Add a customer before creating orders." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-3 font-medium text-zinc-900">{c.full_name}</td>
                    <td className="px-4 py-3 text-zinc-600">{c.email}</td>
                    <td className="nums px-4 py-3 text-zinc-600">{c.phone}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(c)}>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add customer">
        <div className="space-y-4">
          <Field label="Full name" error={errors.full_name}>
            <Input
              value={form.full_name}
              error={errors.full_name}
              placeholder="e.g. Rahul Sharma"
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </Field>
          <Field label="Email address" error={errors.email}>
            <Input
              type="email"
              value={form.email}
              error={errors.email}
              placeholder="e.g. rahul@example.com"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Phone number" error={errors.phone}>
            <Input
              value={form.phone}
              error={errors.phone}
              placeholder="e.g. +91 98765 43210"
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending}>
              Add customer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
