/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Truck, Shield, User, AlertCircle, MapPin, Bell } from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading");
  const [demoInfo, setDemoInfo] = useState<any>(null);

  useEffect(() => {
    fetch("/api/citizen/segregation-tips")
      .then((res) => {
        if (res.ok) setStatus("connected");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-emerald-600 p-6 text-white shadow-lg">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="h-8 w-8" />
            EcoConnect Backend Demo
          </h1>
          <p className="mt-2 text-emerald-100 opacity-90">
            Integrated Waste Management Management System
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Status Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              Backend Status
            </h2>
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : status === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} />
              <span className="font-medium text-slate-700">
                {status === 'connected' ? 'API Connected & Operational' : status === 'error' ? 'Connection Failed' : 'Checking Connection...'}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed">
              The Express server is running on port 3000. Use <code className="bg-slate-100 px-1 rounded">/api</code> as your base URL in the frontend.
            </p>
          </div>

          {/* Sample Credentials */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Demo Credentials
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Citizen:</span>
                <code className="text-blue-600">9876543210</code>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Driver:</span>
                <code className="text-blue-600">8000000001</code>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Admin:</span>
                <code className="text-blue-600">100</code>
              </div>
            </div>
          </div>

          {/* Quick Endpoints */}
          <div className="col-span-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Key API Endpoints</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Citizen Requests", path: "/api/citizen/requests", method: "POST", desc: "Missed/Bulk/Service" },
                { name: "Complaint History", path: "/api/citizen/complaints", method: "GET", desc: "Citizen view" },
                { name: "Unread Count", path: "/api/citizen/notifications/unread-count", method: "GET", desc: "Badge count" },
                { name: "Route Stops", path: "/api/driver/routes", method: "GET", desc: "Assigned stops" },
                { name: "Route Progress", path: "/api/driver/routes/progress", method: "GET", desc: "Summary stats" },
                { name: "Verify Stop", path: "/api/driver/routes/stops/:id/status", method: "PATCH", desc: "GPS requirement" },
                { name: "Admin Update", path: "/api/admin/complaints/:id", method: "PATCH", desc: "Manage requests" },
              ].map((route) => (
                <div key={route.path} className="rounded-lg bg-slate-50 p-3 flex flex-col gap-1 transition-colors hover:bg-slate-100 group">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-emerald-600 transition-colors">{route.method}</span>
                    <code className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{route.path}</code>
                  </div>
                  <span className="text-sm font-bold text-slate-700">{route.name}</span>
                  <span className="text-[11px] text-slate-500 italic">{route.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-xl bg-emerald-900 p-8 text-emerald-50 shadow-xl"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-400" />
            Backend Capabilities Extended
          </h2>
          <ul className="space-y-4 opacity-90 text-sm">
            <li className="flex gap-4">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-700 text-xs font-bold">1</span>
              <div>
                <p className="font-bold">Enhanced Citizen Requests</p>
                <p className="text-emerald-100/70">Unified POST endpoint handles missed pickups, bulk waste, and new bins with full metadata support (address, preferred time, notes).</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-700 text-xs font-bold">2</span>
              <div>
                <p className="font-bold">Verified Rider Routes</p>
                <p className="text-emerald-100/70">Mock geofencing logic implemented. Stops automatically transition to <span className="text-emerald-400 font-mono">verified</span> when the mock GPS enters the 50m radius.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-700 text-xs font-bold">3</span>
              <div>
                <p className="font-bold">Notification Engine</p>
                <p className="text-emerald-100/70">Automatic notification generation when admin updates complaint status or when new requests are submitted.</p>
              </div>
            </li>
          </ul>
        </motion.div>
      </main>
    </div>
  );
}

