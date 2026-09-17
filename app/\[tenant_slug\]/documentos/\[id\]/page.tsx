"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PDFViewer from "@/components/PDFViewer";

interface DocumentDetail {
  id: string;
  nome: string;
  arquivo_url: string;
  status: string;
  criado_por: string;
  criado_em: string;
  assinatura_do_usuario?: {
    assinatura_visual_url: string;
  };
}

export default function DocumentoPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenant_slug as string;
  const docId = params.id as string;

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchDocumento();
  }, [tenantSlug, docId]);

  async function fetchDocumento() {
    try {
      const res = await fetch(
        `/api/${tenantSlug}/documentos/${docId}`
      );
      const data = await res.json();
      if (res.ok) {
        setDoc(data.documento);
      } else {
        setError("Documento não encontrado");
      }
    } catch (err) {
      console.error("Erro:", err);
      setError("Erro ao carregar documento");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssinar() {
    setSigning(true);
    setError("");

    try {
      const res = await fetch(
        `/api/${tenantSlug}/assinatura/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documento_id: docId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao assinar");
        return;
      }

      setSuccess("Documento assinado com sucesso!");
      setTimeout(() => {
        router.push(`/${tenantSlug}/pendentes`);
      }, 2000);
    } catch (err) {
      setError("Erro ao conectar ao servidor");
      console.error(err);
    } finally {
      setSigning(false);
    }
  }

  if (loading) return <div className="p-6 text-center">Carregando...</div>;
  if (!doc) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{doc.nome}</h1>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Voltar
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

        <div className="grid grid-cols-3 gap-6">
          {/* Document Viewer */}
          <div className="col-span-2 bg-white rounded-lg shadow overflow-hidden">
            {doc.arquivo_url ? (
              <PDFViewer url={doc.arquivo_url} fileName={doc.nome} />
            ) : (
              <div className="p-8 min-h-96 flex items-center justify-center">
                <p className="text-gray-600">Documento não disponível</p>
              </div>
            )}
          </div>

          {/* Signature Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Assinatura</h2>

            {doc.assinatura_do_usuario?.assinatura_visual_url ? (
              <div>
                <img
                  src={doc.assinatura_do_usuario.assinatura_visual_url}
                  alt="Assinatura"
                  className="w-full mb-4 border border-gray-300 p-2 rounded"
                />
                <p className="text-sm text-gray-600 mb-6 text-center">
                  Sua assinatura
                </p>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 mb-6 border-2 border-dashed border-gray-300 flex items-center justify-center min-h-32">
                <p className="text-gray-500 text-sm text-center">
                  Sua assinatura será exibida aqui
                </p>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <div className="text-sm">
                <p className="text-gray-600">Status: </p>
                <span className="font-semibold text-gray-800">
                  {doc.status}
                </span>
              </div>
              <div className="text-sm">
                <p className="text-gray-600">Criado em:</p>
                <span className="font-semibold text-gray-800">
                  {new Date(doc.criado_em).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>

            <button
              onClick={handleAssinar}
              disabled={signing || doc.status === "COMPLETO"}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {signing ? "Assinando..." : "Assinar Documento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
