import { useState } from "react";
import { apiFetch } from "@/config/apiConfig";

export function useTableSchema(selectedTable: string | null, fetchTableData: any, page: number, fetchSchemaData: any, toast: any) {
  const [colToAdd, setColToAdd] = useState({ name: "", type: "TEXT", notNull: false, defaultValue: "" });
  const [colAddError, setColAddError] = useState<string | null>(null);
  const [isSubmittingColumn, setIsSubmittingColumn] = useState(false);

  const [colToDelete, setColToDelete] = useState<string | null>(null);
  const [isDropColConfirmOpen, setIsDropColConfirmOpen] = useState(false);
  const [isDroppingColumn, setIsDroppingColumn] = useState(false);

  const [indexForm, setIndexForm] = useState({ name: "", column: "", unique: false });
  const [isSubmittingIndex, setIsSubmittingIndex] = useState(false);

  const [indexToDelete, setIndexToDelete] = useState<string | null>(null);
  const [isDropIndexConfirmOpen, setIsDropIndexConfirmOpen] = useState(false);
  const [isDroppingIndex, setIsDroppingIndex] = useState(false);

  const [fkForm, setFkForm] = useState({ localCol: "", foreignTable: "", foreignCol: "", onDelete: "RESTRICT", onUpdate: "RESTRICT" });
  const [isSubmittingFK, setIsSubmittingFK] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  async function handleAddColumnToSchema(e: React.FormEvent) {
    e.preventDefault();
    setColAddError(null);
    if (!colToAdd.name || !selectedTable) return;

    const safeColName = colToAdd.name.replace(/[^a-zA-Z0-9_]/g, '');
    if (!safeColName) {
      setColAddError("Invalid column name.");
      return;
    }

    let query = `ALTER TABLE ${selectedTable} ADD COLUMN ${safeColName} ${colToAdd.type}`;
    if (colToAdd.notNull) {
      query += ` NOT NULL`;
    }
    if (colToAdd.defaultValue) {
      const escapedDefault = colToAdd.defaultValue.replace(/'/g, "''");
      query += ` DEFAULT '${escapedDefault}'`;
    } else if (colToAdd.notNull) {
      setColAddError("A default value is required when adding a NOT NULL column to an existing table.");
      return;
    }

    setIsSubmittingColumn(true);
    try {
      const res = await apiFetch('/api/system/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, method: 'run' })
      });
      if (!res.ok) throw new Error(await res.text());

      setColToAdd({ name: "", type: "TEXT", notNull: false, defaultValue: "" });
      toast.success(`Column ${safeColName} added successfully`);
      fetchTableData(selectedTable!, page);
    } catch (err) {
      console.error(err);
      setColAddError((err as Error).message);
    } finally {
      setIsSubmittingColumn(false);
    }
  }

  function triggerDropColumn(colName: string, columns: any[]) {
    const colObj = columns.find(c => c.name === colName);
    if (colObj && colObj.pk === 1) {
      toast.error("Dropping PRIMARY KEY columns is not permitted to preserve database integrity.");
      return;
    }
    setColToDelete(colName);
    setIsDropColConfirmOpen(true);
  }

  async function confirmDropColumn() {
    if (!colToDelete || !selectedTable) return;
    setIsDropColConfirmOpen(false);
    setIsDroppingColumn(true);

    const query = `ALTER TABLE ${selectedTable} DROP COLUMN ${colToDelete}`;

    try {
      const res = await apiFetch('/api/system/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, method: 'run' })
      });
      if (!res.ok) throw new Error(await res.text());
      setColToDelete(null);
      toast.success(`Column dropped successfully`);
      fetchTableData(selectedTable!, page);
    } catch (err) {
      console.error(err);
      toast.error('Drop column failed: ' + (err as Error).message);
    } finally {
      setIsDroppingColumn(false);
    }
  }

  async function handleAddIndex(e: React.FormEvent) {
    e.preventDefault();
    setSchemaError(null);
    if (!indexForm.name || !indexForm.column || !selectedTable) return;

    setIsSubmittingIndex(true);
    try {
      const res = await apiFetch(`/api/system/tables/${selectedTable}/indexes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indexName: indexForm.name, columnName: indexForm.column, isUnique: indexForm.unique })
      });
      if (!res.ok) throw new Error(await res.text());
      setIndexForm({ name: "", column: "", unique: false });
      toast.success("Index created successfully");
      fetchTableData(selectedTable!, page);
      fetchSchemaData(selectedTable!);
    } catch (err) {
      console.error(err);
      setSchemaError((err as Error).message);
    } finally {
      setIsSubmittingIndex(false);
    }
  }

  function triggerDropIndex(idxName: string) {
    setIndexToDelete(idxName);
    setIsDropIndexConfirmOpen(true);
  }

  async function confirmDropIndex() {
    if (!indexToDelete || !selectedTable) return;
    setIsDropIndexConfirmOpen(false);
    setIsDroppingIndex(true);

    try {
      const res = await apiFetch(`/api/system/tables/${selectedTable}/indexes/${indexToDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setIndexToDelete(null);
      toast.success(`Index dropped successfully`);
      fetchTableData(selectedTable!, page);
      fetchSchemaData(selectedTable!);
    } catch (err) {
      console.error(err);
      toast.error('Drop index failed: ' + (err as Error).message);
    } finally {
      setIsDroppingIndex(false);
    }
  }

  async function handleAddFK(e: React.FormEvent) {
    e.preventDefault();
    setSchemaError(null);
    if (!fkForm.localCol || !fkForm.foreignTable || !fkForm.foreignCol || !selectedTable) return;

    setIsSubmittingFK(true);
    try {
      const res = await apiFetch(`/api/system/tables/${selectedTable}/fk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localColumn: fkForm.localCol,
          foreignTable: fkForm.foreignTable,
          foreignColumn: fkForm.foreignCol,
          onDelete: fkForm.onDelete,
          onUpdate: fkForm.onUpdate
        })
      });
      if (!res.ok) throw new Error(await res.text());
      setFkForm({ localCol: "", foreignTable: "", foreignCol: "", onDelete: "RESTRICT", onUpdate: "RESTRICT" });
      toast.success("Foreign Key added successfully");
      fetchTableData(selectedTable!, page);
      fetchSchemaData(selectedTable!);
    } catch (err) {
      console.error(err);
      setSchemaError((err as Error).message);
    } finally {
      setIsSubmittingFK(false);
    }
  }

  return {
    colToAdd, setColToAdd,
    colAddError,
    isSubmittingColumn,
    colToDelete, setColToDelete,
    isDropColConfirmOpen, setIsDropColConfirmOpen,
    isDroppingColumn,
    indexForm, setIndexForm,
    isSubmittingIndex,
    indexToDelete, setIndexToDelete,
    isDropIndexConfirmOpen, setIsDropIndexConfirmOpen,
    isDroppingIndex,
    fkForm, setFkForm,
    isSubmittingFK,
    schemaError,
    handleAddColumnToSchema,
    triggerDropColumn,
    confirmDropColumn,
    handleAddIndex,
    triggerDropIndex,
    confirmDropIndex,
    handleAddFK
  };
}
