"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus, Trash2, Save } from "lucide-react";

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/10 backdrop-blur-2xl shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

export default function GuruServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [guruId, setGuruId] = useState<string | null>(null);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadServices() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/guru/login";
        return;
      }
      setGuruId(user.id);

      const { data: guruData } = await supabase
        .from("gurus")
        .select("services")
        .eq("id", user.id)
        .single();

      setServices(guruData?.services || []);
      setLoading(false);
    }
    loadServices();
  }, []);

  const addService = async () => {
    if (!guruId || !newServiceName || !newServicePrice) return;
    setSaving(true);

    const price = parseFloat(newServicePrice);
    const newService = {
      name: newServiceName,
      price: price,
      duration: newServiceDuration || "30 min",
    };

    const updatedServices = [...services, newService];

    const { error } = await supabase
      .from("gurus")
      .update({ services: updatedServices })
      .eq("id", guruId);

    if (!error) {
      setServices(updatedServices);
      setNewServiceName("");
      setNewServicePrice("");
      setNewServiceDuration("");
      alert("Service added successfully!");
    } else {
      alert("Failed to add service.");
    }
    setSaving(false);
  };

  const deleteService = async (index: number) => {
    if (!guruId) return;

    const updatedServices = services.filter((_, i) => i !== index);

    const { error } = await supabase
      .from("gurus")
      .update({ services: updatedServices })
      .eq("id", guruId);

    if (!error) {
      setServices(updatedServices);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading services...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold">My Services</h1>
            <p className="text-gray-400">Manage what customers can book from you</p>
          </div>
          <Link href="/guru/dashboard" className="text-emerald-400 hover:underline">← Back to Dashboard</Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Add New Service */}
          <GlassCard className="lg:col-span-5 p-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <Plus className="h-6 w-6" /> Add New Service
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Service Name</label>
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="e.g. 45-min Drop-in Visit"
                  className="w-full bg-[#111] border border-gray-700 rounded-2xl px-5 py-4 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Price ($)</label>
                  <input
                    type="number"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="45"
                    className="w-full bg-[#111] border border-gray-700 rounded-2xl px-5 py-4 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Duration</label>
                  <input
                    type="text"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    placeholder="45 min"
                    className="w-full bg-[#111] border border-gray-700 rounded-2xl px-5 py-4 text-white"
                  />
                </div>
              </div>

              <button
                onClick={addService}
                disabled={saving || !newServiceName || !newServicePrice}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 rounded-2xl font-semibold text-lg transition flex items-center justify-center gap-2"
              >
                {saving ? "Adding..." : "Add Service"}
                <Save className="h-5 w-5" />
              </button>
            </div>
          </GlassCard>

          {/* Current Services List */}
          <GlassCard className="lg:col-span-7 p-8">
            <h2 className="text-2xl font-semibold mb-6">Current Services</h2>

            {services.length > 0 ? (
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div key={index} className="bg-[#111] border border-gray-800 rounded-2xl p-6 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-lg">{service.name}</p>
                      <p className="text-emerald-400">${service.price} • {service.duration}</p>
                    </div>
                    <button
                      onClick={() => deleteService(index)}
                      className="text-red-400 hover:text-red-500 p-3"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                No services added yet.<br />
                Add your first service using the form on the left.
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}