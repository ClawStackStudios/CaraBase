import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, DatabaseZap, FileText, Hammer, Plus, Search, X } from "lucide-react";
import { apiFetch } from "@/config/apiConfig";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ConfirmDialogInput } from "@/components/ui/confirm-dialog-input";
import { useToast } from "@/context/ToastContext";

import { TableSidebar } from "../features/table-editor/components/TableSidebar";
import { TableCreateForm } from "../features/table-editor/components/TableCreateForm";
import { TableDataGrid } from "../features/table-editor/components/TableDataGrid";
import { TableSchemaTab } from "../features/table-editor/components/TableSchemaTab";
import { TableRowDrawer } from "../features/table-editor/components/TableRowDrawer";
import { TableIndexesModal } from "../features/table-editor/components/TableIndexesModal";
import { TableFkModal } from "../features/table-editor/components/TableFkModal";

import { useTableSchema } from "../features/table-editor/hooks/useTableSchema";
import { useTableData } from "../features/table-editor/hooks/useTableData";
import { useTableCreate } from "../features/table-editor/hooks/useTableCreate";

export default function TableEditor() {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [indexes, setIndexes] = useState<any[]>([]);
  const [foreignKeys, setForeignKeys] = useState<any[]>([]);

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

  const [isDropTableConfirmOpen, setIsDropTableConfirmOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [isDroppingTable, setIsDroppingTable] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      setPage(1);
      setSortCol(null);
      setSortDir(null);
      fetchTableData(selectedTable, 1);
      fetchSchemaData(selectedTable);
    } else {
      setRows([]);
      setColumns([]);
      setIndexes([]);
      setForeignKeys([]);
    }
  }, [selectedTable]);

  async function fetchTables() {
    try {
      setLoading(true);
      const res = await apiFetch('/api/system/tables');
      if (!res.ok) throw new Error('Failed to fetch tables');
      const data = await res.json();
      setTables(data);
      if (data.length > 0 && !selectedTable) setSelectedTable(data[0].name);
    } catch (err) {
      console.error(err);
      toast.error('Unable to load tables.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchSchemaData(table: string) {
    try {
      const idxRes = await apiFetch(`/api/system/tables/${table}/indexes`);
      if (idxRes.ok) setIndexes(await idxRes.json());

      const fkRes = await apiFetch(`/api/system/tables/${table}/foreign_keys`);
      if (fkRes.ok) setForeignKeys(await fkRes.json());
    } catch (e) {
      console.error("Failed to load advanced schema properties", e);
    }
  }

  async function fetchTableData(tableName: string, pageNum: number, sortC: string | null = sortCol, sortD: "ASC" | "DESC" | null = sortDir) {
    try {
      setLoadingRows(true);
      const limit = pageSize;
      const offset = (pageNum - 1) * pageSize;
      
      let queryUrl = `/rest/v1/${tableName}?limit=${limit}&offset=${offset}`;

      // Pass sorting params if active
      if (sortC && sortD) {
        queryUrl = `/rest/v1/${tableName}?limit=${limit}&offset=${offset}&order_by=${sortC}&dir=${sortD}`;
      }

      const resData = await apiFetch(queryUrl);
      const resCols = await apiFetch(`/api/system/tables/${tableName}/schema`);

      if (!resData.ok || !resCols.ok) throw new Error('Failed to fetch table data');

      const data = await resData.json();
      const cols = await resCols.json();

      setRows(data);
      setColumns(cols);
    } catch (err) {
      console.error(err);
      toast.error(`Unable to load data for ${tableName}.`);
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

  const {
    isCreating, setIsCreating,
    newTableName, setNewTableName,
    newColumns, setNewColumns,
    isSubmittingTable,
    handleCreateTable,
    addColumnDef
  } = useTableCreate(fetchTables, setSelectedTable, toast);

  const {
    colToAdd, setColToAdd,
    colAddError,
    isSubmittingColumn,
    colToDelete, setColToDelete,
    isDropColConfirmOpen, setIsDropColConfirmOpen,
    indexForm, setIndexForm,
    isSubmittingIndex,
    indexToDelete, setIndexToDelete,
    isDropIndexConfirmOpen, setIsDropIndexConfirmOpen,
    fkForm, setFkForm,
    isSubmittingFK,
    handleAddColumnToSchema,
    triggerDropColumn,
    confirmDropColumn,
    handleAddIndex,
    triggerDropIndex,
    confirmDropIndex,
    handleAddFK
  } = useTableSchema(selectedTable, fetchTableData, page, fetchSchemaData, toast);

  const pkCol = columns.find(col => col.pk === 1 || col.pk === true);
  const pkName = pkCol ? pkCol.name : 'id';

  const {
    rowToDelete, setRowToDelete,
    isConfirmOpen, setIsConfirmOpen,
    isDrawerOpen, setIsDrawerOpen,
    drawerMode,
    formData,
    jsonErrors,
    drawerError,
    drawerSubmitting,
    triggerDeleteRow,
    confirmDeleteRow,
    openInsertDrawer,
    openEditDrawer,
    handleInputChange,
    submitDrawerForm
  } = useTableData(selectedTable, pkName, rows, setRows, columns, page, fetchTableData, toast);

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

  const filteredRows = rows.filter(row => {
    if (!globalSearch) return true;
    return Object.keys(row).some(key => {
      const val = row[key];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(globalSearch.toLowerCase());
    });
  });

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
          <Button onClick={() => setIsCreating(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white border-0 transition-all shadow-sm">
            <Plus className="h-4 w-4" /> New Table
          </Button>
        )}
      </div>

      <TableCreateForm
        isCreating={isCreating}
        setIsCreating={setIsCreating}
        newTableName={newTableName}
        setNewTableName={setNewTableName}
        newColumns={newColumns}
        setNewColumns={setNewColumns}
        addColumnDef={addColumnDef}
        handleCreateTable={handleCreateTable}
        isSubmittingTable={isSubmittingTable}
      />

      <div className="flex-1 flex gap-6 overflow-hidden min-h-[500px]">
        <TableSidebar
          tables={tables}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
          triggerDropTable={triggerDropTable}
          sidebarSearch={sidebarSearch}
          setSidebarSearch={setSidebarSearch}
          loading={loading}
        />

        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm flex flex-col overflow-hidden">
          {selectedTable ? (
            <>
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 gap-3">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <DatabaseZap className="h-4.5 w-4.5 text-emerald-500" />
                       <h3 className="font-semibold text-slate-900 dark:text-slate-100">{selectedTable}</h3>
                    </div>

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

                 {activeTab === "data" ? (
                   <div className="flex items-center gap-3">
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
                     <Button onClick={openInsertDrawer} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white border-0 transition-all text-xs py-1 h-[32px]">
                       Insert Row
                     </Button>
                   </div>
                 ) : (
                   <span className="text-xs text-slate-400 italic">Alter schema and edit column descriptions visually</span>
                 )}
              </div>

              {activeTab === "data" && (
                <TableDataGrid
                  columns={columns}
                  rows={rows}
                  filteredRows={filteredRows}
                  pkName={pkName}
                  sortCol={sortCol}
                  sortDir={sortDir}
                  handleSortToggle={handleSortToggle}
                  openEditDrawer={openEditDrawer}
                  triggerDeleteRow={triggerDeleteRow}
                  page={page}
                  pageSize={pageSize}
                  loadingRows={loadingRows}
                  handlePrevPage={handlePrevPage}
                  handleNextPage={handleNextPage}
                />
              )}

              {activeTab === "schema" && (
                <div className="flex-1 overflow-y-auto space-y-6">
                  <TableSchemaTab
                    columns={columns}
                    selectedTable={selectedTable}
                    triggerDropColumn={(col) => triggerDropColumn(col, columns)}
                    handleAddColumnToSchema={handleAddColumnToSchema}
                    colToAdd={colToAdd}
                    setColToAdd={setColToAdd}
                    colAddError={colAddError}
                    isSubmittingColumn={isSubmittingColumn}
                  />

                  <div className="px-6 pb-6 space-y-6">
                    <TableIndexesModal
                      indexes={indexes}
                      columns={columns}
                      triggerDropIndex={triggerDropIndex}
                      handleAddIndex={handleAddIndex}
                      indexForm={indexForm}
                      setIndexForm={setIndexForm}
                      isSubmittingIndex={isSubmittingIndex}
                    />

                    <TableFkModal
                      foreignKeys={foreignKeys}
                      columns={columns}
                      tables={tables}
                      selectedTable={selectedTable}
                      handleAddFK={handleAddFK}
                      fkForm={fkForm}
                      setFkForm={setFkForm}
                      isSubmittingFK={isSubmittingFK}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-col">
              <div className="h-12 w-12 text-slate-200 dark:text-slate-800 mb-4" />
              <p>Select a table from the sidebar to view and manipulate its data.</p>
            </div>
          )}
        </div>
      </div>

      <TableRowDrawer
        isDrawerOpen={isDrawerOpen}
        selectedTable={selectedTable}
        drawerMode={drawerMode}
        columns={columns}
        formData={formData}
        jsonErrors={jsonErrors}
        drawerError={drawerError}
        drawerSubmitting={drawerSubmitting}
        setIsDrawerOpen={setIsDrawerOpen}
        handleInputChange={handleInputChange}
        submitDrawerForm={submitDrawerForm}
      />

      <ConfirmDialogInput
        isOpen={isDropTableConfirmOpen}
        title="Confirm Table Deletion"
        description={`Are you absolutely sure you want to drop the entire table "${tableToDelete}"? This action executes a DROP TABLE statement, deleting all schema and rows permanently.`}
        expectedInput={tableToDelete || ""}
        confirmText="Yes, Drop Table"
        cancelText="Cancel"
        onConfirm={confirmDropTable}
        onCancel={() => {
          setIsDropTableConfirmOpen(false);
          setTableToDelete(null);
        }}
      />

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

      <ConfirmDialog
        isOpen={isDropIndexConfirmOpen}
        title="Confirm Index Deletion"
        description={`Are you sure you want to drop index "${indexToDelete}" from table "${selectedTable}"? This action is permanent.`}
        confirmText="Yes, Drop Index"
        cancelText="Cancel"
        onConfirm={confirmDropIndex}
        onCancel={() => {
          setIsDropIndexConfirmOpen(false);
          setIndexToDelete(null);
        }}
      />
    </div>
  );
}
