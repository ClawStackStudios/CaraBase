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

  // Data Grid State
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [loadingRows, setLoadingRows] = useState(false);

  // New Table Form
  const [isCreating, setIsCreating] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newColumns, setNewColumns] = useState([{ name: 'id', type: 'INTEGER', primaryKey: true, nullable: false }]);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      setPage(1);
      fetchTableData(selectedTable, 1);
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

  async function fetchTableData(tableName: string, pageNum: number) {
    setLoadingRows(true);
    try {
      const colsRes = await apiFetch(`/api/system/tables/${tableName}/columns`);
      setColumns(await colsRes.json());
      const offset = (pageNum - 1) * pageSize;
      const rowsRes = await apiFetch(`/rest/v1/${tableName}?limit=${pageSize}&offset=${offset}`);
      setRows(await rowsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRows(false);
    }
  }

  function handleNextPage() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTableData(selectedTable!, nextPage);
  }

  function handlePrevPage() {
    if (page > 1) {
      const prevPage = page - 1;
      setPage(prevPage);
      fetchTableData(selectedTable!, prevPage);
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Table Editor</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create tables and view database records.</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Table
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="mb-6 border-blue-200 dark:border-blue-900 shadow-sm border bg-blue-50/30 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4 text-slate-900 dark:text-slate-100">Create New Table</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-slate-700 dark:text-slate-350">Table Name</label>
                <Input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder="e.g., users, posts, products" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block text-slate-700 dark:text-slate-350">Columns</label>
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
                      className="flex h-9 w-40 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-1 text-sm shadow-sm"
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
        <div className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-y-auto shadow-sm">
          <div className="p-3 border-b border-slate-100 dark:border-slate-850 flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search tables..." 
              className="text-sm w-full outline-none bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-550"
            />
          </div>
          <div className="p-2 space-y-1">
            {tables.map(t => (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t.name)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2 transition-colors border-0 cursor-pointer ${selectedTable === t.name ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
              >
                <Table2 className="h-4 w-4 opacity-70" />
                {t.name}
              </button>
            ))}
            {tables.length === 0 && !loading && (
              <p className="text-sm text-slate-500 dark:text-slate-450 p-4 text-center">No tables yet.</p>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm flex flex-col overflow-hidden">
          {selectedTable ? (
            <>
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
                 <div className="flex items-center gap-2">
                    <DatabaseZap className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <h3 className="font-medium text-slate-800 dark:text-slate-200">{selectedTable}</h3>
                 </div>
                 <Button variant="outline" size="sm">Insert Row</Button>
              </div>
              <div className="overflow-auto flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      {columns.map(col => (
                        <th key={col.name} className="px-4 py-3 font-medium whitespace-nowrap">
                           <div className="flex items-center gap-1">
                             {col.name} 
                             <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal uppercase">{col.type}</span>
                           </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRows ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                          {columns.map(col => (
                             <td key={col.name} className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-3/4"></div></td>
                          ))}
                        </tr>
                      ))
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={Math.max(columns.length, 1)} className="px-4 py-16 text-center text-slate-500 dark:text-slate-400">
                          <DatabaseZap className="h-8 w-8 mx-auto mb-3 opacity-20" />
                          <p>No rows found in this table.</p>
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, i) => (
                        <tr key={i} className="border-b last:border-0 border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                          {columns.map(col => (
                            <td key={col.name} className="px-4 py-2 text-slate-700 dark:text-slate-350 truncate max-w-[200px]">
                              {row[col.name] !== null ? String(row[col.name]) : <span className="text-slate-400 dark:text-slate-550 italic">null</span>}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 text-sm">
                 <span className="text-slate-500 dark:text-slate-400">Page {page}</span>
                 <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page === 1 || loadingRows}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={handleNextPage} disabled={rows.length < pageSize || loadingRows}>Next</Button>
                 </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-col">
              <Table2 className="h-12 w-12 text-slate-200 dark:text-slate-800 mb-4" />
              <p>Select a table to view its data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
