/**
 * DocumentPreviewModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Modal d'aperçu document — identique en aperçu et en PDF imprimé.
 *
 * Usage :
 *   <DocumentPreviewModal
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     doc={documentData}
 *     company={company}
 *   />
 */

import { useEffect, type FC } from "react";
import { X, Printer, Download } from "lucide-react";
import { DocumentTemplate, type DocumentTemplateProps } from "./DocumentTemplate";
import { printDocument } from "@/lib/document-pdf";

type Props = DocumentTemplateProps & {
  open: boolean;
  onClose: () => void;
};

const DOC_ID = "doc-preview-main";

export const DocumentPreviewModal: FC<Props> = ({
  open,
  onClose,
  doc,
  company,
}) => {
  // Fermer avec Echap
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Bloquer le scroll du body quand la modal est ouverte
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const docTitle = `${doc.type === "devis" ? "Devis" : "Facture"} ${doc.number} — ${doc.client.companyName ?? doc.client.name}`;

  function handlePrint() {
    printDocument(DOC_ID, docTitle);
  }

  return (
    <>
      {/* ── Styles de la modal (non imprimés) ── */}
      <style>{`
        @media not print {
          .doc-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 24px 16px;
            overflow-y: auto;
          }
          .doc-modal-panel {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 24px 64px rgba(0,0,0,0.25);
            width: 860px;
            max-width: 100%;
            display: flex;
            flex-direction: column;
            margin-bottom: 24px;
          }
          .doc-modal-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
            position: sticky;
            top: 0;
            background: #fff;
            z-index: 10;
            border-radius: 12px 12px 0 0;
          }
          .doc-modal-title {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 480px;
          }
          .doc-modal-actions {
            display: flex;
            gap: 8px;
            flex-shrink: 0;
          }
          .doc-modal-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 14px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.15s;
          }
          .doc-modal-btn-ghost {
            background: transparent;
            border-color: #e5e7eb;
            color: #374151;
          }
          .doc-modal-btn-ghost:hover {
            background: #f9fafb;
          }
          .doc-modal-btn-primary {
            background: #0f172a;
            color: #fff;
            border-color: #0f172a;
          }
          .doc-modal-btn-primary:hover {
            background: #1e293b;
          }
          .doc-modal-btn-close {
            background: transparent;
            border-color: transparent;
            color: #6b7280;
            padding: 6px;
            border-radius: 6px;
          }
          .doc-modal-btn-close:hover {
            background: #f3f4f6;
            color: #111827;
          }
          .doc-modal-body {
            background: #f3f4f6;
            padding: 24px;
            overflow-x: auto;
            display: flex;
            justify-content: center;
            border-radius: 0 0 12px 12px;
          }
          .doc-modal-sheet {
            background: #fff;
            box-shadow:
              0 1px 3px rgba(0,0,0,0.1),
              0 8px 32px rgba(0,0,0,0.08);
            border-radius: 2px;
            flex-shrink: 0;
          }
        }
        /* Pendant impression : modal invisible, template visible */
        @media print {
          .doc-modal-overlay,
          .doc-modal-toolbar {
            display: none !important;
          }
          .doc-modal-body {
            padding: 0 !important;
            background: #fff !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="doc-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="doc-modal-panel">

          {/* ── Barre d'outils ── */}
          <div className="doc-modal-toolbar">
            <span className="doc-modal-title">{docTitle}</span>
            <div className="doc-modal-actions">
              <button
                className="doc-modal-btn doc-modal-btn-ghost"
                onClick={handlePrint}
                title="Imprimer"
              >
                <Printer size={15} />
                Imprimer
              </button>
              <button
                className="doc-modal-btn doc-modal-btn-primary"
                onClick={handlePrint}
                title="Télécharger en PDF"
              >
                <Download size={15} />
                Télécharger PDF
              </button>
              <button
                className="doc-modal-btn doc-modal-btn-close"
                onClick={onClose}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Aperçu du document ── */}
          <div className="doc-modal-body">
            <div className="doc-modal-sheet">
              <DocumentTemplate
                id={DOC_ID}
                doc={doc}
                company={company}
              />
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default DocumentPreviewModal;
