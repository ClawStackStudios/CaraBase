import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Trash, 
  DatabaseZap, 
  Search, 
  Table2, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Edit2, 
  X,
  Sparkles,
  AlertCircle,
  FileText,
  Hammer,
  Loader2
} from "lucide-react";
import { apiFetch } from "@/config/apiConfig";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/context/ToastContext";

export default function TableEditor() {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);
  const [isSubmittingColumn, setIsSubmittingColumn] = useState(false);
  const [isDroppingColumn, setIsDroppingColumn] = useState(false);
  const [isDeletingRow, setIsDeletingRow] = useState(false);

  // Layout Tab toggling ("data" | "schema")
  const [activeTab, setActiveTab] = useState<"data" | "schema">("data");

  // Data Grid State
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [loadingRows, setLoadingRows] = useState(false);

  // Sorting State
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"ASC" | "DESC" | null>(null);

  // Search States
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");

  // New Table Form
  const [isCreating, setIsCreating] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newColumns, setNewColumns] = useState([
    { name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: false, defaultValue: '' }
  ]);

  // Inline Add Column State (within Schema view)
  const [colToAdd, setColToAdd] = useState({
    name: "",
    type: "TEXT",
    notNull: false,
    defaultValue: ""
  });
  const [colAddError, setColAddError] = useState<string | null>(null);

  // Slide-out Drawer State (Row Insert/Edit)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"insert" | "edit">("insert");
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [drawerSubmitting, setDrawerSubmitting] = useState(false);

  // Confirm Dialog State (Row Delete)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<any | null>(null);

  // Confirm Dialog State (Column Drop)
  const [isDropColConfirmOpen, setIsDropColConfirmOpen] = useState(false);
  const [colToDelete, setColToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      setPage(1);
      setSortCol(null);
      setSortDir(null);
      setGlobalSearch("");
      setActiveTab("data");
      fetchTableData(selectedTable, 1, null, null);
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

  async function fetchTableData(
    tableName: string, 
    pageNum: number, 
    orderBy: string | null = sortCol, 
    direction: "ASC" | "DESC" | null = sortDir
  ) {
    setLoadingRows(true);
    try {
      // Introspect columns (schema)
      const colsRes = await apiFetch(`/api/system/tables/${tableName}/schema`);
      const colsData = await colsRes.json();
      setColumns(colsData);

      // Build fetch URL with pagination and optional sorting params
      const offset = (pageNum - 1) * pageSize;
      let url = `/rest/v1/${tableName}?limit=${pageSize}&offset=${offset}`;
      
      if (orderBy && direction) {
        url += `&order_by=${orderBy}&dir=${direction}`;
      }

      const rowsRes = await apiFetch(url);
      if (!rowsRes.ok) {
        throw new Error(await rowsRes.text());
      }
      setRows(await rowsRes.json());
    } catch (err) {
      console.error(err);
      toast.error('Error fetching table data: ' + (err as Error).message);
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

  // Toggle column sorting ASC -> DESC -> None
  function handleSortToggle(colName: string) {
    let nextDir: "ASC" | "DESC" | null = null;
    if (sortCol !== colName) {
      setSortCol(colName);
      nextDir = "ASC";
      setSortDir("ASC");
    } else {
      if (sortDir === "ASC") {
        nextDir = "DESC";
        setSortDir("DESC");
      } else if (sortDir === "DESC") {
        setSortCol(null);
        setSortDir(null);
      }
    }
    setPage(1);
    fetchTableData(selectedTable!, 1, sortCol === colName && sortDir === "DESC" ? null : colName, nextDir);
  }

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

  // Schema Alteration (Add Column)
  async function handleAddColumnToSchema(e: React.FormEvent) {
    e.preventDefault();
    setColAddError(null);
    if (!colToAdd.name || !selectedTable) return;

    const safeColName = colToAdd.name.replace(/[^a-zA-Z0-9_]/g, '');
    if (!safeColName) {
      setColAddError("Invalid column name.");
      return;
    }

    // Build the query
    let query = `ALTER TABLE ${selectedTable} ADD COLUMN ${safeColName} ${colToAdd.type}`;
    if (colToAdd.notNull) {
      query += ` NOT NULL`;
    }
    if (colToAdd.defaultValue) {
      // Escape single quotes for standard SQLite syntax
      const escapedDefault = colToAdd.defaultValue.replace(/'/g, "''");
      query += ` DEFAULT '${escapedDefault}'`;
    } else if (colToAdd.notNull) {
      // In SQLite, if adding NOT NULL to an existing table, a default value is mandatory
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
      if (!res.ok) {
        throw new Error(await res.text());
      }

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

  // Schema Alteration (Drop Column)
  function triggerDropColumn(colName: string) {
    // Prevent dropping primary key columns
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
      if (!res.ok) {
        throw new Error(await res.text());
      }
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

  // Row Delete Operations
  function triggerDeleteRow(row: any, e: React.MouseEvent) {
    e.stopPropagation();
    setRowToDelete(row);
    setIsConfirmOpen(true);
  }

  async function confirmDeleteRow() {
    if (!rowToDelete || !selectedTable) return;

    // Identify primary key column
    const pkVal = rowToDelete[pkName];

    // Optimistic UI update
    const previousRows = [...rows];
    setRows(rows.filter(r => r[pkName] !== pkVal));
    setIsConfirmOpen(false);
    setIsDeletingRow(true);

    try {
      const res = await apiFetch(`/rest/v1/${selectedTable}?${pkName}=eq.${pkVal}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setRowToDelete(null);
      toast.success('Row deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Delete failed: ' + (err as Error).message);
      // Revert optimistic delete
      setRows(previousRows);
    } finally {
      setIsDeletingRow(false);
    }
  }

  // Row Insertion / Editing Drawer operations
  function openInsertDrawer() {
    setDrawerMode("insert");
    setEditingRow(null);
    setDrawerError(null);
    setJsonErrors({});
    
    // Initialize form values with defaults from columns schema
    const initialForm: Record<string, any> = {};
    columns.forEach(col => {
      if (col.dflt_value !== null) {
        // Strip out single quotes from default value returned by sqlite
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
    
    // Deep clone values for JSON columns
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
    
    // Auto validate JSON textareas as the user types
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

    // Format payload data matching schema types
    const payload: Record<string, any> = {};
    columns.forEach(col => {
      const val = formData[col.name];
      
      // Handle auto-increment key fields on insert
      if (col.pk && drawerMode === "insert" && (val === "" || val === undefined)) {
        return; // Let SQLite handle auto-generation
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
          payload[col.name] = val; // fallback
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
        if (!res.ok) {
          throw new Error(await res.text());
        }
      } else {
        // Edit Mode: exclude pk from direct update, target via query selector
        const pkVal = editingRow[pkName];
        const updatePayload = { ...payload };
        delete updatePayload[pkName]; // Don't modify the PK in payload

        const res = await apiFetch(`/rest/v1/${selectedTable}?${pkName}=eq.${pkVal}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
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

  // Filter sidebar table list client-side
  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  // Filter table rows client-side based on search inputs
  const filteredRows = rows.filter(row => {
    if (!globalSearch) return true;
    return Object.keys(row).some(key => {
      const val = row[key];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(globalSearch.toLowerCase());
    });
  });

  // Helper to find PK column name
  const pkCol = columns.find(col => col.pk === 1 || col.pk === true);
  const pkName = pkCol ? pkCol.name : 'id';

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            Table Editor <Sparkles className="h-5 w-5 text-emerald-505" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manipulate schemas, search user data, and operate table records.</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 transition-all shadow-sm">
            <Plus className="h-4 w-4" /> New Table
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="mb-6 border-slate-200 dark:border-slate-800 shadow-sm border bg-emerald-50/5 dark:bg-emerald-950/5">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Table2 className="h-5 w-5 text-emerald-500" /> Create New Table
            </h3>
            <div className="space-y-4">
              <div className="max-w-md">
                <label className="text-sm font-medium mb-1 block text-slate-700 dark:text-slate-300">Table Name</label>
                <Input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder="e.g., users, posts, products" className="focus-visible:ring-emerald-500 focus-visible:border-emerald-500" />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold block text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-1.5">Column Schema & Constraints</label>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {newColumns.map((col, idx) => (
                    <div key={idx} className="flex flex-wrap gap-2.5 items-center p-3 rounded-lg border border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/30">
                      <div className="flex-1 min-w-[150px]">
                        <Input 
                          placeholder="Column name" 
                          value={col.name} 
                          onChange={(e) => {
                            const newC = [...newColumns];
                            newC[idx].name = e.target.value;
                            setNewColumns(newC);
                          }} 
                          className="focus-visible:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <select 
                          className="flex h-9 w-32 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-1 text-sm shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
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
                      </div>

                      {/* Primary Key constraint */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          id={`newpk-${idx}`}
                          checked={col.primaryKey}
                          onChange={(e) => {
                            const newC = [...newColumns];
                            newC[idx].primaryKey = e.target.checked;
                            if (e.target.checked) {
                              newC[idx].nullable = false; // Primary key is always NOT NULL
                            }
                            setNewColumns(newC);
                          }}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-555"
                        />
                        <label htmlFor={`newpk-${idx}`} className="text-xs text-slate-600 dark:text-slate-400 font-medium">PK</label>
                      </div>

                      {/* Unique constraint */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          id={`newuniq-${idx}`}
                          checked={col.unique}
                          onChange={(e) => {
                            const newC = [...newColumns];
                            newC[idx].unique = e.target.checked;
                            setNewColumns(newC);
                          }}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-555"
                        />
                        <label htmlFor={`newuniq-${idx}`} className="text-xs text-slate-600 dark:text-slate-400 font-medium">Unique</label>
                      </div>

                      {/* Not Null / Nullable constraint */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          id={`newnotnull-${idx}`}
                          checked={!col.nullable}
                          disabled={col.primaryKey} // always NOT NULL if PK
                          onChange={(e) => {
                            const newC = [...newColumns];
                            newC[idx].nullable = !e.target.checked;
                            setNewColumns(newC);
                          }}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-555"
                        />
                        <label htmlFor={`newnotnull-${idx}`} className="text-xs text-slate-600 dark:text-slate-400 font-medium">Not Null</label>
                      </div>

                      {/* Default Value constraint */}
                      <div className="w-36">
                        <Input 
                          placeholder="Default value" 
                          value={col.defaultValue} 
                          onChange={(e) => {
                            const newC = [...newColumns];
                            newC[idx].defaultValue = e.target.value;
                            setNewColumns(newC);
                          }} 
                          className="h-8 text-xs focus-visible:ring-emerald-500"
                        />
                      </div>

                      {idx > 0 && (
                         <Button variant="ghost" size="sm" onClick={() => setNewColumns(newColumns.filter((_, i) => i !== idx))} className="hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 h-8">
                           <Trash className="h-4 w-4 text-slate-500 hover:text-red-550" />
                         </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addColumnDef} className="mt-1 text-xs border-dashed border-emerald-500 hover:bg-emerald-50/10 text-emerald-650 dark:text-emerald-450 dark:border-emerald-900">
                  <Plus className="h-3 w-3 mr-1" /> Add Column Column
                </Button>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                <Button onClick={handleCreateTable} disabled={isSubmittingTable} className="bg-emerald-650 hover:bg-emerald-700 text-white">
                  {isSubmittingTable ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create Table
                </Button>
                <Button variant="ghost" onClick={() => setIsCreating(false)} className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex-1 flex gap-6 overflow-hidden min-h-[500px]">
        {/* Table List Sidebar */}
        <div className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-y-auto shadow-sm flex flex-col">
          <div className="p-3 border-b border-slate-100 dark:border-slate-850 flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search tables..." 
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="text-sm w-full outline-none bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-550 border-0 focus:ring-0 focus:outline-none"
            />
            {sidebarSearch && (
              <button onClick={() => setSidebarSearch("")} className="bg-transparent border-0 cursor-pointer p-0">
                <X className="h-3.5 w-3.5 text-slate-450 hover:text-slate-600" />
              </button>
            )}
          </div>
          <div className="p-2 space-y-1 overflow-y-auto flex-1">
            {filteredTables.map(t => (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t.name)}
                className={`w-full text-left px-3 py-2.5 text-sm rounded-md flex items-center gap-2 transition-colors border-0 cursor-pointer ${selectedTable === t.name ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
              >
                <Table2 className="h-4 w-4 opacity-70" />
                {t.name}
              </button>
            ))}
            {filteredTables.length === 0 && !loading && (
              <p className="text-sm text-slate-500 dark:text-slate-450 p-4 text-center">No tables match search.</p>
            )}
          </div>
        </div>

        {/* Workspace Panel */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm flex flex-col overflow-hidden">
          {selectedTable ? (
            <>
              {/* Workspace Header w/ Tabs Toggles */}
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 gap-3">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <DatabaseZap className="h-4.5 w-4.5 text-emerald-500" />
                       <h3 className="font-semibold text-slate-900 dark:text-slate-100">{selectedTable}</h3>
                    </div>

                    {/* Navigation tabs */}
                    <div className="flex border border-slate-250 dark:border-slate-800 rounded-md overflow-hidden text-xs bg-white dark:bg-slate-950">
                      <button
                        onClick={() => setActiveTab("data")}
                        className={`px-3 py-1.5 font-medium border-0 cursor-pointer transition-colors ${activeTab === "data" ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-450 font-semibold' : 'text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                      >
                        <FileText className="h-3 w-3 inline mr-1" /> Data Grid
                      </button>
                      <button
                        onClick={() => setActiveTab("schema")}
                        className={`px-3 py-1.5 font-medium border-l border-slate-250 dark:border-slate-800 border-0 cursor-pointer transition-colors ${activeTab === "schema" ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-450 font-semibold' : 'text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                      >
                        <Hammer className="h-3 w-3 inline mr-1" /> Schema Editor
                      </button>
                    </div>
                 </div>

                 {/* Actions block depending on Active Tab */}
                 {activeTab === "data" ? (
                   <div className="flex items-center gap-3">
                     {/* Global Page Search Input */}
                     <div className="relative flex items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1 w-56 md:w-64 max-h-[34px] focus-within:ring-1 focus-within:ring-emerald-500">
                       <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mr-2" />
                       <input
                         type="text"
                         placeholder="Filter page rows..."
                         value={globalSearch}
                         onChange={(e) => setGlobalSearch(e.target.value)}
                         className="text-xs outline-none bg-transparent w-full text-slate-900 dark:text-slate-100 border-0 focus:ring-0 focus:outline-none"
                       />
                       {globalSearch && (
                         <button onClick={() => setGlobalSearch("")} className="bg-transparent border-0 cursor-pointer p-0 ml-1">
                           <X className="h-3.5 w-3.5 text-slate-450 hover:text-slate-650" />
                         </button>
                       )}
                     </div>
                     <Button onClick={openInsertDrawer} className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 transition-all text-xs py-1 h-[32px]">
                       Insert Row
                     </Button>
                   </div>
                 ) : (
                   <span className="text-xs text-slate-400 italic">Alter schema and edit column descriptions visually</span>
                 )}
              </div>

              {/* TABLE DATA GRID TAB */}
              {activeTab === "data" && (
                <>
                  <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          {columns.map(col => {
                            const isSorted = sortCol === col.name;
                            return (
                              <th 
                                key={col.name} 
                                onClick={() => handleSortToggle(col.name)}
                                className="px-4 py-3.5 font-semibold whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-950 transition-colors group"
                              >
                                 <div className="flex items-center gap-1.5 justify-between">
                                   <div className="flex items-center gap-1">
                                     {col.name} 
                                     <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal uppercase bg-slate-100 dark:bg-slate-800 px-1 rounded">{col.type}</span>
                                     {col.pk === 1 && (
                                       <span className="text-[8px] bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1 rounded uppercase font-semibold">PK</span>
                                     )}
                                   </div>
                                   <div className="text-slate-400 group-hover:text-slate-650 transition-colors">
                                     {!isSorted && <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" />}
                                     {isSorted && sortDir === "ASC" && <ArrowUp className="h-3 w-3 text-emerald-555" />}
                                     {isSorted && sortDir === "DESC" && <ArrowDown className="h-3 w-3 text-emerald-555" />}
                                   </div>
                                 </div>
                              </th>
                            );
                          })}
                          <th className="px-4 py-3.5 font-semibold text-right whitespace-nowrap w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingRows ? (
                          [...Array(5)].map((_, i) => (
                            <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                              {columns.map(col => (
                                 <td key={col.name} className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-3/4"></div></td>
                              ))}
                              <td className="px-4 py-3"></td>
                            </tr>
                          ))
                        ) : filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={columns.length + 1} className="px-4 py-16 text-center text-slate-500 dark:text-slate-400">
                              <DatabaseZap className="h-8 w-8 mx-auto mb-3 opacity-20" />
                              <p className="text-sm font-medium">No rows matching current filters found.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredRows.map((row, i) => (
                            <tr 
                              key={i} 
                              onClick={() => openEditDrawer(row)}
                              className="border-b last:border-0 border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors cursor-pointer group"
                            >
                              {columns.map(col => {
                                const val = row[col.name];
                                const isJson = col.type === "JSON";
                                return (
                                  <td key={col.name} className="px-4 py-3 text-slate-700 dark:text-slate-350 truncate max-w-[200px]">
                                    {val !== null ? (
                                      isJson ? (
                                        <span className="font-mono text-xs text-blue-600 dark:text-blue-450 bg-blue-50/40 dark:bg-blue-950/10 px-1 rounded truncate block max-w-full">
                                          {typeof val === "object" ? JSON.stringify(val) : String(val)}
                                        </span>
                                      ) : String(val)
                                    ) : (
                                      <span className="text-slate-400 dark:text-slate-550 italic">null</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => openEditDrawer(row)}
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-emerald-555 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={(e) => triggerDeleteRow(row, e)}
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-red-550 hover:bg-red-50/40 dark:hover:bg-red-950/20"
                                  >
                                    <Trash className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls Footer */}
                  <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 text-sm">
                     <span className="text-slate-550 dark:text-slate-400">
                       Page {page} <span className="text-slate-400 ml-1">({filteredRows.length} showing)</span>
                     </span>
                     <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page === 1 || loadingRows} className="text-xs h-[30px] border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950">Previous</Button>
                        <Button variant="outline" size="sm" onClick={handleNextPage} disabled={rows.length < pageSize || loadingRows} className="text-xs h-[30px] border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950">Next</Button>
                     </div>
                  </div>
                </>
              )}

              {/* VISUAL SCHEMA EDITOR TAB */}
              {activeTab === "schema" && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Schema Info Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900/40 shadow-xs">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 dark:text-slate-450 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase">
                        <tr>
                          <th className="px-5 py-3.5">Column ID</th>
                          <th className="px-5 py-3.5">Name</th>
                          <th className="px-5 py-3.5">Type</th>
                          <th className="px-5 py-3.5">Primary Key</th>
                          <th className="px-5 py-3.5">Nullable</th>
                          <th className="px-5 py-3.5">Default Value</th>
                          <th className="px-5 py-3.5 text-right w-20">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                        {columns.map(col => (
                          <tr key={col.name} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors">
                            <td className="px-5 py-3.5 font-mono text-slate-400 text-xs">{col.cid}</td>
                            <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-150">{col.name}</td>
                            <td className="px-5 py-3.5">
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-1.5 py-0.5 rounded font-mono font-semibold select-none">
                                {col.type || 'TEXT'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              {col.pk === 1 ? (
                                <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-semibold select-none">PRIMARY KEY</span>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {col.notnull === 1 ? (
                                <span className="text-[9px] bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/10 px-1.5 py-0.5 rounded font-semibold select-none">NOT NULL</span>
                              ) : (
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border border-emerald-500/10 px-1.5 py-0.5 rounded font-semibold select-none">NULLABLE</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {col.dflt_value !== null ? (
                                <code className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10 px-1.5 py-0.5 rounded font-mono">
                                  {col.dflt_value}
                                </code>
                              ) : (
                                <span className="text-slate-400 italic text-xs">none</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {col.pk !== 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => triggerDropColumn(col.name)}
                                  className="h-7 w-7 p-0 text-slate-450 hover:text-red-550 hover:bg-red-50/40 dark:hover:bg-red-950/20"
                                  title="Drop Column"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Column Interactive Form Panel */}
                  <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-900/10 shadow-xs">
                    <CardContent className="pt-6">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-4">
                        <Plus className="h-4 w-4 text-emerald-500" /> Add New Column to {selectedTable}
                      </h4>
                      
                      <form onSubmit={handleAddColumnToSchema} className="space-y-4">
                        {colAddError && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/50 rounded-md text-xs text-red-655 dark:text-red-400 flex items-start gap-2.5">
                            <AlertCircle className="h-4 w-4 text-red-550 shrink-0 mt-0.5" />
                            <span>{colAddError}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div>
                            <label className="text-xs font-semibold mb-1 block text-slate-600 dark:text-slate-350">Column Name</label>
                            <Input 
                              value={colToAdd.name} 
                              onChange={(e) => setColToAdd(prev => ({ ...prev, name: e.target.value }))} 
                              placeholder="column_name" 
                              className="focus-visible:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold mb-1 block text-slate-600 dark:text-slate-350">Data Type</label>
                            <select 
                              className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-1 text-sm shadow-sm focus:ring-emerald-500 focus:border-emerald-555"
                              value={colToAdd.type}
                              onChange={(e) => setColToAdd(prev => ({ ...prev, type: e.target.value }))}
                            >
                              <option value="TEXT">TEXT</option>
                              <option value="INTEGER">INTEGER</option>
                              <option value="REAL">REAL</option>
                              <option value="BOOLEAN">BOOLEAN</option>
                              <option value="JSON">JSON</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold mb-1 block text-slate-600 dark:text-slate-350">Default Value</label>
                            <Input 
                              value={colToAdd.defaultValue} 
                              onChange={(e) => setColToAdd(prev => ({ ...prev, defaultValue: e.target.value }))} 
                              placeholder="e.g. '', 'Guest', 0, 1"
                              className="focus-visible:ring-emerald-500"
                            />
                          </div>
                          <div className="flex items-center h-9 justify-between md:justify-start gap-4">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                id="coladd-notnull"
                                checked={colToAdd.notNull}
                                onChange={(e) => setColToAdd(prev => ({ ...prev, notNull: e.target.checked }))}
                                className="h-4.5 w-4.5 rounded text-emerald-650 focus:ring-emerald-500 bg-white dark:bg-slate-950"
                              />
                              <label htmlFor="coladd-notnull" className="text-xs font-semibold text-slate-700 dark:text-slate-350 select-none">NOT NULL</label>
                            </div>
                            
                            <Button type="submit" disabled={isSubmittingColumn} className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 py-1.5 px-4 h-9 shadow-xs text-xs font-semibold">
                              {isSubmittingColumn ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null} Add Column
                            </Button>
                          </div>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-col">
              <Table2 className="h-12 w-12 text-slate-200 dark:text-slate-800 mb-4" />
              <p>Select a table from the sidebar to view and manipulate its data.</p>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Overlay Drawer for Row Insert & Edit operations */}
      {isDrawerOpen && selectedTable && (
        <div className="fixed inset-0 z-45 flex justify-end bg-black/40 backdrop-blur-sm transition-all duration-200 animate-in fade-in">
          {/* Backdrop Closer */}
          <div className="absolute inset-0 -z-10" onClick={() => setIsDrawerOpen(false)} />
          
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  {drawerMode === "insert" ? "Insert New Row" : "Edit Existing Row"}
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">Table: {selectedTable}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsDrawerOpen(false)} 
                className="h-8 w-8 p-0 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form Fields Ingress */}
            <form onSubmit={submitDrawerForm} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 p-6 overflow-y-auto space-y-5">
                {drawerError && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/50 rounded-md text-xs text-red-650 dark:text-red-400 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-red-550 shrink-0 mt-0.5" />
                    <span>{drawerError}</span>
                  </div>
                )}

                {columns.map(col => {
                  const isPk = col.pk === 1 || col.pk === true;
                  const isAutoIncrementPk = isPk && col.type === "INTEGER" && drawerMode === "insert";
                  const value = formData[col.name] ?? "";

                  // Disable pk edits during updates to preserve entity stability
                  const isDisabled = isPk && drawerMode === "edit";

                  return (
                    <div key={col.name} className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          {col.name}
                          {col.notnull === 1 && <span className="text-red-550">*</span>}
                        </label>
                        <span className="text-[10px] text-slate-455 font-normal uppercase select-none">
                          {col.type} {isPk && "(PK)"}
                        </span>
                      </div>

                      {/* BOOLEAN INPUT */}
                      {col.type === "BOOLEAN" ? (
                        <div className="flex items-center gap-2.5 pt-1">
                          <input
                            type="checkbox"
                            id={`form-${col.name}`}
                            checked={value === true || value === 1 || value === "true"}
                            disabled={isDisabled}
                            onChange={(e) => handleInputChange(col.name, e.target.checked, col.type)}
                            className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-800 text-emerald-650 focus:ring-emerald-500 accent-emerald-600 bg-white dark:bg-slate-950"
                          />
                          <label htmlFor={`form-${col.name}`} className="text-xs text-slate-650 dark:text-slate-400">
                            {(value === true || value === 1 || value === "true") ? "Active / True" : "Inactive / False"}
                          </label>
                        </div>
                      ) : col.type === "JSON" ? (
                        /* JSON / OBJECT INPUT */
                        <div className="space-y-1">
                          <textarea
                            value={value}
                            disabled={isDisabled}
                            onChange={(e) => handleInputChange(col.name, e.target.value, col.type)}
                            placeholder='{"key": "value"}'
                            rows={5}
                            className={`w-full rounded-md border text-xs font-mono p-3 bg-white dark:bg-slate-955 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 ${jsonErrors[col.name] ? 'border-red-400 focus:ring-red-550 focus:border-red-550' : 'border-slate-200 dark:border-slate-800'}`}
                          />
                          {jsonErrors[col.name] && (
                            <span className="text-[10px] text-red-555 font-medium flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> {jsonErrors[col.name]}
                            </span>
                          )}
                        </div>
                      ) : col.type === "TEXT" && !isPk ? (
                        /* LARGE TEXT INPUT */
                        <textarea
                          value={value}
                          disabled={isDisabled}
                          onChange={(e) => handleInputChange(col.name, e.target.value, col.type)}
                          placeholder={col.notnull ? "Required text" : "Optional text"}
                          rows={3}
                          className="w-full rounded-md border border-slate-200 dark:border-slate-800 text-sm p-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      ) : (
                        /* STANDARD INPUT (TEXT/INTEGER/REAL/DATETIME) */
                        <Input
                          type={col.type === "INTEGER" || col.type === "REAL" ? "number" : "text"}
                          step={col.type === "REAL" ? "any" : "1"}
                          value={value}
                          disabled={isDisabled}
                          onChange={(e) => handleInputChange(col.name, e.target.value, col.type)}
                          placeholder={
                            isAutoIncrementPk 
                              ? "Auto-generated ID (Integer)" 
                              : col.notnull 
                                ? "Required value" 
                                : "Optional value (Null)"
                          }
                          className="w-full focus-visible:ring-emerald-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Drawer Action Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-2">
                <Button 
                  type="submit" 
                  disabled={drawerSubmitting || Object.values(jsonErrors).some(err => err !== "")}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0 py-2 shadow-sm font-semibold transition-all"
                >
                  {drawerSubmitting ? "Saving..." : drawerMode === "insert" ? "Insert Record" : "Save Changes"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-5 border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Row Deletion confirmation dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm Record Deletion"
        description={`Are you absolutely sure you want to delete this row from ${selectedTable}? This action will execute a REST DELETE request and cannot be undone.`}
        confirmText="Yes, Delete Row"
        cancelText="Cancel"
        onConfirm={confirmDeleteRow}
        onCancel={() => {
          setIsConfirmOpen(false);
          setRowToDelete(null);
        }}
      />

      {/* Column Drop confirmation dialog */}
      <ConfirmDialog
        isOpen={isDropColConfirmOpen}
        title="Confirm Column Deletion"
        description={`Are you absolutely sure you want to drop column "${colToDelete}" from table "${selectedTable}"? Dropping columns executes an ALTER TABLE DROP COLUMN statement and is permanent.`}
        confirmText="Yes, Drop Column"
        cancelText="Cancel"
        onConfirm={confirmDropColumn}
        onCancel={() => {
          setIsDropColConfirmOpen(false);
          setColToDelete(null);
        }}
      />
    </div>
  );
}
