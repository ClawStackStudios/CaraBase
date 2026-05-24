import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, Globe, Activity, Loader2, Save, ShieldAlert } from "lucide-react";
import { apiFetch } from "@/config/apiConfig";
import { useToast } from "@/context/ToastContext";

export default function SdkSettings() {
  const [corsOrigins, setCorsOrigins] = useState("");
  const [apiEnabled, setApiEnabled] = useState("true");
  const [rateLimit, setRateLimit] = useState("100");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await apiFetch('/api/system/settings');
      const { data } = await res.json();
      setCorsOrigins(data.cors_origins || "");
      setApiEnabled(data.api_enabled || "true");
      setRateLimit(data.rate_limit_per_minute || "100");
    } catch (err) {
      console.error(err);
      toast.error('Failed to load SDK settings');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveSettings() {
    setIsSaving(true);
    try {
      await apiFetch('/api/system/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            cors_origins: corsOrigins,
            api_enabled: apiEnabled,
            rate_limit_per_minute: rateLimit
          }
        })
      });
      toast.success('SDK settings updated successfully. Changes take effect immediately.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Network className="w-6 h-6 text-indigo-500" />
          SDK & Network Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configure external access, CORS, and rate limits for the CaraBase SDK and Public APIs.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Master Kill Switch */}
        <Card className="border-red-100 dark:border-red-900/30">
          <CardHeader className="bg-red-50/50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30">
            <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Master API Kill Switch
            </CardTitle>
            <CardDescription>
              Instantly disable all external traffic to the REST and Storage APIs. Internal dashboard usage will remain unaffected.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">Public Data API</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {apiEnabled === "true" ? "API is currently accepting external requests." : "API is completely disabled."}
                </p>
              </div>
              <button
                onClick={() => setApiEnabled(prev => prev === "true" ? "false" : "true")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                  apiEnabled === "true" ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    apiEnabled === "true" ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* CORS Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-500" />
              CORS Allowed Domains
            </CardTitle>
            <CardDescription>
              Comma-separated list of origins allowed to consume the CaraBase SDK (e.g. <code>https://my-app.vercel.app, https://example.com</code>). 
              Changes take effect instantly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <textarea
                value={corsOrigins}
                onChange={(e) => setCorsOrigins(e.target.value)}
                placeholder="https://example.com, https://app.example.com"
                className="w-full min-h-[100px] rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              Rate Limiting
            </CardTitle>
            <CardDescription>
              Protect your server from abuse. Define the maximum number of requests a single IP address can make per minute. Set to 0 to disable rate limiting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                Requests per Minute
              </label>
              <Input
                type="number"
                min="0"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={isSaving} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Network Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
