"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  masterUserId?: string;
  created_at: string;
}

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    logo: null as File | null,
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "GET",
      });
      const data = await res.json();
      if (res.ok) {
        setTenants(data.tenants);
      }
    } catch (err) {
      console.error("Erro ao carregar tenants:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!form.name.trim() || !form.slug.trim()) {
      setError("Nome e slug são obrigatórios");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("slug", form.slug);
    if (form.logo) {
      formData.append("logo", form.logo);
    }

    try {
      const res = await fetch("/api/admin/tenants/create", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar tenant");
        return;
      }

      setSuccess("Tenant criado com sucesso!");
      setForm({ name: "", slug: "", logo: null });
      setShowForm(false);
      fetchTenants();
    } catch (err) {
      setError("Erro ao conectar ao servidor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Tenants</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? "Cancelar" : "Novo Tenant"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Criar Novo Tenant</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="IGI"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    setForm({ ...form, slug: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="igi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setForm({ ...form, logo: e.target.files?.[0] || null })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? "Criando..." : "Criar Tenant"}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
            >
              {tenant.logo_url && (
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="w-full h-32 object-contain mb-4"
                />
              )}
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {tenant.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">/{tenant.slug}</p>
              <button
                onClick={() => router.push(`/${tenant.slug}/dashboard`)}
                className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition text-sm"
              >
                Acessar
              </button>
            </div>
          ))}
        </div>

        {tenants.length === 0 && !showForm && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Nenhum tenant criado ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
