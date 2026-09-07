import React, { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (jobId: string, count: number) => void;
}

const SAMPLE_CSV = `businessName,domain,industry,city,state,phone,email
Stripe Inc,stripe.com,Financial Technology,San Francisco,CA,+1 415-555-0199,growth@stripe.com
Datadog,datadoghq.com,Cloud Monitoring,New York,NY,+1 212-555-0144,enterprise@datadoghq.com
Figma,figma.com,Design Software,San Francisco,CA,+1 415-555-0182,contact@figma.com
Snowflake,snowflake.com,Data Cloud,Bozeman,MT,+1 844-555-0120,sales@snowflake.com`;

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [csvContent, setCsvContent] = useState<string>(SAMPLE_CSV);
  const [autoEnrich, setAutoEnrich] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvContent(text);
        setError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      setError('Please paste or upload CSV content before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await axios.post('/api/ingest/csv', {
        csvText: csvContent,
        autoEnrich,
      });

      onImportSuccess(res.data.jobId, res.data.recordCount);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to process CSV import');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        id="csv-import-modal"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Direct B2B Lead CSV Ingestion</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Import custom corporate lead lists with automatic deduplication, MX verification &amp; scoring.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* File Upload Drop Area */}
          <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-lg p-4 text-center bg-slate-950/50 transition-colors">
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer block">
              <UploadCloud className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-200">Click to upload CSV or drag and drop</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Columns: businessName, domain, industry, city, state, phone, email
              </p>
            </label>
          </div>

          {/* Raw CSV Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">CSV Data Stream</label>
              <button
                type="button"
                onClick={() => setCsvContent(SAMPLE_CSV)}
                className="text-[11px] text-blue-400 hover:text-blue-300"
              >
                Reset to Sample
              </button>
            </div>
            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="businessName,domain,industry,city,state,phone,email"
            />
          </div>

          {/* Auto Enrich Option */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="csv-auto-enrich"
              checked={autoEnrich}
              onChange={(e) => setAutoEnrich(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="csv-auto-enrich" className="text-xs text-slate-300 cursor-pointer">
              Perform live DNS MX verification &amp; multi-attribute scoring on imported records
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isSubmitting}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center space-x-2 transition-colors disabled:opacity-50"
            id="submit-csv-import-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Ingesting Dataset...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Execute Ingestion Job</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
