"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface AuditLog {
  id: string;
  usuario: { nome: string; username: string };
  acao: string;
  recurso_id?: string;
  detalhes: string;
  created_at: string;
}

export default function AuditoriaPage() {
  const params = useParams();
  const tenantSlug = params.tenant_slug as string;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchAuditLogs();
  }, [tenantSlug]);

  async function fetchAuditLogs() {
    try {
      const res = await fetch(`/api/${tenantSlug}/audit`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  }

  const actionColor: Record<string, string> = {
    ASSINOU_DOCUMENTO: "bg-green-100 text-green-800",
    CRIOU_DOCUMENTO: "bg-blue-100 text-blue-800",
    CRIOU_USUARIO: "bg-purple-100 text-purple-800",
    DELETOU_USUARIO: "bg-red-100 text-red-800",
  };

  const filtered = logs.filter((log) =>
    filter === ""
      ? true
      : log.acao.toLowerCase().includes(filter.toLowerCase()) ||
        log.usuario.nome.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Auditoria</h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Filtrar por ação ou usuário..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Ação
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Recurso
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-800 font-medium">
                      {log.usuario.nome}
                      <span className="block text-xs text-gray-500">
                        ({log.usuario.username})
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded ${
                          actionColor[log.acao] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {log.acao}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {log.recurso_id ? (
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {log.recurso_id}
                        </code>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      <details className="cursor-pointer">
                        <summary className="text-blue-600 hover:text-blue-800">
                          Ver
                        </summary>
                        <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-auto max-w-xs">
                          {log.detalhes}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                Nenhum evento encontrado
              </div>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800 border border-blue-200">
          <p className="font-semibold mb-2">ℹ️ Sobre o Audit Log</p>
          <p>
            Este log é append-only (apenas leitura/adição) e registra todas as
            ações do sistema para conformidade com Lei 14.063.
          </p>
        </div>
      </div>
    </div>
  );
}
