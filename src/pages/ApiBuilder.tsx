import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Code, Plus, Trash2, Database, Play, CheckCircle, XCircle, Info, ChevronRight, HelpCircle, Layers, CheckSquare, Loader2 } from "lucide-react";
import { apiFetch } from "@/config/apiConfig";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/context/ToastContext";

interface Endpoint {
  id: string;
  name: string;
  path: string;
  method: string;
  table_name: string;
  schema: string;
  created_at: string;
}

export default function ApiBuilder() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [method, setMethod] = useState("GET");
  const [tableName, setTableName] = useState("");
  const [availableColumns, setAvailableColumns] = useState<any[]>([]);
  
  // GET-specific schema states
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [enablePagination, setEnablePagination] = useState(false);
  const [enableSorting, setEnableSorting] = useState(false);
  const [staticFilters, setStaticFilters] = useState<any[]>([]);
  const [newFilterField, setNewFilterField] = useState("");
  const [newFilterOp, setNewFilterOp] = useState("=");
  const [newFilterVal, setNewFilterVal] = useState("");

  // Write-specific validation states
  const [validationRules, setValidationRules] = useState<any[]>([]);
  const [newValField, setNewValField] = useState("");
  const [newValType, setNewValType] = useState("string");
  const [newValRequired, setNewValRequired] = useState(true);

  // Test Console states
  const [selectedApiKey, setSelectedApiKey] = useState("");
  const [testQueryParams, setTestQueryParams] = useState("");
  const [testRequestBody, setTestRequestBody] = useState("");
  const [testResult, setTestResult] = useState<{ status: number; data: any } | null>(null);
  const [testingInProgress, setTestingInProgress] = useState(false);

  // Dialog state
  const [endpointToRemove, setEndpointToRemove] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchEndpoints();
    fetchTables();
    fetchApiKeys();
  }, []);

  useEffect(() => {
    if (tableName) {
      fetchColumns(tableName);
    } else {
      setAvailableColumns([]);
    }
    // Reset columns/validation selections on table change
    setSelectedColumns([]);
    setStaticFilters([]);
    setValidationRules([]);
  }, [tableName]);

  async function fetchEndpoints() {
    try {
      const res = await apiFetch('/api/system/endpoints');
      if (res.ok) {
        const data = await res.json();
        setEndpoints(data);
        if (data.length > 0 && !selectedEndpoint) {
          setSelectedEndpoint(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch endpoints", err);
    }
  }

  async function fetchTables() {
    try {
      const res = await apiFetch('/api/system/tables');
      if (res.ok) {
        const data = await res.json();
        setTables(data);
        if (data.length > 0 && !tableName) {
          setTableName(data[0].name);
        }
      }
    } catch (err) {
      console.error("Failed to fetch tables", err);
    }
  }

  async function fetchColumns(tName: string) {
    try {
      const res = await apiFetch(`/api/system/tables/${tName}/columns`);
      if (res.ok) {
        const cols = await res.json();
        setAvailableColumns(cols);
      }
    } catch (err) {
      console.error("Failed to fetch columns", err);
    }
  }

  async function fetchApiKeys() {
    try {
      const res = await apiFetch('/api/system/keys');
      if (res.ok) {
        const keys = await res.json();
        setApiKeys(keys);
        if (keys.length > 0) {
          setSelectedApiKey(keys[0].key);
        }
      }
    } catch (err) {
      console.error("Failed to fetch API keys", err);
    }
  }

  const addStaticFilter = () => {
    if (!newFilterField || !newFilterVal) return;
    setStaticFilters([...staticFilters, {
      field: newFilterField,
      operator: newFilterOp,
      value: newFilterVal
    }]);
    setNewFilterField("");
    setNewFilterVal("");
  };

  const removeStaticFilter = (index: number) => {
    setStaticFilters(staticFilters.filter((_, i) => i !== index));
  };

  const addValidationRule = () => {
    if (!newValField) return;
    // Prevent duplicate validation rules for the same field
    if (validationRules.some(r => r.field === newValField)) return;
    setValidationRules([...validationRules, {
      field: newValField,
      type: newValType,
      required: newValRequired
    }]);
    setNewValField("");
  };

  const removeValidationRule = (index: number) => {
    setValidationRules(validationRules.filter((_, i) => i !== index));
  };

  const createEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !path || !tableName) return;

    // Clean dynamic path (trim leading slashes etc.)
    let cleanPath = path.trim().replace(/^\/+/, '').replace(/\/+$/, '');

    const schemaObj = {
      columns: method === 'GET' ? selectedColumns : [],
      pagination: method === 'GET' ? enablePagination : false,
      sorting: method === 'GET' ? enableSorting : false,
      filters: method === 'GET' ? staticFilters : [],
      validation: method !== 'GET' ? validationRules : []
    };

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/system/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          path: cleanPath,
          method,
          table_name: tableName,
          schema: schemaObj
        })
      });

      if (res.ok) {
        const newEp = await res.json();
        setEndpoints([newEp, ...endpoints]);
        setSelectedEndpoint(newEp);
        // Reset form
        setName("");
        setPath("");
        setSelectedColumns([]);
        setStaticFilters([]);
        setValidationRules([]);
        toast.success(`Endpoint ${name} created successfully`);
      } else {
        const err = await res.json();
        toast.error(`Error: ${err.error}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEndpoint = async () => {
    if (!endpointToRemove) return;
    try {
      const res = await apiFetch(`/api/system/endpoints/${endpointToRemove}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const nextList = endpoints.filter(ep => ep.id !== endpointToRemove);
        setEndpoints(nextList);
        if (selectedEndpoint?.id === endpointToRemove) {
          setSelectedEndpoint(nextList.length > 0 ? nextList[0] : null);
        }
        toast.success('Endpoint deleted successfully');
      } else {
        const err = await res.json();
        toast.error(`Error deleting endpoint: ${err.error}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to delete endpoint: ${err.message}`);
    } finally {
      setEndpointToRemove(null);
    }
  };

  const runTestRequest = async () => {
    if (!selectedEndpoint) return;
    setTestingInProgress(true);
    setTestResult(null);

    const isWrite = ['POST', 'PATCH', 'PUT'].includes(selectedEndpoint.method);
    const host = window.location.origin; // Dynamically uses visual LAN ip or domain
    const targetUrl = `${host}/rest/v1/custom/${selectedEndpoint.path}${testQueryParams ? '?' + testQueryParams.replace(/^\?/, '') : ''}`;

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'apikey': selectedApiKey,
          'Content-Type': 'application/json'
        }
      };

      if (isWrite && testRequestBody) {
        options.body = testRequestBody;
      }

      const res = await fetch(targetUrl, options);
      const data = await res.json();
      setTestResult({
        status: res.status,
        data
      });
    } catch (err: any) {
      setTestResult({
        status: 500,
        data: { error: err.message || "Failed to contact local REST endpoint" }
      });
    } finally {
      setTestingInProgress(false);
    }
  };

  const getMethodBadge = (m: string) => {
    switch (m) {
      case 'GET': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'POST': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'PATCH': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'DELETE': return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
    }
  };

  const getCurlCommand = () => {
    if (!selectedEndpoint) return '';
    const host = window.location.origin;
    const isWrite = ['POST', 'PATCH', 'PUT'].includes(selectedEndpoint.method);
    const paramStr = testQueryParams ? `?${testQueryParams.replace(/^\?/, '')}` : '';
    let curl = `curl -X ${selectedEndpoint.method} "${host}/rest/v1/custom/${selectedEndpoint.path}${paramStr}" \\\n`;
    curl += `  -H "apikey: ${selectedApiKey || 'pk_...'}"`;
    if (isWrite) {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n`;
      curl += `  -d '${testRequestBody || '{}'}'`;
    }
    return curl;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Code className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          Visual REST API Builder
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Dynamically generate, parameterize, and test secure RESTful APIs mapped directly to SQLite tables.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: API Endpoint List & Endpoint Creator */}
        <div className="space-y-6 lg:col-span-1">
          {/* Creator Form */}
          <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-500" />
                Build Endpoint
              </CardTitle>
              <CardDescription className="text-xs">
                Design schema rules for a new dynamic endpoint route.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={createEndpoint} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Endpoint Name</label>
                  <Input
                    required
                    placeholder="e.g. Fetch Active Products"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Method</label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md py-1.5 px-2 text-xs text-slate-900 dark:text-slate-50 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Map To Table</label>
                    <select
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md py-1.5 px-2 text-xs text-slate-900 dark:text-slate-50 focus:outline-none focus:border-emerald-500 font-mono"
                    >
                      {tables.map(t => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Route Path</label>
                  <div className="flex items-center">
                    <span className="bg-slate-100 dark:bg-slate-800 border-y border-l border-slate-200 dark:border-slate-850 px-2.5 py-1.5 text-xs text-slate-400 dark:text-slate-500 rounded-l-md font-mono select-none">
                      /custom/
                    </span>
                    <Input
                      required
                      placeholder="e.g. active-products"
                      value={path}
                      onChange={(e) => setPath(e.target.value)}
                      className="text-xs rounded-l-none font-mono focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Sub-panels based on Method */}
                {method === 'GET' && (
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckSquare className="h-3.5 w-3.5" /> Expose Columns
                      </span>
                      <div className="max-h-24 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded p-2 bg-slate-50/50 dark:bg-slate-900/30 space-y-1">
                        {availableColumns.map(col => (
                          <label key={col.name} className="flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-355 cursor-pointer hover:text-slate-900">
                            <input
                              type="checkbox"
                              checked={selectedColumns.includes(col.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedColumns([...selectedColumns, col.name]);
                                } else {
                                  setSelectedColumns(selectedColumns.filter(c => c !== col.name));
                                }
                              }}
                              className="rounded text-emerald-500 focus:ring-emerald-500 border-slate-300 dark:border-slate-800 h-3.5 w-3.5"
                            />
                            {col.name} <span className="text-[9px] text-slate-400">({col.type})</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enablePagination}
                          onChange={(e) => setEnablePagination(e.target.checked)}
                          className="rounded text-emerald-500 border-slate-300 dark:border-slate-800 h-3.5 w-3.5"
                        />
                        Pagination
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableSorting}
                          onChange={(e) => setEnableSorting(e.target.checked)}
                          className="rounded text-emerald-500 border-slate-300 dark:border-slate-800 h-3.5 w-3.5"
                        />
                        Sorting
                      </label>
                    </div>

                    {/* Static Filters */}
                    <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Static Filter Rules</span>
                      {staticFilters.map((sf, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-100 dark:bg-slate-850 py-1 px-2 rounded text-[11px] font-mono">
                          <span>{sf.field} {sf.operator} '{sf.value}'</span>
                          <button type="button" onClick={() => removeStaticFilter(index)} className="text-rose-500 hover:text-rose-700 bg-transparent border-0 cursor-pointer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        <select
                          value={newFilterField}
                          onChange={(e) => setNewFilterField(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-1 text-[10px] text-slate-900 dark:text-slate-50 font-mono"
                        >
                          <option value="">Field...</option>
                          {availableColumns.map(col => (
                            <option key={col.name} value={col.name}>{col.name}</option>
                          ))}
                        </select>
                        <select
                          value={newFilterOp}
                          onChange={(e) => setNewFilterOp(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-1 text-[10px] text-slate-900 dark:text-slate-50"
                        >
                          <option value="=">=</option>
                          <option value="!=">!=</option>
                          <option value=">">&gt;</option>
                          <option value="<">&lt;</option>
                          <option value=">=">&gt;=</option>
                          <option value="<=">&lt;=</option>
                          <option value="LIKE">LIKE</option>
                        </select>
                        <input
                          placeholder="Value"
                          value={newFilterVal}
                          onChange={(e) => setNewFilterVal(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-1 text-[10px] text-slate-900 dark:text-slate-50"
                        />
                      </div>
                      <Button type="button" onClick={addStaticFilter} variant="outline" className="w-full text-[10px] h-7 border-dashed">
                        + Add Filter Rule
                      </Button>
                    </div>
                  </div>
                )}

                {/* Validation Rules Builder for Writing Methods */}
                {['POST', 'PATCH', 'PUT'].includes(method) && (
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" /> Validation Rules
                      </span>
                      {validationRules.map((rule, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-100 dark:bg-slate-850 py-1 px-2 rounded text-[11px] font-mono">
                          <span>{rule.field}: <span className="text-blue-500">{rule.type}</span>{rule.required && <span className="text-red-500 font-bold ml-1">*</span>}</span>
                          <button type="button" onClick={() => removeValidationRule(idx)} className="text-rose-500 hover:text-rose-700 bg-transparent border-0 cursor-pointer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-1 pt-1">
                        <select
                          value={newValField}
                          onChange={(e) => setNewValField(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-1 text-[10px] text-slate-900 dark:text-slate-50 font-mono"
                        >
                          <option value="">Field...</option>
                          {availableColumns.filter(c => c.name !== 'id').map(col => (
                            <option key={col.name} value={col.name}>{col.name}</option>
                          ))}
                        </select>
                        <select
                          value={newValType}
                          onChange={(e) => setNewValType(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-1 text-[10px] text-slate-900 dark:text-slate-50"
                        >
                          <option value="string">string</option>
                          <option value="number">number</option>
                          <option value="boolean">boolean</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={newValRequired}
                            onChange={(e) => setNewValRequired(e.target.checked)}
                            className="rounded text-emerald-500 border-slate-300 dark:border-slate-800 h-3 w-3"
                          />
                          Required Parameter
                        </label>
                        <Button type="button" onClick={addValidationRule} variant="outline" className="text-[10px] h-6 px-3 border-dashed">
                          + Add Rule
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Create Dynamic REST API
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Endpoints List */}
          <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-sm font-semibold">Active Custom APIs</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[300px] overflow-y-auto">
              {endpoints.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
                  <Info className="h-6 w-6 stroke-1 text-slate-300" />
                  No custom endpoints mapped yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {endpoints.map((ep) => {
                    const isSelected = selectedEndpoint?.id === ep.id;
                    return (
                      <div
                        key={ep.id}
                        onClick={() => setSelectedEndpoint(ep)}
                        className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors ${isSelected ? 'bg-slate-100/50 dark:bg-slate-900/50' : ''}`}
                      >
                        <div className="space-y-1 overflow-hidden pr-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider ${getMethodBadge(ep.method)}`}>
                              {ep.method}
                            </span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-50 truncate">{ep.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            /custom/{ep.path}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEndpointToRemove(ep.id);
                          }}
                          className="text-slate-400 hover:text-rose-500 bg-transparent border-0 cursor-pointer p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Schema Inspector & Shell Testing Console */}
        <div className="space-y-6 lg:col-span-2">
          {selectedEndpoint ? (
            <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${getMethodBadge(selectedEndpoint.method)}`}>
                        {selectedEndpoint.method}
                      </span>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">{selectedEndpoint.name}</h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Target Path: <code className="text-emerald-500 font-mono">/rest/v1/custom/{selectedEndpoint.path}</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-850 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 font-mono">
                    <Database className="h-3 w-3" />
                    Table: {selectedEndpoint.table_name}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6 flex-1">
                
                {/* 1. Endpoint Configuration Spec */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dynamic Spec Schema</h3>
                  <div className="bg-slate-900 dark:bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-350 leading-relaxed max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(typeof selectedEndpoint.schema === 'string' ? JSON.parse(selectedEndpoint.schema) : selectedEndpoint.schema, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* 2. High-Fidelity Shell Test Console */}
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
                    <Play className="h-3.5 w-3.5 text-blue-500" />
                    Live Curl & Endpoint Testing Console
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* API Key selector & Query String parameters */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Select API Authentication Key</label>
                        <select
                          value={selectedApiKey}
                          onChange={(e) => setSelectedApiKey(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md py-1.5 px-2 text-xs text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 font-mono"
                        >
                          {apiKeys.map(k => (
                            <option key={k.id} value={k.key}>{k.name} ({k.type})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Query String Parameters</label>
                        <Input
                          placeholder="e.g. status=published&limit=5"
                          value={testQueryParams}
                          onChange={(e) => setTestQueryParams(e.target.value)}
                          className="text-xs font-mono focus:border-blue-500"
                        />
                        <p className="text-[9px] text-slate-400">
                          Configure dynamic filters using parameter keys (e.g. `title=eq.Draft` or custom SQLi filtering).
                        </p>
                      </div>
                    </div>

                    {/* Write JSON payload for POST/PATCH */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Request Payload (JSON)</label>
                      <textarea
                        disabled={!['POST', 'PATCH', 'PUT'].includes(selectedEndpoint.method)}
                        placeholder='e.g. { "name": "Modern Tablet", "price": 499 }'
                        value={testRequestBody}
                        onChange={(e) => setTestRequestBody(e.target.value)}
                        className="w-full h-[95px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-2 text-xs text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* curl box */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Equivalent Shell CURL</span>
                    <pre className="bg-slate-950 p-3 rounded border border-slate-900 font-mono text-[9px] text-slate-400 whitespace-pre-wrap select-all leading-normal leading-relaxed">
                      {getCurlCommand()}
                    </pre>
                  </div>

                  {/* Run Request Button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={runTestRequest}
                      disabled={testingInProgress}
                      className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9 px-5"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      {testingInProgress ? 'Executing Command...' : 'Run REST Query'}
                    </Button>
                  </div>

                  {/* Live Response Panel */}
                  {testResult && (
                    <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">REST Server Response</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider flex items-center gap-1 ${
                          testResult.status >= 200 && testResult.status < 300 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {testResult.status >= 200 && testResult.status < 300 ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          STATUS: {testResult.status}
                        </span>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-200 overflow-x-auto shadow-inner leading-relaxed max-h-56">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(testResult.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                </div>

              </CardContent>
            </Card>
          ) : (
            <div className="h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-10 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 gap-3 min-h-[400px]">
              <Code className="h-10 w-10 text-slate-350 stroke-1" />
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Endpoint Selected</h3>
                <p className="text-xs text-slate-450 mt-1 max-w-xs leading-relaxed">
                  Design a path to map custom query parameter configurations to a specific database table and click Create.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      <ConfirmDialog
        isOpen={endpointToRemove !== null}
        title="Revoke Dynamic API Endpoint"
        description="Are you absolutely sure you want to delete this custom API endpoint? Incoming REST requests to this path will immediately return 404."
        confirmText="Delete Endpoint"
        onConfirm={deleteEndpoint}
        onCancel={() => setEndpointToRemove(null)}
      />
    </div>
  );
}
