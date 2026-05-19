import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Key, Shield, Table2 } from "lucide-react";
import { Link } from "react-router-dom";
import { apiFetch } from "@/config/apiConfig";

export default function Dashboard() {
  const [stats, setStats] = useState({
    tables: 0,
    keys: 0,
    policies: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [tables, keys, policies] = await Promise.all([
          apiFetch('/api/system/tables').then(res => res.json()),
          apiFetch('/api/system/keys').then(res => res.json()),
          apiFetch('/api/system/policies').then(res => res.json()),
        ]);
        setStats({
          tables: Array.isArray(tables) ? tables.length : 0,
          keys: Array.isArray(keys) ? keys.length : 0,
          policies: Array.isArray(policies) ? policies.length : 0,
        });
      } catch (err) {
        console.error("Failed to load stats", err);
      }
    }
    loadStats();
  }, []);

  const features = [
    { name: "Database Tables", stat: stats.tables, href: "/dashboard/editor", icon: Table2, desc: "Custom tables created" },
    { name: "API Keys", stat: stats.keys, href: "/dashboard/keys", icon: Key, desc: "Active API tokens" },
    { name: "RLS Policies", stat: stats.policies, href: "/dashboard/policies", icon: Shield, desc: "Security rules" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Project Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome to CaraBase. Manage your database, authentication, and rules.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((item) => (
          <Link key={item.name} to={item.href}>
            <Card className="hover:border-blue-200 hover:shadow-md transition-all cursor-pointer h-full border-slate-200/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  {item.name}
                </CardTitle>
                <item.icon className="h-5 w-5 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{item.stat}</div>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-8 border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-8 md:px-8 md:py-10 bg-slate-900 text-white rounded-t-xl">
          <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-semibold">Ready to build</h2>
          </div>
          <p className="my-4 text-slate-300 max-w-2xl leading-relaxed">
            Your self-hosted SQLite instance is running perfectly. Create a table, generate an API key,
            and start interacting with your REST API over <code className="text-blue-300 bg-blue-900/30 px-1.5 py-0.5 rounded font-mono text-sm">/rest/v1/...</code> instantly.
          </p>
        </div>
      </Card>
    </div>
  );
}
