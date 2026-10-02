import { useState } from "react";
import { apiFetch } from "@/config/apiConfig";

export function useTableCreate(fetchTables: any, setSelectedTable: any, toast: any) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newColumns, setNewColumns] = useState([
    { name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: false, defaultValue: '' }
  ]);
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  async function handleCreateTable() {
    if (!newTableName) return;
    setIsSubmittingTable(true);
    try {
      const formattedCols = newColumns.map(col => ({
        name: col.name,
        type: col.type,
        primaryKey: col.primaryKey,
        nullable: col.nullable,
        unique: col.unique,
        defaultValue: col.defaultValue
      }));

      const res = await apiFetch('/api/system/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName: newTableName, columns: formattedCols })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
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

  return {
    isCreating, setIsCreating,
    newTableName, setNewTableName,
    newColumns, setNewColumns,
    isSubmittingTable,
    handleCreateTable,
    addColumnDef
  };
}
