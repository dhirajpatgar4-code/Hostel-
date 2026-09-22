"use client";
import { useState } from "react";
import { Plus, Phone, Settings, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useProperty } from "@/features/properties/hooks";
import {
  useContacts, useCreateContact, useUpdateContact, useDeleteContact,
  useContactCategories, useCreateContactCategory, useDeleteContactCategory,
} from "@/features/tasks/hooks";
import { formatDate } from "@/lib/utils";
import type { ContactWithCategory } from "@/features/tasks/api";

export default function ContactsPage() {
  const { property } = useProperty();
  const propertyId = property?.id ?? "";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContactWithCategory | null>(null);
  const [toDelete, setToDelete] = useState<ContactWithCategory | null>(null);
  const [catOpen, setCatOpen] = useState(false);

  const { data: contacts = [], isLoading } = useContacts(propertyId, {
    search: search || undefined,
    categoryId: categoryFilter || undefined,
  });
  const del = useDeleteContact(propertyId);
  const { data: categories = [] } = useContactCategories(propertyId);

  function callContact(phone: string | null) {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  }

  function whatsapp(phone: string | null) {
    if (!phone) return;
    const clean = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${clean}`, "_blank", "noopener,noreferrer");
  }

  const columns: Column<ContactWithCategory>[] = [
    { key: "name", header: "Name", cell: (c) => <span className="font-medium">{c.name}</span> },
    { key: "cat", header: "Category", cell: (c) => c.category_name ?? "—" },
    { key: "phone", header: "Phone", cell: (c) => <span className="font-mono text-sm">{c.phone ?? "—"}</span> },
    {
      key: "actions",
      header: "",
      cell: (c) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {c.phone && (
            <>
              <Button size="sm" variant="ghost" onClick={() => callContact(c.phone)}>
                <Phone className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => whatsapp(c.phone)}>
                <MessageCircle className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setFormOpen(true); }}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => setToDelete(c)}>Delete</Button>
        </div>
      ),
    },
  ];

  if (!propertyId) return <div className="text-muted-foreground">Loading property…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-sm text-muted-foreground">Phone directory — electricians, plumbers, etc.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatOpen(true)}>
            <Settings className="h-4 w-4 mr-1" /> Categories
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Contact
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : !contacts.length ? (
            <EmptyState
              icon={Phone}
              title={search ? "No contacts match" : "No contacts yet"}
              description={search ? "Try another keyword." : "Add electrician, plumber, cleaner and other contacts."}
              action={
                !search && (
                  <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Add Contact
                  </Button>
                )
              }
            />
          ) : (
            <DataTable columns={columns} rows={contacts} pageSize={25} emptyState={<EmptyState title="No contacts" />} />
          )}
        </CardContent>
      </Card>

      <ContactFormDialog open={formOpen} onOpenChange={setFormOpen} propertyId={propertyId} editing={editing} />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete ${toDelete?.name}?`}
        description="This contact will be removed permanently."
        confirmLabel="Delete"
        onConfirm={async () => { if (toDelete) await del.mutateAsync(toDelete.id); setToDelete(null); }}
      />

      <CategoryManager
        open={catOpen}
        onOpenChange={setCatOpen}
        propertyId={propertyId}
        categories={categories}
      />
    </div>
  );
}

function ContactFormDialog({
  open, onOpenChange, propertyId, editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  propertyId: string;
  editing: ContactWithCategory | null;
}) {
  const create = useCreateContact(propertyId);
  const update = useUpdateContact(propertyId);
  const { data: categories = [] } = useContactCategories(propertyId);

  const [name, setName] = useState(editing?.name ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(editing?.whatsapp ?? "");
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? "");
  const [address, setAddress] = useState(editing?.address ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");

  useState(() => {
    if (open) {
      setName(editing?.name ?? "");
      setPhone(editing?.phone ?? "");
      setWhatsapp(editing?.whatsapp ?? "");
      setCategoryId(editing?.category_id ?? "");
      setAddress(editing?.address ?? "");
      setNotes(editing?.notes ?? "");
    }
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    const payload = {
      property_id: propertyId,
      name,
      phone: phone || null,
      whatsapp: whatsapp || null,
      category_id: categoryId || null,
      address: address || null,
      notes: notes || null,
    };
    if (editing) {
      await update.mutateAsync({ id: editing.id, patch: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Contact" : "Add Contact"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" />
            </div>
            <div className="space-y-1">
              <Label>WhatsApp</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Category</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name || create.isPending || update.isPending}>
              {create.isPending || update.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryManager({
  open, onOpenChange, propertyId, categories,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  propertyId: string;
  categories: { id: string; name: string; is_system: boolean }[];
}) {
  const create = useCreateContactCategory(propertyId);
  const del = useDeleteContactCategory(propertyId);
  const [name, setName] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Contact Categories</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category" />
            <Button
              onClick={async () => {
                if (!name) return;
                await create.mutateAsync({ property_id: propertyId, name });
                setName("");
              }}
              disabled={!name || create.isPending}
            >
              Add
            </Button>
          </div>
          <div className="divide-y border rounded">
            {categories.map((c) => (
              <div key={c.id} className="flex justify-between items-center p-3">
                <span className="text-sm">
                  {c.name}
                  {c.is_system && <span className="text-xs text-muted-foreground ml-2">(default)</span>}
                </span>
                {!c.is_system && (
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del.mutate(c.id)}>
                    Delete
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
