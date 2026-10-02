import { useState } from "react";
import { apiFetch } from "@/config/apiConfig";

export function useTableData(
  selectedTable: string | null,
  pkName: string,
  rows: any[],
  setRows: React.Dispatch<React.SetStateAction<any[]>>,
  columns: any[],
  page: number,
  fetchTableData: any,
  toast: any
) {
  const [rowToDelete, setRowToDelete] = useState<any | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeletingRow, setIsDeletingRow] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"insert" | "edit">("insert");
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [drawerSubmitting, setDrawerSubmitting] = useState(false);

  function triggerDeleteRow(row: any, e: React.MouseEvent) {
    e.stopPropagation();
    setRowToDelete(row);
    setIsConfirmOpen(true);
  }

  async function confirmDeleteRow() {
    if (!rowToDelete || !selectedTable) return;

    const pkVal = rowToDelete[pkName];
    const previousRows = [...rows];
    setRows(rows.filter(r => r[pkName] !== pkVal));
    setIsConfirmOpen(false);
    setIsDeletingRow(true);

    try {
      const res = await apiFetch(`/rest/v1/${selectedTable}?${pkName}=eq.${pkVal}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(await res.text());
      setRowToDelete(null);
      toast.success('Row deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Delete failed: ' + (err as Error).message);
      setRows(previousRows);
    } finally {
      setIsDeletingRow(false);
    }
  }

  function openInsertDrawer() {
    setDrawerMode("insert");
    setEditingRow(null);
    setDrawerError(null);
    setJsonErrors({});

    const initialForm: Record<string, any> = {};
    columns.forEach(col => {
      if (col.dflt_value !== null) {
        const rawDefault = col.dflt_value.startsWith("'") && col.dflt_value.endsWith("'")
          ? col.dflt_value.slice(1, -1)
          : col.dflt_value;
        initialForm[col.name] = rawDefault;
      } else if (col.type === "BOOLEAN") {
        initialForm[col.name] = false;
      } else {
        initialForm[col.name] = "";
      }
    });
    setFormData(initialForm);
    setIsDrawerOpen(true);
  }

  function openEditDrawer(row: any) {
    setDrawerMode("edit");
    setEditingRow(row);
    setDrawerError(null);
    setJsonErrors({});

    const initialForm: Record<string, any> = {};
    columns.forEach(col => {
      const val = row[col.name];
      if (col.type === "JSON" && val !== null) {
        initialForm[col.name] = typeof val === "object" ? JSON.stringify(val, null, 2) : val;
      } else {
        initialForm[col.name] = val !== null ? val : "";
      }
    });
    setFormData(initialForm);
    setIsDrawerOpen(true);
  }

  function handleInputChange(colName: string, val: any, type: string) {
    let finalVal = val;
    if (type === "JSON") {
      try {
        if (val.trim() === "") {
          setJsonErrors(prev => ({ ...prev, [colName]: "" }));
        } else {
          JSON.parse(val);
          setJsonErrors(prev => ({ ...prev, [colName]: "" }));
        }
      } catch (e) {
        setJsonErrors(prev => ({ ...prev, [colName]: "Invalid JSON format" }));
      }
    }
    setFormData(prev => ({ ...prev, [colName]: finalVal }));
  }

  async function submitDrawerForm(e: React.FormEvent) {
    e.preventDefault();
    if (Object.values(jsonErrors).some(err => err !== "")) {
      setDrawerError("Please correct all JSON syntax errors before submitting.");
      return;
    }

    setDrawerSubmitting(true);
    setDrawerError(null);

    const payload: Record<string, any> = {};
    columns.forEach(col => {
      const val = formData[col.name];
      if (col.pk && drawerMode === "insert" && (val === "" || val === undefined)) {
        return;
      }
      if (val === "" || val === null || val === undefined) {
        payload[col.name] = col.notnull ? (col.type === "INTEGER" || col.type === "REAL" ? 0 : "") : null;
      } else if (col.type === "INTEGER" || col.type === "REAL") {
        payload[col.name] = Number(val);
      } else if (col.type === "BOOLEAN") {
        payload[col.name] = val === true || val === "true" || val === 1 ? 1 : 0;
      } else if (col.type === "JSON") {
        try {
          payload[col.name] = JSON.parse(val);
        } catch {
          payload[col.name] = val;
        }
      } else {
        payload[col.name] = val;
      }
    });

    try {
      if (drawerMode === "insert") {
        const res = await apiFetch(`/rest/v1/${selectedTable}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const pkVal = editingRow[pkName];
        const updatePayload = { ...payload };
        delete updatePayload[pkName];

        const res = await apiFetch(`/rest/v1/${selectedTable}?${pkName}=eq.${pkVal}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });
        if (!res.ok) throw new Error(await res.text());
      }

      setIsDrawerOpen(false);
      fetchTableData(selectedTable!, page);
    } catch (err) {
      console.error(err);
      setDrawerError((err as Error).message);
    } finally {
      setDrawerSubmitting(false);
    }
  }

  return {
    rowToDelete, setRowToDelete,
    isConfirmOpen, setIsConfirmOpen,
    isDeletingRow, setIsDeletingRow,
    isDrawerOpen, setIsDrawerOpen,
    drawerMode, setDrawerMode,
    editingRow, setEditingRow,
    formData, setFormData,
    jsonErrors, setJsonErrors,
    drawerError, setDrawerError,
    drawerSubmitting, setDrawerSubmitting,
    triggerDeleteRow,
    confirmDeleteRow,
    openInsertDrawer,
    openEditDrawer,
    handleInputChange,
    submitDrawerForm
  };
}
