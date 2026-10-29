import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  FileSpreadsheet, 
  Table, 
  Copy, 
  Check, 
  Filter,
  Layers,
  FileText,
  FileCode,
  X
} from 'lucide-react';
import { 
  exportToCSV, 
  exportToExcel, 
  exportToJSON,
  exportTableToPdf,
  copyTableToClipboard, 
  ExportColumnDef 
} from '../../utils/exportUtils';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (item: T, index: number) => React.ReactNode;
  exportValue?: (item: T) => string | number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  subtitle?: string;
  filename?: string;
  searchPlaceholder?: string;
  initialRowsPerPage?: number;
  pageSize?: number;
  rowsPerPageOptions?: number[];
  pageSizeOptions?: number[];
  exportable?: boolean;
  enableExport?: boolean;
  enableGlobalSearch?: boolean;
  defaultSortKey?: string;
  defaultSortDirection?: 'asc' | 'desc' | string;
  emptyMessage?: string;
  extraHeaderActions?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  subtitle,
  filename = 'datos_tabla',
  searchPlaceholder = 'Buscar en la tabla...',
  initialRowsPerPage = 10,
  pageSize,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  pageSizeOptions,
  exportable = true,
  enableExport,
  enableGlobalSearch = true,
  defaultSortKey,
  defaultSortDirection = 'asc',
  emptyMessage = 'No se encontraron registros que coincidan con la búsqueda.',
  extraHeaderActions
}: DataTableProps<T>) {
  const effectiveInitialRows = pageSize ?? initialRowsPerPage;
  const effectiveRowsOptions = pageSizeOptions ?? rowsPerPageOptions;
  const effectiveExportable = enableExport !== undefined ? enableExport : exportable;

  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    defaultSortDirection === 'desc' ? 'desc' : 'asc'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(effectiveInitialRows);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // 1. Filtrado por búsqueda en tiempo real
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase().trim();

    return data.filter(item => {
      return Object.values(item).some(val => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [data, searchQuery]);

  // 2. Ordenamiento tri-estado
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  // 3. Paginación
  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Preparar columnas de exportación consistentes
  const exportCols: ExportColumnDef[] = columns.map(col => ({
    key: String(col.key),
    label: col.header,
    format: col.exportValue ? ((val: any) => val) : undefined
  }));

  const handleExportCSV = () => {
    const ok = exportToCSV(filename, sortedData, exportCols);
    showStatus(ok ? '✓ CSV descargado' : '⚠️ Error al exportar');
  };

  const handleExportExcel = () => {
    const ok = exportToExcel(filename, [
      {
        sheetName: title ? title.slice(0, 25).replace(/[\\/?*[\]]/g, '') : 'Reporte_Tabular',
        data: sortedData,
        columns: exportCols
      }
    ]);
    showStatus(ok ? '✓ XLSX descargado' : '⚠️ Error al exportar');
  };

  const handleExportPDF = () => {
    const ok = exportTableToPdf(
      filename,
      title || 'Reporte de Datos Tabulares',
      sortedData,
      exportCols,
      subtitle
    );
    showStatus(ok ? '✓ PDF generado' : '⚠️ Error al exportar');
  };

  const handleExportJSON = () => {
    const ok = exportToJSON(filename, sortedData);
    showStatus(ok ? '✓ JSON descargado' : '⚠️ Error al exportar');
  };

  const handleCopyClipboard = async () => {
    const success = await copyTableToClipboard(sortedData, exportCols);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showStatus('✓ Copiado al portapapeles');
    }
  };

  return (
    <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-4 sm:p-6 space-y-4">
      {/* Barra Superior: Título y Acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          {title && <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">{title}</h3>}
          {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Búsqueda y Exportación */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Input de Búsqueda */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="pl-8 pr-7 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-44 sm:w-56 font-medium transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botones de Exportación Multiformato */}
          {effectiveExportable && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                title="Descargar datos en CSV con codificación UTF-8 BOM"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>CSV</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                title="Descargar libro de Microsoft Excel (.xlsx)"
              >
                <Table className="w-3.5 h-3.5 text-teal-500" />
                <span>XLSX</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                title="Descargar reporte tabular oficial en formato PDF"
              >
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                <span>PDF</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="hidden sm:flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                title="Descargar datos en formato JSON"
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-500" />
                <span>JSON</span>
              </button>

              <button
                onClick={handleCopyClipboard}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                title="Copiar datos tabulares al portapapeles (formato TSV para Sheets/Excel)"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                <span className="hidden md:inline">{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          )}

          {statusMessage && (
            <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700">
              {statusMessage}
            </span>
          )}

          {extraHeaderActions}
        </div>
      </div>

      {/* Contenedor de Tabla Responsive */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              {columns.map((col, idx) => {
                const isSorted = sortKey === col.key;
                const canSort = col.sortable !== false;
                return (
                  <th
                    key={idx}
                    className={`p-3 select-none ${col.className || ''} ${canSort ? 'cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors' : ''}`}
                    onClick={() => canSort && handleSort(String(col.key))}
                    title={canSort ? `Ordenar por ${col.header}` : undefined}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {canSort && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-500 font-bold" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-500 font-bold" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`p-3 text-slate-800 dark:text-slate-200 ${col.className || ''}`}>
                      {col.render ? col.render(item, rowIdx) : String(item[col.key as keyof T] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación y Resumen Inferior */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
        <div className="flex items-center gap-2">
          <span>Mostrando <strong>{paginatedData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</strong> a <strong>{Math.min(currentPage * rowsPerPage, sortedData.length)}</strong> de <strong>{sortedData.length}</strong> {sortedData.length !== data.length && `(filtrados de ${data.length} totales)`}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Filas por página */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Filas:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {effectiveRowsOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Controles de Página */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-[11px] font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
