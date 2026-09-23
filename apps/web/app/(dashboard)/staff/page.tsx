"use client";
import { useMemo, useState } from "react";
import { Plus, Users, ChevronLeft, ChevronRight, Wallet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { useProperty } from "@/features/properties/hooks";
import {
  useStaff, useCreateStaff, useUpdateStaff, useArchiveStaff,
  useAttendanceMonth, useUpsertAttendance, useDeleteAttendance,
  useSalary, useRecordSalary,
} from "@/features/staff/hooks";
import type { Staff, AttendanceStatus } from "@/features/staff/types";
import { formatCurrency, monthName } from "@/lib/utils";

export default function StaffPage() {
  const { property } = useProperty();
  const propertyId = property?.id ?? "";
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [staffOpen, setStaffOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceStaff, setAttendanceStaff] = useState<Staff | null>(null);
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>("present");
  const [attendanceNote, setAttendanceNote] = useState("");
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [salaryStaff, setSalaryStaff] = useState<Staff | null>(null);

  const { data: staff = [], isLoading } = useStaff(propertyId);
  const { data: attendance = [] } = useAttendanceMonth(propertyId, month, year);
  const del = useArchiveStaff(propertyId);
  const clearAttendance = useDeleteAttendance(propertyId);
  const upsertAttendance = useUpsertAttendance(propertyId);

  // Map: staff_id → date → attendance
  const attMap = useMemo(() => {
    const m = new Map<string, Map<string, any>>();
    attendance.forEach((a) => {
      if (!m.has(a.staff_id)) m.set(a.staff_id, new Map());
      m.get(a.staff_id)!.set(a.attendance_date, a);
    });
    return m;
  }, [attendance]);

  // Days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function dayStats(staffId: string) {
    let present = 0, absent = 0, half = 0;
    const m = attMap.get(staffId);
    if (!m) return { present, absent, half };
    m.forEach((a) => {
      if (a.status === "present") present++;
      else if (a.status === "absent") absent++;
      else if (a.status === "half_day") half++;
    });
    return { present, absent, half };
  }

  if (!propertyId) return <div className="text-muted-foreground">Loading property…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Staff Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Track daily attendance and salary for kamwali, cleaners, and other staff
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{monthName(m)}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button onClick={() => { setEditing(null); setStaffOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Staff
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-40 bg-muted rounded animate-pulse" />
      ) : !staff.length ? (
        <EmptyState
          icon={Users}
          title="No staff yet"
          description="Add kamwali, cleaners, or other employees to track attendance."
          action={
            <Button onClick={() => { setEditing(null); setStaffOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Staff
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {staff.map((s) => {
            const stats = dayStats(s.id);
            return (
              <Card key={s.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {s.role ?? "Staff"} · ₹{s.monthly_salary.toLocaleString("en-IN")}/month
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="success">Present: {stats.present}</Badge>
                    <Badge variant="destructive">Absent: {stats.absent}</Badge>
                    {stats.half > 0 && <Badge variant="warning">Half: {stats.half}</Badge>}
                    <Button size="sm" variant="outline" onClick={() => { setEditing(s); setStaffOpen(true); }}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSalaryStaff(s);
                        setSalaryOpen(true);
                      }}
                    >
                      <Wallet className="h-3.5 w-3.5 mr-1" /> Salary
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => del.mutate(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="flex gap-1 min-w-max pb-2">
                      {days.map((d) => {
                        const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                        const a = attMap.get(s.id)?.get(date);
                        const status = a?.status;
                        const bg =
                          status === "present" ? "bg-green-100 border-green-300 text-green-800" :
                          status === "absent" ? "bg-red-100 border-red-300 text-red-800" :
                          status === "half_day" ? "bg-amber-100 border-amber-300 text-amber-800" :
                          status === "leave" ? "bg-blue-100 border-blue-300 text-blue-800" :
                          status === "holiday" ? "bg-purple-100 border-purple-300 text-purple-800" :
                          "bg-muted border-border text-muted-foreground";
                        return (
                          <button
                            key={d}
                            onClick={() => {
                              setAttendanceStaff(s);
                              setAttendanceDate(date);
                              setAttendanceStatus((status as AttendanceStatus) || "present");
                              setAttendanceNote(a?.note ?? "");
                              setAttendanceOpen(true);
                            }}
                            title={a?.note ?? ""}
                            className={`w-9 h-11 rounded border text-xs font-medium ${bg} hover:opacity-80 transition relative`}
                          >
                            {d}
                            {a?.note && (
                              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <StaffFormDialog
        open={staffOpen}
        onOpenChange={setStaffOpen}
        propertyId={propertyId}
        editing={editing}
      />

      <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {attendanceStaff?.name} — {attendanceDate}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-1">
              {(["present","absent","half_day","leave","holiday"] as AttendanceStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => setAttendanceStatus(st)}
                  className={`py-2 rounded text-xs font-medium border transition ${
                    attendanceStatus === st
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted/40"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <Label>Note (optional)</Label>
              <Textarea
                rows={2}
                value={attendanceNote}
                onChange={(e) => setAttendanceNote(e.target.value)}
                placeholder="e.g. 2nd floor not cleaned"
              />
            </div>

            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                className="text-destructive"
                onClick={async () => {
                  if (!attendanceStaff) return;
                  await clearAttendance.mutateAsync({ staffId: attendanceStaff.id, date: attendanceDate });
                  setAttendanceOpen(false);
                }}
              >
                Clear
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAttendanceOpen(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!attendanceStaff) return;
                    await upsertAttendance.mutateAsync({
                      staff_id: attendanceStaff.id,
                      attendance_date: attendanceDate,
                      status: attendanceStatus,
                      note: attendanceNote || null,
                    });
                    setAttendanceOpen(false);
                  }}
                  disabled={upsertAttendance.isPending}
                >
                  {upsertAttendance.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {salaryStaff && (
        <SalaryDialog
          open={salaryOpen}
          onOpenChange={(o) => { setSalaryOpen(o); if (!o) setSalaryStaff(null); }}
          staff={salaryStaff}
          propertyId={propertyId}
        />
      )}
    </div>
  );
}

function StaffFormDialog({
  open, onOpenChange, propertyId, editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  propertyId: string;
  editing: Staff | null;
}) {
  const create = useCreateStaff(propertyId);
  const update = useUpdateStaff(propertyId);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [salary, setSalary] = useState("");
  const [joining, setJoining] = useState("");

  useState(() => {
    if (open) {
      setName(editing?.name ?? "");
      setRole(editing?.role ?? "");
      setPhone(editing?.phone ?? "");
      setSalary(editing ? String(editing.monthly_salary) : "");
      setJoining(editing?.joining_date ?? "");
    }
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    const payload = {
      property_id: propertyId,
      name,
      role: role || null,
      phone: phone || null,
      monthly_salary: Number(salary || 0),
      joining_date: joining || null,
    };
    if (editing) await update.mutateAsync({ id: editing.id, patch: payload });
    else await create.mutateAsync(payload);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Staff" : "Add Staff"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Role</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Cleaner / Kamwali" />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Monthly Salary (₹)</Label>
              <Input type="number" min={0} step="0.01" value={salary} onChange={(e) => setSalary(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Joining Date</Label>
              <Input type="date" value={joining} onChange={(e) => setJoining(e.target.value)} />
            </div>
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

function SalaryDialog({
  open, onOpenChange, staff, propertyId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  staff: Staff;
  propertyId: string;
}) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [present, setPresent] = useState(0);
  const [absent, setAbsent] = useState(0);
  const [half, setHalf] = useState(0);
  const [amount, setAmount] = useState(String(staff.monthly_salary));
  const [notes, setNotes] = useState("");
  const record = useRecordSalary(propertyId, staff.id);

  // Auto-compute from attendance
  useMemo(() => {
    // Handled by parent fetch; here we just let user fill manually
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await record.mutateAsync({
      staff_id: staff.id,
      month, year,
      present_days: present,
      absent_days: absent,
      half_days: half,
      amount: Number(amount || 0),
      paid_date: new Date().toISOString().slice(0, 10),
      payment_method: "cash",
      notes: notes || null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Salary — {staff.name}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Month</Label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{monthName(m)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Present</Label>
              <Input type="number" value={present} onChange={(e) => setPresent(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Absent</Label>
              <Input type="number" value={absent} onChange={(e) => setAbsent(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Half Days</Label>
              <Input type="number" value={half} onChange={(e) => setHalf(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Amount (₹)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={record.isPending}>
              {record.isPending ? "Saving…" : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
