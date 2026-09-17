"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface User {
  id: string;
  nome: string;
  username: string;
}

export default function NovoDocumentoPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenant_slug as string;

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    nome: "",
    arquivo: null as File | null,
    assinantes: [] as string[],
  });

  const [assinantesOrdenados, setAssinantesOrdenados] = useState<string[]>([]);

  useEffect(() => {
    fetchUsuarios();
  }, [tenantSlug]);

  async function fetchUsuarios() {
    try {
      const res = await fetch(`/api/${tenantSlug}/usuarios`);
      const data = await res.json();
      if (res.ok) {
        setUsuarios(data.usuarios);
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  }

  function toggleAssinante(userId: string) {
    setForm((prev) => ({
      ...prev,
      assinantes: prev.assinantes.includes(userId)
        ? prev.assinantes.filter((a) => a !== userId)
        : [...prev.assinantes, userId],
    }));
    setAssinantesOrdenados(
      form.assinantes.includes(userId)
        ? form.assinantes.filter((a) => a !== userId)
        : [...form.assinantes, userId]
    );
  }

  function moveAssinante(index: number, direction: "up" | "down") {
    const newOrder = [...assinantesOrdenados];
    if (direction === "up" && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [
        newOrder[index - 1],
        newOrder[index],
      ];
    } else if (direction === "down" && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [
        newOrder[index + 1],
        newOrder[index],
      ];
    }
    setAssinantesOrdenados(newOrder);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!form.nome.trim() || !form.arquivo) {
      setError("Nome e arquivo são obrigatórios");
      setLoading(false);
      return;
    }

    if (form.assinantes.length === 0) {
      setError("Selecione pelo menos um assinante");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("nome", form.nome);
    formData.append("arquivo", form.arquivo);
    formData.append("assinantes", JSON.stringify(assinantesOrdenados));

    try {
      const res = await fetch(`/api/${tenantSlug}/documentos/create`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar documento");
        return;
      }

      setSuccess("Documento criado com sucesso!");
      setTimeout(() => {
        router.push(`/${tenantSlug}/documentos`);
      }, 1500);
    } catch (err) {
      setError("Erro ao conectar ao servidor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Novo Documento
        </h1>

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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Informações</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Documento
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) =>
                    setForm({ ...form, nome: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contrato de Gestão 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arquivo PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      arquivo: e.target.files?.[0] || null,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Assinantes</h2>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {usuarios.map((user) => (
                <label key={user.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.assinantes.includes(user.id)}
                    onChange={() => toggleAssinante(user.id)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {user.nome} ({user.username})
                  </span>
                </label>
              ))}
            </div>

            {assinantesOrdenados.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Ordem de Assinatura
                </h3>
                <div className="space-y-2">
                  {assinantesOrdenados.map((userId, idx) => {
                    const user = usuarios.find((u) => u.id === userId);
                    return (
                      <div
                        key={userId}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded"
                      >
                        <span className="text-sm text-gray-700">
                          {idx + 1}. {user?.nome}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => moveAssinante(idx, "up")}
                            disabled={idx === 0}
                            className="text-xs bg-gray-200 px-2 py-1 rounded disabled:opacity-50"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveAssinante(idx, "down")}
                            disabled={idx === assinantesOrdenados.length - 1}
                            className="text-xs bg-gray-200 px-2 py-1 rounded disabled:opacity-50"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Criando..." : "Lançar Documento"}
          </button>
        </form>
      </div>
    </div>
  );
}
