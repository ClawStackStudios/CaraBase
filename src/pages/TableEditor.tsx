import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash, DatabaseZap, Search, Table2 } from "lucide-react";
import { apiFetch } from "@/config/apiConfig";

export default function TableEditor() {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Table Form
  const [isCreating, setIsCreating] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newColumns, setNewColumns] = useState([{ name: 'id', type: 'INTEGER', primaryKey: true, nullable: false }]);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  async function fetchTables() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/system/tables');
      const data = await res.json();
      setTables(data);
      if (data.length > 0 && !selectedTable) setSelectedTable(data[0].name);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTableData(tableName: string) {
    try {
      const colsRes = await apiFetch(`/api/system/tables/${tableName}/columns`);
      setColumns(await colsRes.json());
      const rowsRes = await apiFetch(`/api/system/tables/${tableName}/rows`);
      setRows(await rowsRes.json());
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateTable() {
    if (!newTableName) return;
    try {
      await apiFetch('/api/system/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName: newTableName, columns: newColumns })
      });
      setNewTableName("");
      fetchTables();
      setSelectedTable(newTableName);
    } catch (err) {
      console.error(err);
      alert('Failed to create table: ' + (err as Error).message);
    } finally {
      setIsCreating(false);
    }
  }

  function addColumnDef() {
    setNewColumns([...newColumns, { name: '', type: 'TEXT', primaryKey: false, nullable: true }]);
  }

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Table Editor</h1>
          <p className="text-sm text-slate-500">Create tables and view database records.</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Table
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="mb-6 border-blue-200 shadow-sm border bg-blue-50/30">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Create New Table</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Table Name</label>
                <Input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder="e.g., users, posts, products" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block">Columns</label>
                {newColumns.map((col, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input 
                      placeholder="Column name" 
                      value={col.name} 
                      onChange={(e) => {
                        const newC = [...newColumns];
                        newC[idx].name = e.target.value;
                        setNewColumns(newC);
                      }} 
                    />
                    <select 
                      className="flex h-9 w-40 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm"
                      value={col.type}
                      onChange={(e) => {
                        const newC = [...newColumns];
                        newC[idx].type = e.target.value;
                        setNewColumns(newC);
                      }}
                    >
                      <option value="TEXT">TEXT</option>
                      <option value="INTEGER">INTEGER</option>
                      <option value="REAL">REAL</option>
                      <option value="BOOLEAN">BOOLEAN</option>
                      <option value="JSON">JSON</option>
                    </select>
                    {idx > 0 && (
                       <Button variant="ghost" size="sm" onClick={() => setNewColumns(newColumns.filter((_, i) => i !== idx))}>
                         <Trash className="h-4 w-4 text-slate-500 hover:text-red-600" />
                       </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addColumnDef} className="mt-2 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add Column
                </Button>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreateTable}>Create Table</Button>
                <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex-1 flex gap-6 overflow-hidden min-h-[500px]">
        {/* Table List Sidebar */}
        <div className="w-64 bg-white border border-slate-200 rounded-lg overflow-y-auto shadow-sm">
          <div className="p-3 border-b border-slate-100 flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tables..." 
              className="text-sm w-full outline-none bg-transparent"
            />
          </div>
          <div className="p-2 space-y-1">
            {tables.map(t => (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t.name)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2 transition-colors ${selectedTable === t.name ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Table2 className="h-4 w-4 opacity-70" />
                {t.name}
              </button>
            ))}
            {tables.length === 0 && !loading && (
              <p className="text-sm text-slate-500 p-4 text-center">No tables yet.</p>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
          {selectedTable ? (
            <>
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-2">
                    <DatabaseZap className="h-4 w-4 text-slate-500" />
                    <h3 className="font-medium text-slate-800">{selectedTable}</h3>
                 </div>
                 <Button variant="outline" size="sm">Insert Row</Button>
              </div>
              <div className="overflow-auto flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 sticky top-0 border-b border-slate-200">
                    <tr>
                      {columns.map(col => (
                        <th key={col.name} className="px-4 py-3 font-medium whitespace-nowrap">
                           <div className="flex items-center gap-1">
                             {col.name} 
                             <span className="text-[10px] text-slate-400 font-normal uppercase">{col.type}</span>
                           </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={Math.max(columns.length, 1)} className="px-4 py-8 text-center text-slate-500">
                          No rows found in this table.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, i) => (
                        <tr key={i} className="border-b last:border-0 border-slate-100 hover:bg-slate-50/50">
                          {columns.map(col => (
                            <td key={col.name} className="px-4 py-2 text-slate-700 truncate max-w-[200px]">
                              {row[col.name] !== null ? String(row[col.name]) : <span className="text-slate-400 italic">null</span>}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 flex-col">
              <Table2 className="h-12 w-12 text-slate-200 mb-4" />
              <p>Select a table to view its data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
