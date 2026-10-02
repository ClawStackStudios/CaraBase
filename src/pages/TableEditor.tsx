import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ConfirmDialogInput } from "@/components/ui/confirm-dialog-input";

import { TableSidebar } from "@/features/table-editor/components/TableSidebar";
import { TableRowDrawer } from "@/features/table-editor/components/TableRowDrawer";
import { TableCreator } from "@/features/table-editor/components/TableCreator";
import { WorkspacePanel } from "@/features/table-editor/components/WorkspacePanel";

import { useTableData } from "@/features/table-editor/hooks/useTableData";
import { useSchemaOperations } from "@/features/table-editor/hooks/useSchemaOperations";
import { useRowOperations } from "@/features/table-editor/hooks/useRowOperations";

export default function TableEditor() {
  const {
    tables, setTables,
    selectedTable, setSelectedTable,
    rows, setRows,
    columns, setColumns,
    loading,
    indexes, setIndexes,
    foreignKeys, setForeignKeys,
    page, setPage,
    pageSize,
    loadingRows,
    hasMore,
    sortCol, sortDir,
    fetchTables, fetchTableData,
    handleNextPage, handlePrevPage, handleSortToggle
  } = useTableData();

  const {
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
  } = useSchemaOperations(selectedTable, fetchTableData, page, fetchTables, columns, setSelectedTable);

  const {
    isDeletingRow,
    isConfirmOpen, setIsConfirmOpen,
    rowToDelete, setRowToDelete,
    isDrawerOpen, setIsDrawerOpen,
    drawerMode, setDrawerMode,
    editingRow, setEditingRow,
    formData, setFormData,
    jsonErrors, setJsonErrors,
    drawerError, setDrawerError,
    drawerSubmitting, setDrawerSubmitting,
    triggerDeleteRow, confirmDeleteRow,
    openInsertDrawer, openEditDrawer,
    handleInputChange, submitDrawerForm
  } = useRowOperations(selectedTable, columns, rows, setRows, fetchTableData, page);

  const [activeTab, setActiveTab] = useState<"data" | "schema">("data");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");

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

      <TableCreator
        isCreating={isCreating}
        setIsCreating={setIsCreating}
        newTableName={newTableName}
        setNewTableName={setNewTableName}
        newColumns={newColumns}
        setNewColumns={setNewColumns}
        handleCreateTable={handleCreateTable}
        isSubmittingTable={isSubmittingTable}
        addColumnDef={addColumnDef}
      />

      <div className="flex-1 flex gap-6 overflow-hidden min-h-[500px]">
        <TableSidebar
          tables={tables}
          selectedTable={selectedTable}
          sidebarSearch={sidebarSearch}
          loading={loading}
          setSidebarSearch={setSidebarSearch}
          setSelectedTable={(name) => {
            setSelectedTable(name);
            setActiveTab("data");
            setGlobalSearch("");
          }}
          triggerDropTable={triggerDropTable}
          setIsCreating={setIsCreating}
        />

        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm flex flex-col overflow-hidden">
          <WorkspacePanel
            selectedTable={selectedTable}
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              if (tab === "data") setGlobalSearch("");
            }}
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
            openInsertDrawer={openInsertDrawer}
            columns={columns}
            filteredRows={filteredRows}
            loadingRows={loadingRows}
            sortCol={sortCol}
            sortDir={sortDir}
            handleSortToggle={handleSortToggle}
            openEditDrawer={openEditDrawer}
            triggerDeleteRow={triggerDeleteRow}
            page={page}
            pageSize={pageSize}
            handlePrevPage={handlePrevPage}
            handleNextPage={handleNextPage}
            hasMore={hasMore}
            triggerDropColumn={triggerDropColumn}
            colToAdd={colToAdd}
            setColToAdd={setColToAdd}
            handleAddColumnToSchema={handleAddColumnToSchema}
            isSubmittingColumn={isSubmittingColumn}
            colAddError={colAddError}
            indexes={indexes}
            triggerDropIndex={triggerDropIndex}
            indexForm={indexForm}
            setIndexForm={setIndexForm}
            handleAddIndex={handleAddIndex}
            isSubmittingIndex={isSubmittingIndex}
            foreignKeys={foreignKeys}
            tables={tables}
            fkForm={fkForm}
            setFkForm={setFkForm}
            handleAddFK={handleAddFK}
            isSubmittingFK={isSubmittingFK}
          />
        </div>
      </div>

      <TableRowDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        drawerMode={drawerMode}
        selectedTable={selectedTable || ""}
        columns={columns}
        formData={formData}
        jsonErrors={jsonErrors}
        drawerError={drawerError}
        drawerSubmitting={drawerSubmitting}
        submitDrawerForm={submitDrawerForm}
        handleInputChange={handleInputChange}
      />

      <ConfirmDialogInput
        isOpen={isDropTableConfirmOpen}
        title="Confirm Table Deletion"
        description={`Are you absolutely sure you want to drop the entire table "${tableToDelete}"? This action executes a DROP TABLE statement, deleting all schema and rows permanently.`}
        expectedInput={tableToDelete || ""}
        confirmText="Yes, Drop Table"
        cancelText="Cancel"
        onConfirm={confirmDropTable}
        onCancel={() => { setIsDropTableConfirmOpen(false); setTableToDelete(null); }}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm Record Deletion"
        description={`Are you absolutely sure you want to delete this row from ${selectedTable}? This action will execute a REST DELETE request and cannot be undone.`}
        confirmText="Yes, Delete Row"
        cancelText="Cancel"
        onConfirm={confirmDeleteRow}
        onCancel={() => { setIsConfirmOpen(false); setRowToDelete(null); }}
      />

      <ConfirmDialog
        isOpen={isDropColConfirmOpen}
        title="Confirm Column Deletion"
        description={`Are you absolutely sure you want to drop column "${colToDelete}" from table "${selectedTable}"? Dropping columns executes an ALTER TABLE DROP COLUMN statement and is permanent.`}
        confirmText="Yes, Drop Column"
        cancelText="Cancel"
        onConfirm={confirmDropColumn}
        onCancel={() => { setIsDropColConfirmOpen(false); setColToDelete(null); }}
      />

      <ConfirmDialog
        isOpen={isDropIndexConfirmOpen}
        title="Confirm Index Deletion"
        description={`Are you absolutely sure you want to drop index "${indexToDelete}" from table "${selectedTable}"? Dropping indexes is permanent.`}
        confirmText="Yes, Drop Index"
        cancelText="Cancel"
        onConfirm={confirmDropIndex}
        onCancel={() => { setIsDropIndexConfirmOpen(false); setIndexToDelete(null); }}
      />
    </div>
  );
}
