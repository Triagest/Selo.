"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  fileName?: string;
}

export default function PDFViewer({ url, fileName = "Documento" }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-100">
      {/* Controls */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber === 1}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600"
          >
            ← Anterior
          </button>

          <span className="text-sm">
            Página {pageNumber} de {numPages}
          </span>

          <button
            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
            disabled={pageNumber === numPages}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600"
          >
            Próxima →
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm"
          >
            −
          </button>
          <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(Math.min(2, scale + 0.1))}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm"
          >
            +
          </button>
        </div>

        <p className="text-xs text-gray-400">{fileName}</p>
      </div>

      {/* PDF Container */}
      <div className="flex-1 overflow-auto flex justify-center bg-gray-900">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-600">Carregando PDF...</p>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-96">
              <p className="text-red-600">Erro ao carregar PDF</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  );
}
