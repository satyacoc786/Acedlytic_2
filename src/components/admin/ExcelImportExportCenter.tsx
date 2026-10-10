import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Eye,
  FileCheck,
  ArrowRight,
  Database,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const ExcelImportExportCenter: React.FC = () => {
  const [fileType, setFileType] = useState<'students' | 'staff' | 'calendar'>('students');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');

  // Dry-run preview state
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    totalRows: number;
    validRows: number;
    duplicateRows: number;
    errorRows: { row: number; reason: string }[];
  } | null>(null);

  // Commit state
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<{
    inserted: number;
    updated: number;
    failed: number;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setValidationResult(null);
    setCommitResult(null);

    const reader = new FileReader();
    reader.onload = (evt: any) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      setSheetNames(workbook.SheetNames);
      setActiveSheet(workbook.SheetNames[0]);

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      if (json.length > 0) {
        setHeaders(Object.keys(json[0]));
        setSheetData(json);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDryRunValidation = () => {
    setValidating(true);
    setTimeout(() => {
      const seenIds = new Set<string>();
      let valid = 0;
      let duplicates = 0;
      const errors: { row: number; reason: string }[] = [];

      sheetData.forEach((row, index) => {
        const rowNum = index + 1;
        const id = fileType === 'students'
          ? row['student_id'] || row['Roll Number'] || row['RollNo']
          : fileType === 'staff'
          ? row['Staff ID'] || row['staff_id']
          : row['SlNo'] || row['Date'] || index;

        if (!id) {
          errors.push({ row: rowNum, reason: 'Missing mandatory identifier column.' });
        } else if (seenIds.has(String(id).toUpperCase())) {
          duplicates++;
          errors.push({ row: rowNum, reason: `Duplicate identifier: ${id}` });
        } else {
          seenIds.add(String(id).toUpperCase());
          valid++;
        }
      });

      setValidationResult({
        totalRows: sheetData.length,
        validRows: valid,
        duplicateRows: duplicates,
        errorRows: errors,
      });
      setValidating(false);
    }, 600);
  };

  const handleCommitImport = async () => {
    if (sheetData.length === 0) return;
    setCommitting(true);

    try {
      const res = await fetch('/api/excel/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: fileType,
          records: sheetData,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCommitResult({
          inserted: data.inserted || 0,
          updated: data.updated || 0,
          failed: data.failed || 0,
        });
      }
    } catch (err: any) {
      console.error('Import commit error:', err);
    } finally {
      setCommitting(false);
    }
  };

  const downloadErrorReport = () => {
    if (!validationResult || validationResult.errorRows.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(validationResult.errorRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import_Errors');
    XLSX.writeFile(wb, `Acediytix_${fileType}_import_errors.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-sky-600" />
            <h1 className="text-xl font-bold text-slate-900">Excel Integration & Data Import Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload, preview, validate, and integrate institutional student, staff, and academic calendar spreadsheets.
          </p>
        </div>

        {/* Export Full Datasets */}
        <div className="flex items-center space-x-2">
          <a
            href="/api/excel/export/students"
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center space-x-1"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export 1000 Students</span>
          </a>
          <a
            href="/api/excel/export/calendar"
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center space-x-1"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Calendar</span>
          </a>
        </div>
      </div>

      {/* Target Dataset Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-700">Target Entity Schema:</span>
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs">
            {(['students', 'staff', 'calendar'] as const).map(type => (
              <button
                key={type}
                onClick={() => { setFileType(type); setSelectedFile(null); setSheetData([]); setValidationResult(null); setCommitResult(null); }}
                className={`px-4 py-1.5 rounded-lg font-semibold uppercase text-[11px] transition ${
                  fileType === type ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-400 hidden sm:block">
          Accepts .xlsx, .xls, .csv format files
        </span>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-slate-200 text-center hover:border-sky-400 transition">
        <Upload className="h-10 w-10 text-sky-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">Choose XLSX or CSV Spreadsheet</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Upload file or update current {fileType} dataset.
        </p>

        <label className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl cursor-pointer shadow-xs transition inline-flex items-center space-x-2">
          <Upload className="h-4 w-4" />
          <span>Select File from Disk</span>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {selectedFile && (
          <div className="mt-4 inline-flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>

      {/* Sheet Inspection & Preview (Top 10 rows) */}
      {sheetData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Eye className="h-4 w-4 text-sky-600" />
                <span>Spreadsheet Inspection & Preview</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Sheet: <span className="font-semibold">{activeSheet}</span> • Total Rows: {sheetData.length} • Detected Columns: {headers.length}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDryRunValidation}
                disabled={validating}
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition flex items-center space-x-1.5 shadow-xs"
              >
                {validating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileCheck className="h-3.5 w-3.5 text-sky-600" />}
                <span>Run Dry-Run Validation</span>
              </button>

              <button
                onClick={handleCommitImport}
                disabled={committing || (validationResult !== null && validationResult.validRows === 0)}
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl transition flex items-center space-x-1.5 shadow-xs"
              >
                {committing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
                <span>Commit to Active Database</span>
              </button>
            </div>
          </div>

          {/* Validation Result Banner */}
          {validationResult && (
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-4">
                <span className="text-emerald-700 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Valid Rows: {validationResult.validRows}</span>
                </span>
                {validationResult.duplicateRows > 0 && (
                  <span className="text-amber-700 font-bold">
                    Duplicates: {validationResult.duplicateRows}
                  </span>
                )}
                {validationResult.errorRows.length > 0 && (
                  <span className="text-rose-700 font-bold">
                    Errors: {validationResult.errorRows.length}
                  </span>
                )}
              </div>

              {validationResult.errorRows.length > 0 && (
                <button
                  onClick={downloadErrorReport}
                  className="px-3 py-1 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg font-semibold flex items-center space-x-1"
                >
                  <Download className="h-3 w-3" />
                  <span>Download Error Report (.xlsx)</span>
                </button>
              )}
            </div>
          )}

          {/* Commit Result Banner */}
          {commitResult && (
            <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-900 flex items-center space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Database updated successfully: </span>
                <span>{commitResult.inserted} inserted, {commitResult.updated} updated, {commitResult.failed} failed. Dashboards and ML metrics recalculated immediately!</span>
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3 py-2.5">#</th>
                  {headers.slice(0, 8).map(h => (
                    <th key={h} className="px-3 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sheetData.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2 text-slate-400 font-mono">{idx + 1}</td>
                    {headers.slice(0, 8).map(h => (
                      <td key={h} className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                        {String(row[h] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
