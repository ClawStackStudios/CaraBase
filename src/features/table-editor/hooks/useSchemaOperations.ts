import { useState } from "react";
import { apiFetch } from "@/config/apiConfig";
import { useToast } from "@/context/ToastContext";

export function useSchemaOperations(
  selectedTable: string | null,
  fetchTableData: (table: string, page: number) => void,
  page: number,
  fetchTables: () => void,
  columns: any[],
  setSelectedTable: (table: string | null) => void
) {
  const toast = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newColumns, setNewColumns] = useState([
    { name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: false, defaultValue: '' }
  ]);
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

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

  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [isDropTableConfirmOpen, setIsDropTableConfirmOpen] = useState(false);
  const [isDroppingTable, setIsDroppingTable] = useState(false);

  async function handleCreateTable() {
    if (!newTableName) return;
    setIsSubmittingTable(true);
    try {
      const formattedCols = newColumns.map(col => ({
        name: col.name, type: col.type, primaryKey: col.primaryKey, nullable: col.nullable, unique: col.unique, defaultValue: col.defaultValue
      }));
      const res = await apiFetch('/api/system/tables', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName: newTableName, columns: formattedCols })
      });
      if (!res.ok) throw new Error(await res.text());
      setNewTableName("");
      setNewColumns([{ name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: false, defaultValue: '' }]);
      setIsCreating(false);
      toast.success(`Table ${newTableName} created successfully`);
      await fetchTables();
      setSelectedTable(newTableName);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create table: ' + (err as Error).message);
    } finally {
      setIsSubmittingTable(false);
    }
  }

  function addColumnDef() {
    setNewColumns([...newColumns, { name: '', type: 'TEXT', primaryKey: false, nullable: true, unique: false, defaultValue: '' }]);
  }

  async function handleAddColumnToSchema(e: React.FormEvent) {
    e.preventDefault();
    setColAddError(null);
    if (!colToAdd.name || !selectedTable) return;
    const safeColName = colToAdd.name.replace(/[^a-zA-Z0-9_]/g, '');
    if (!safeColName) return setColAddError("Invalid column name.");
    let query = `ALTER TABLE ${selectedTable} ADD COLUMN ${safeColName} ${colToAdd.type}`;
    if (colToAdd.notNull) query += ` NOT NULL`;
    if (colToAdd.defaultValue) {
      const escapedDefault = colToAdd.defaultValue.replace(/'/g, "''");
      query += ` DEFAULT '${escapedDefault}'`;
    } else if (colToAdd.notNull) {
      return setColAddError("A default value is required when adding a NOT NULL column to an existing table.");
    }
    setIsSubmittingColumn(true);
    try {
      const res = await apiFetch('/api/system/query', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, method: 'run' })
      });
      if (!res.ok) throw new Error(await res.text());
      setColToAdd({ name: "", type: "TEXT", notNull: false, defaultValue: "" });
      toast.success(`Column ${safeColName} added successfully`);
      fetchTableData(selectedTable, page);
    } catch (err) {
      console.error(err);
      setColAddError((err as Error).message);
    } finally {
      setIsSubmittingColumn(false);
    }
  }

  function triggerDropColumn(colName: string) {
    const colObj = columns.find(c => c.name === colName);
    if (colObj && colObj.pk === 1) return toast.error("Dropping PRIMARY KEY columns is not permitted to preserve database integrity.");
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, method: 'run' })
      });
      if (!res.ok) throw new Error(await res.text());
      setColToDelete(null);
      toast.success(`Column dropped successfully`);
      fetchTableData(selectedTable, page);
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indexName: indexForm.name, columnName: indexForm.column, isUnique: indexForm.unique })
      });
      if (!res.ok) throw new Error(await res.text());
      setIndexForm({ name: "", column: "", unique: false });
      toast.success("Index created successfully");
      fetchTableData(selectedTable, page);
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
      fetchTableData(selectedTable, page);
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localColumn: fkForm.localCol, foreignTable: fkForm.foreignTable, foreignColumn: fkForm.foreignCol, onDelete: fkForm.onDelete, onUpdate: fkForm.onUpdate
        })
      });
      if (!res.ok) throw new Error(await res.text());
      setFkForm({ localCol: "", foreignTable: "", foreignCol: "", onDelete: "RESTRICT", onUpdate: "RESTRICT" });
      toast.success("Foreign Key added successfully");
      fetchTableData(selectedTable, page);
    } catch (err) {
      console.error(err);
      setSchemaError((err as Error).message);
    } finally {
      setIsSubmittingFK(false);
    }
  }

  function triggerDropTable(tableName: string, e: React.MouseEvent) {
    e.stopPropagation();
    setTableToDelete(tableName);
    setIsDropTableConfirmOpen(true);
  }

  async function confirmDropTable() {
    if (!tableToDelete) return;
    setIsDroppingTable(true);
    setIsDropTableConfirmOpen(false);
    try {
      const res = await apiFetch(`/api/system/tables/${tableToDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`Table "${tableToDelete}" dropped successfully.`);
      if (selectedTable === tableToDelete) setSelectedTable(null);
      setTableToDelete(null);
      fetchTables();
    } catch (err) {
      console.error(err);
      toast.error('Drop table failed: ' + (err as Error).message);
    } finally {
      setIsDroppingTable(false);
    }
  }

  return {
    isCreating, setIsCreating,
    newTableName, setNewTableName,
    newColumns, setNewColumns,
    isSubmittingTable,
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
    tableToDelete, setTableToDelete,
    isDropTableConfirmOpen, setIsDropTableConfirmOpen,
    isDroppingTable,
    handleCreateTable, addColumnDef,
    handleAddColumnToSchema, triggerDropColumn, confirmDropColumn,
    handleAddIndex, triggerDropIndex, confirmDropIndex,
    handleAddFK,
    triggerDropTable, confirmDropTable
  };
}
