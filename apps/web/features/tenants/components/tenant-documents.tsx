"use client";
import { useRef, useState } from "react";
import { Upload, Trash2, FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTenantDocuments, useUploadTenantDocument, useDeleteTenantDocument } from "../hooks";
import { getTenantDocumentSignedUrl } from "../api";
import { TENANT_DOC_TYPES, type TenantDocument } from "../types";

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];

const LABELS: Record<string, string> = {
  aadhaar: "Aadhaar Card",
  pan: "PAN Card",
  driving_licence: "Driving Licence",
  other_id: "Other ID",
  agreement: "Agreement",
  other: "Other",
};

export function TenantDocuments({
  tenantId,
  propertyId,
}: {
  tenantId: string;
  propertyId: string;
}) {
  const { data: docs = [], isLoading } = useTenantDocuments(tenantId);
  const upload = useUploadTenantDocument(propertyId, tenantId);
  const del = useDeleteTenantDocument(tenantId);
  const [docType, setDocType] = useState<string>("aadhaar");
  const [toDelete, setToDelete] = useState<TenantDocument | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!ACCEPTED.includes(file.type)) { alert(`${file.name}: unsupported type`); continue; }
      if (file.size > MAX_SIZE) { alert(`${file.name}: too large (max 10 MB)`); continue; }
      await upload.mutateAsync({ file, docType });
    }
  }

  async function openDoc(doc: TenantDocument, download = false) {
    try {
      const url = await getTenantDocumentSignedUrl(doc.storage_path, 60);
      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.original_filename ?? "document";
        a.click();
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (e: any) {
      alert("Could not open document: " + e.message);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents</CardTitle>
        <div className="flex items-center gap-2">
          <div className="space-y-1">
            <Label className="sr-only">Document type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TENANT_DOC_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
            <Upload className="h-4 w-4 mr-1" /> {upload.isPending ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
        ) : !docs.length ? (
          <EmptyState
            icon={FileText}
            title="No documents uploaded"
            description="Upload Aadhaar, PAN, agreements and other tenant documents. Files are stored privately."
            action={<Button size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 mr-1" /> Upload Document</Button>}
          />
        ) : (
          <div className="divide-y">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{LABELS[d.doc_type] ?? d.doc_type}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                      {d.original_filename ?? d.storage_path.split("/").pop()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openDoc(d)} title="Preview">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openDoc(d, true)} title="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setToDelete(d)} title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete document?"
        description="This will permanently remove the file from storage."
        confirmLabel="Delete"
        onConfirm={async () => { if (toDelete) await del.mutateAsync(toDelete); setToDelete(null); }}
      />
    </Card>
  );
}