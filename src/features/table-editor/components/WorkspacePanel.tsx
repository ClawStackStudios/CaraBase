import React from "react";
import { DatabaseZap, FileText, Hammer, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableDataGrid } from "./TableDataGrid";
import { TableSchemaTab } from "./TableSchemaTab";
import { TableIndexesModal } from "./TableIndexesModal";
import { TableFkModal } from "./TableFkModal";
import { Table2 } from "lucide-react";

interface WorkspacePanelProps {
  selectedTable: string | null;
  activeTab: "data" | "schema";
  setActiveTab: (tab: "data" | "schema") => void;
  globalSearch: string;
  setGlobalSearch: (val: string) => void;
  openInsertDrawer: () => void;
  columns: any[];
  filteredRows: any[];
  loadingRows: boolean;
  sortCol: string | null;
  sortDir: "ASC" | "DESC" | null;
  handleSortToggle: (colName: string) => void;
  openEditDrawer: (row: any) => void;
  triggerDeleteRow: (row: any, e: React.MouseEvent) => void;
  page: number;
  pageSize: number;
  handlePrevPage: () => void;
  handleNextPage: () => void;
  hasMore: boolean;
  triggerDropColumn: (colName: string) => void;
  colToAdd: { name: string; type: string; notNull: boolean; defaultValue: string; };
  setColToAdd: React.Dispatch<React.SetStateAction<{ name: string; type: string; notNull: boolean; defaultValue: string; }>>;
  handleAddColumnToSchema: (e: React.FormEvent) => void;
  isSubmittingColumn: boolean;
  colAddError: string | null;
  indexes: any[];
  triggerDropIndex: (idxName: string) => void;
  indexForm: { name: string; column: string; unique: boolean; };
  setIndexForm: React.Dispatch<React.SetStateAction<{ name: string; column: string; unique: boolean; }>>;
  handleAddIndex: (e: React.FormEvent) => void;
  isSubmittingIndex: boolean;
  foreignKeys: any[];
  tables: any[];
  fkForm: { localCol: string; foreignTable: string; foreignCol: string; onDelete: string; onUpdate: string; };
  setFkForm: React.Dispatch<React.SetStateAction<{ localCol: string; foreignTable: string; foreignCol: string; onDelete: string; onUpdate: string; }>>;
  handleAddFK: (e: React.FormEvent) => void;
  isSubmittingFK: boolean;
}

export function WorkspacePanel({
  selectedTable,
  activeTab,
  setActiveTab,
  globalSearch,
  setGlobalSearch,
  openInsertDrawer,
  columns,
  filteredRows,
  loadingRows,
  sortCol,
  sortDir,
  handleSortToggle,
  openEditDrawer,
  triggerDeleteRow,
  page,
  pageSize,
  handlePrevPage,
  handleNextPage,
  hasMore,
  triggerDropColumn,
  colToAdd,
  setColToAdd,
  handleAddColumnToSchema,
  isSubmittingColumn,
  colAddError,
  indexes,
  triggerDropIndex,
  indexForm,
  setIndexForm,
  handleAddIndex,
  isSubmittingIndex,
  foreignKeys,
  tables,
  fkForm,
  setFkForm,
  handleAddFK,
  isSubmittingFK
}: WorkspacePanelProps) {
  if (!selectedTable) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-col">
        <Table2 className="h-12 w-12 text-slate-200 dark:text-slate-800 mb-4" />
        <p>Select a table from the sidebar to view and manipulate its data.</p>
      </div>
    );
  }

  return (
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
        />
      )}

      {activeTab === "schema" && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <TableSchemaTab
            columns={columns}
            selectedTable={selectedTable}
            triggerDropColumn={triggerDropColumn}
            colToAdd={colToAdd}
            setColToAdd={setColToAdd}
            handleAddColumnToSchema={handleAddColumnToSchema}
            isSubmittingColumn={isSubmittingColumn}
            colAddError={colAddError}
          />

          <TableIndexesModal
            indexes={indexes}
            columns={columns}
            triggerDropIndex={triggerDropIndex}
            indexForm={indexForm}
            setIndexForm={setIndexForm}
            handleAddIndex={handleAddIndex}
            isSubmittingIndex={isSubmittingIndex}
          />

          <TableFkModal
            foreignKeys={foreignKeys}
            columns={columns}
            tables={tables}
            selectedTable={selectedTable}
            fkForm={fkForm}
            setFkForm={setFkForm}
            handleAddFK={handleAddFK}
            isSubmittingFK={isSubmittingFK}
          />
        </div>
      )}
    </>
  );
}
