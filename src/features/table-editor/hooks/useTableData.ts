import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/config/apiConfig";
import { useToast } from "@/context/ToastContext";

export function useTableData() {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [indexes, setIndexes] = useState<any[]>([]);
  const [foreignKeys, setForeignKeys] = useState<any[]>([]);

  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [loadingRows, setLoadingRows] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"ASC" | "DESC" | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchTables();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (selectedTable) {
      setPage(1);
      setSortCol(null);
      setSortDir(null);
      fetchTableData(selectedTable, 1, null, null);
    }
  }, [selectedTable]);

  async function fetchTables() {
    setLoading(true);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    try {
      const res = await apiFetch('/api/system/tables', { signal: abortControllerRef.current.signal });
      const data = await res.json();
      setTables(data);
      if (data.length > 0 && !selectedTable) setSelectedTable(data[0].name);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTableData(tableName: string, pageNum: number, orderBy: string | null = sortCol, direction: "ASC" | "DESC" | null = sortDir) {
    setLoadingRows(true);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    try {
      const [colsRes, idxRes, fkRes] = await Promise.all([
        apiFetch(`/api/system/tables/${tableName}/schema`, { signal }),
        apiFetch(`/api/system/tables/${tableName}/indexes`, { signal }),
        apiFetch(`/api/system/tables/${tableName}/foreign_keys`, { signal })
      ]);
      setColumns(await colsRes.json());
      setIndexes(await idxRes.json());
      setForeignKeys(await fkRes.json());

      const offset = (pageNum - 1) * pageSize;
      let url = `/rest/v1/${tableName}?limit=${pageSize + 1}&offset=${offset}`;
      if (orderBy && direction) url += `&order_by=${orderBy}&dir=${direction}`;

      const rowsRes = await apiFetch(url, { signal });
      if (!rowsRes.ok) throw new Error(await rowsRes.text());
      const data = await rowsRes.json();
      if (data.length > pageSize) {
         setHasMore(true);
         setRows(data.slice(0, pageSize));
      } else {
         setHasMore(false);
         setRows(data);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error(err);
        toast.error('Error fetching table data: ' + (err as Error).message);
      }
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

  return {
    tables, setTables,
    selectedTable, setSelectedTable,
    rows, setRows,
    columns, setColumns,
    loading, setLoading,
    indexes, setIndexes,
    foreignKeys, setForeignKeys,
    page, setPage,
    pageSize,
    loadingRows, setLoadingRows,
    hasMore, setHasMore,
    sortCol, setSortCol,
    sortDir, setSortDir,
    fetchTables, fetchTableData,
    handleNextPage, handlePrevPage, handleSortToggle
  };
}
