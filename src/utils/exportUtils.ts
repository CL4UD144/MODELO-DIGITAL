import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Utilidades universales de exportación científica para el Gemelo Digital de Turberas Chirimayo.
 * Soporta CSV (UTF-8 BOM), Excel XLSX, JSON, PDF vectorial/documental, SVG editable, 
 * PNG en alta resolución (300 DPI / 3x), HTML interactivo autónomo y Portapapeles (TSV).
 */

export interface ExportColumnDef {
  key: string;
  label: string;
  format?: (val: any) => string | number;
}

/**
 * Convierte un arreglo de objetos a CSV con codificación UTF-8 BOM para compatibilidad total con Excel en español.
 */
export function exportToCSV(
  filename: string,
  data: any[],
  columns?: ExportColumnDef[]
): boolean {
  try {
    if (!data || data.length === 0) {
      console.warn('exportToCSV: No hay datos para exportar.');
      return false;
    }

    const cols: ExportColumnDef[] = columns && columns.length > 0
      ? columns
      : Object.keys(data[0]).map(k => ({ key: k, label: k }));

    // Encabezados
    const headerRow = cols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');

    // Filas de datos
    const rows = data.map(item => {
      return cols.map(col => {
        const val = item[col.key];
        const formatted = col.format ? col.format(val) : val;
        if (formatted === null || formatted === undefined) return '""';
        if (typeof formatted === 'number') return formatted.toString();
        return `"${String(formatted).replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, ensureExtension(filename, '.csv'));
    return true;
  } catch (err) {
    console.error('Error al exportar a CSV:', err);
    return false;
  }
}

/**
 * Exporta datos a un libro Excel (.xlsx) nativo con formato de columnas ajustadas.
 */
export function exportToExcel(
  filename: string,
  sheets: { sheetName: string; data: any[]; columns?: ExportColumnDef[] }[]
): boolean {
  try {
    const wb = XLSX.utils.book_new();

    sheets.forEach(({ sheetName, data, columns }) => {
      if (!data || data.length === 0) return;

      const formattedData = data.map(row => {
        if (!columns) return row;
        const mapped: Record<string, any> = {};
        columns.forEach(col => {
          const val = row[col.key];
          mapped[col.label] = col.format ? col.format(val) : val;
        });
        return mapped;
      });

      const ws = XLSX.utils.json_to_sheet(formattedData);

      // Ajuste automático de ancho de columnas
      const colKeys = Object.keys(formattedData[0] || {});
      const colWidths = colKeys.map(k => {
        const maxLen = Math.max(
          k.length,
          ...formattedData.slice(0, 100).map(r => String(r[k] ?? '').length)
        );
        return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
      });
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31)); // Excel limita nombre a 31 caracteres
    });

    XLSX.writeFile(wb, ensureExtension(filename, '.xlsx'));
    return true;
  } catch (err) {
    console.error('Error al exportar a Excel:', err);
    return false;
  }
}

/**
 * Exporta cualquier estructura de datos a JSON formateado e identado.
 */
export function exportToJSON(filename: string, data: any): boolean {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    triggerDownload(blob, ensureExtension(filename, '.json'));
    return true;
  } catch (err) {
    console.error('Error al exportar a JSON:', err);
    return false;
  }
}

/**
 * Copia los datos tabulares al portapapeles en formato TSV (Tab-Separated Values).
 * Permite pegar directamente en Microsoft Excel o Google Sheets.
 */
export async function copyTableToClipboard(
  data: any[],
  columns?: ExportColumnDef[]
): Promise<boolean> {
  try {
    if (!data || data.length === 0) return false;

    const cols: ExportColumnDef[] = columns && columns.length > 0
      ? columns
      : Object.keys(data[0]).map(k => ({ key: k, label: k }));

    const headerRow = cols.map(c => c.label).join('\t');
    const rows = data.map(item => {
      return cols.map(col => {
        const val = item[col.key];
        const formatted = col.format ? col.format(val) : val;
        return (formatted === null || formatted === undefined) ? '' : String(formatted).replace(/\t|\r?\n/g, ' ');
      }).join('\t');
    });

    const tsvContent = [headerRow, ...rows].join('\n');
    await navigator.clipboard.writeText(tsvContent);
    return true;
  } catch (err) {
    console.error('Error copiando datos al portapapeles:', err);
    return false;
  }
}

/**
 * Prepara y estiliza un elemento SVG para exportación en Modo Claro estricto
 * (fondo blanco puro, textos negros/grises oscuros, ejes visibles y cuadrícula sutil).
 * Garantiza legibilidad impecable tanto si la aplicación está en modo oscuro o claro.
 */
export function prepareSvgForLightExport(
  containerOrSvg: HTMLElement | SVGSVGElement,
  customTitle?: string
): { svgString: string; width: number; height: number } | null {
  try {
    let svg: SVGSVGElement | null = null;
    let legendWrapper: HTMLElement | null = null;

    if (containerOrSvg instanceof SVGSVGElement) {
      svg = containerOrSvg;
    } else {
      legendWrapper = containerOrSvg.querySelector('.recharts-legend-wrapper, .recharts-default-legend');
      // Buscar todos los elementos SVG dentro del contenedor
      const allSvgs = Array.from(containerOrSvg.querySelectorAll('svg'));
      if (allSvgs.length === 1) {
        svg = allSvgs[0];
      } else if (allSvgs.length > 1) {
        // En Recharts con <Legend>, existen mini-SVGs de 14x14px dentro de .recharts-legend-wrapper.
        // Filtramos para seleccionar exclusivamente la superficie principal del gráfico.
        const nonLegendSvgs = allSvgs.filter(s => !s.closest('.recharts-legend-wrapper'));
        const pool = nonLegendSvgs.length > 0 ? nonLegendSvgs : allSvgs;
        svg = pool.reduce((largest, curr) => {
          const rCurr = curr.getBoundingClientRect();
          const rLargest = largest.getBoundingClientRect();
          const areaCurr = (rCurr.width || parseFloat(curr.getAttribute('width') || '1')) * (rCurr.height || parseFloat(curr.getAttribute('height') || '1'));
          const areaLargest = (rLargest.width || parseFloat(largest.getAttribute('width') || '1')) * (rLargest.height || parseFloat(largest.getAttribute('height') || '1'));
          return areaCurr > areaLargest ? curr : largest;
        });
      }
    }

    if (!svg) {
      console.warn('prepareSvgForLightExport: No se encontró ningún elemento SVG dentro del contenedor.');
      return null;
    }

    const clone = svg.cloneNode(true) as SVGSVGElement;
    const bbox = svg.getBoundingClientRect();
    const width = Math.max(bbox.width || parseFloat(svg.getAttribute('width') || '800') || 800, 500);
    const originalHeight = Math.max(bbox.height || parseFloat(svg.getAttribute('height') || '450') || 450, 300);

    // Extraer ítems de leyenda si existen en el contenedor HTML
    const legendItems: { label: string; color: string }[] = [];
    if (legendWrapper) {
      const items = legendWrapper.querySelectorAll('.recharts-legend-item');
      items.forEach(item => {
        const textEl = item.querySelector('.recharts-legend-item-text') || item;
        const label = textEl.textContent?.trim() || '';
        const iconSvg = item.querySelector('svg');
        let color = '#10b981';
        if (iconSvg) {
          const pathOrRect = iconSvg.querySelector('path, rect, line, circle');
          if (pathOrRect) {
            color = pathOrRect.getAttribute('fill') || pathOrRect.getAttribute('stroke') || color;
          }
        }
        if (label && color !== 'none') {
          legendItems.push({ label, color });
        }
      });
    }

    const extraLegendHeight = legendItems.length > 0 ? 38 : 0;
    const height = originalHeight + extraLegendHeight;

    clone.setAttribute('width', width.toString());
    clone.setAttribute('height', height.toString());
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Inyectar ítems de leyenda en el clon SVG si existen
    if (legendItems.length > 0) {
      const legendG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      legendG.setAttribute('class', 'recharts-exported-legend');
      legendG.setAttribute('transform', `translate(0, ${originalHeight + 12})`);

      let totalLegendW = 0;
      const itemWidths = legendItems.map(item => {
        const w = 26 + item.label.length * 7.5;
        totalLegendW += w;
        return w;
      });

      let curX = Math.max(15, (width - totalLegendW) / 2);
      legendItems.forEach((item, idx) => {
        const itemG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        itemG.setAttribute('transform', `translate(${curX}, 0)`);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '0');
        rect.setAttribute('y', '-10');
        rect.setAttribute('width', '14');
        rect.setAttribute('height', '12');
        rect.setAttribute('rx', '3');
        rect.setAttribute('fill', item.color);
        itemG.appendChild(rect);

        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', '20');
        txt.setAttribute('y', '0');
        txt.setAttribute('fill', '#0f172a');
        txt.setAttribute('font-size', '12px');
        txt.setAttribute('font-weight', '600');
        txt.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
        txt.textContent = item.label;
        itemG.appendChild(txt);

        legendG.appendChild(itemG);
        curX += itemWidths[idx];
      });

      clone.appendChild(legendG);
    }

    // 1. Inyectar fondo blanco puro en la primera posición del árbol SVG
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', '0');
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', '#ffffff');
    clone.insertBefore(bgRect, clone.firstChild);

    // 2. Inyectar bloque de estilos CSS para forzar Modo Claro en textos, ejes y cuadrícula
    const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.textContent = `
      text {
        fill: #0f172a !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      }
      .recharts-text {
        fill: #0f172a !important;
      }
      .recharts-cartesian-axis-tick-value {
        fill: #1e293b !important;
        font-size: 11px !important;
        font-weight: 500 !important;
      }
      .recharts-cartesian-axis-line {
        stroke: #475569 !important;
        stroke-width: 1.5px !important;
      }
      .recharts-cartesian-axis-tick-line {
        stroke: #64748b !important;
      }
      .recharts-cartesian-grid-horizontal line,
      .recharts-cartesian-grid-vertical line,
      .recharts-cartesian-grid line {
        stroke: #e2e8f0 !important;
        stroke-dasharray: 3 3 !important;
        opacity: 1 !important;
      }
      .recharts-legend-item-text {
        color: #0f172a !important;
        fill: #0f172a !important;
        font-weight: 600 !important;
      }
      .recharts-reference-line line {
        opacity: 0.85 !important;
      }
    `;
    clone.appendChild(styleEl);

    // 3. Recorrer todos los elementos de texto y asegurar contraste perfecto en Modo Claro
    const allTexts = clone.querySelectorAll('text, tspan');
    allTexts.forEach(el => {
      // Verificar si el texto se encuentra dentro de una celda/barra con fondo de color saturado u oscuro
      const parentG = el.closest('g');
      let parentBgColor: string | null = null;
      if (parentG) {
        const siblingRect = parentG.querySelector('rect');
        if (siblingRect) {
          parentBgColor = (siblingRect.getAttribute('fill') || '').toLowerCase();
        }
      }

      // Si el texto está sobre una celda oscura/saturada (ej. verde esmeralda o rojo intenso de correlación)
      const isOverDarkCell = parentBgColor && (
        parentBgColor === '#047857' || parentBgColor === '#059669' || parentBgColor === '#10b981' ||
        parentBgColor === '#991b1b' || parentBgColor === '#dc2626' || parentBgColor === '#ef4444' ||
        parentBgColor === '#4f46e5' || parentBgColor === '#2563eb' || parentBgColor === '#7c3aed'
      );

      if (isOverDarkCell) {
        // Mantener texto en blanco para legibilidad óptima sobre fondos oscuros
        el.setAttribute('fill', '#ffffff');
      } else {
        const fill = (el.getAttribute('fill') || '').toLowerCase();
        const style = el.getAttribute('style') || '';
        if (
          fill === '#ffffff' || fill === '#fff' || fill === 'white' ||
          fill === '#f8fafc' || fill === '#f1f5f9' || fill === '#e2e8f0' ||
          fill === '#cbd5e1' || fill === '#94a3b8' || fill === 'rgb(255, 255, 255)' ||
          fill === 'rgba(255, 255, 255, 1)' || !fill
        ) {
          el.setAttribute('fill', '#0f172a');
        }
        if (style.includes('color:') || style.includes('fill:')) {
          el.setAttribute('style', style.replace(/fill:\s*#[a-f0-9]+/gi, 'fill: #0f172a;').replace(/color:\s*#[a-f0-9]+/gi, 'color: #0f172a;'));
        }
      }
    });

    // 4. Recorrer líneas de rejilla oscuras y transformarlas a gris sutil
    const allLines = clone.querySelectorAll('line');
    allLines.forEach(line => {
      const stroke = (line.getAttribute('stroke') || '').toLowerCase();
      if (
        stroke === '#1e293b' || stroke === '#334155' || stroke === '#0f172a' ||
        stroke === '#475569' || stroke.includes('rgba(255') || stroke === '#ffffff'
      ) {
        line.setAttribute('stroke', '#e2e8f0');
      }
    });

    // 5. Serializar con XMLSerializer
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(clone);

    if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!svgString.includes('xmlns:xlink="http://www.w3.org/1999/xlink"')) {
      svgString = svgString.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    return { svgString, width, height };
  } catch (err) {
    console.error('Error preparando SVG para modo claro:', err);
    return null;
  }
}

/**
 * Exporta un elemento SVG directamente como archivo SVG vectorial editable en MODO CLARO (fondo blanco puro).
 */
export function exportSvgElement(
  containerOrSvg: HTMLElement | SVGSVGElement,
  filename: string,
  title?: string
): boolean {
  try {
    const lightResult = prepareSvgForLightExport(containerOrSvg, title);
    if (!lightResult) {
      console.warn('exportSvgElement: Falló la preparación del SVG.');
      return false;
    }

    const fullSvgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!-- Gemelo Digital Chirimayo - ${title || 'Figura Científica'} (Modo Claro) -->\n` + lightResult.svgString;
    const blob = new Blob([fullSvgContent], { type: 'image/svg+xml;charset=utf-8' });
    triggerDownload(blob, ensureExtension(filename, '.svg'));
    return true;
  } catch (err) {
    console.error('Error al exportar SVG vectorial:', err);
    return false;
  }
}

/**
 * Convierte un elemento SVG o contenedor de Recharts a imagen PNG de alta resolución (3x / 300 DPI equivalente).
 * Forzado estricto en MODO CLARO (Fondo Blanco #ffffff, texto oscuro #0f172a, rejilla sutil #e2e8f0).
 */
export async function exportSvgToPng(
  containerOrSvg: HTMLElement | SVGSVGElement,
  filename: string,
  options?: {
    scale?: number;
    backgroundColor?: string;
    watermarkText?: string;
  }
): Promise<boolean> {
  try {
    const lightResult = prepareSvgForLightExport(containerOrSvg);
    if (!lightResult) {
      return false;
    }

    const scale = options?.scale || 3.0; // Alta resolución profesional (300 DPI equivalente)
    const { svgString, width, height } = lightResult;

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = window.URL.createObjectURL(svgBlob);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          window.URL.revokeObjectURL(blobURL);
          resolve(false);
          return;
        }

        // Fondo Blanco Puro Obligatorio para publicaciones académicas e impresión
        ctx.fillStyle = options?.backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Suavizado de imagen de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Dibujar SVG en modo claro escalado
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Marca de agua científica oficial en color oscuro discreto
        const watermark = options?.watermarkText || 'Gemelo Digital Turberas Chirimayo • INAIGEM-UNC';
        ctx.font = `${Math.round(10 * scale)}px -apple-system, sans-serif`;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.textAlign = 'right';
        ctx.fillText(watermark, canvas.width - 20 * scale, canvas.height - 12 * scale);

        canvas.toBlob((blob) => {
          window.URL.revokeObjectURL(blobURL);
          if (blob) {
            triggerDownload(blob, ensureExtension(filename, '.png'));
            resolve(true);
          } else {
            resolve(false);
          }
        }, 'image/png');
      };

      img.onerror = (e) => {
        console.error('Error cargando imagen SVG en canvas:', e);
        window.URL.revokeObjectURL(blobURL);
        resolve(false);
      };

      img.src = blobURL;
    });
  } catch (err) {
    console.error('Error al exportar SVG a PNG:', err);
    return false;
  }
}

/**
 * Captura un HTMLCanvasElement (p. ej. el Canvas WebGL de Three.js en DigitalTwin3D).
 */
export function exportCanvasToPng(
  canvas: HTMLCanvasElement,
  filename: string
): boolean {
  try {
    // Crear canvas auxiliar con fondo blanco puro garantizado (Modo Claro estricto)
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) {
      canvas.toBlob((blob) => {
        if (blob) triggerDownload(blob, ensureExtension(filename, '.png'));
      }, 'image/png');
      return true;
    }

    // 1. Rellenar con blanco puro (#ffffff)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // 2. Dibujar contenido del canvas fuente
    ctx.drawImage(canvas, 0, 0);

    // 3. Marca de agua científica en modo claro
    ctx.font = '14px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.textAlign = 'right';
    ctx.fillText('Gemelo Digital Turberas Chirimayo • Modo Claro Oficial', exportCanvas.width - 20, exportCanvas.height - 16);

    exportCanvas.toBlob((blob) => {
      if (blob) {
        triggerDownload(blob, ensureExtension(filename, '.png'));
      }
    }, 'image/png');
    return true;
  } catch (err) {
    console.error('Error al capturar canvas a PNG:', err);
    return false;
  }
}

/**
 * Exporta un gráfico a documento PDF científico oficial con encabezado institucional,
 * título, metadatos, figura renderizada en MODO CLARO (fondo blanco) y pie de página auditable.
 */
export async function exportChartToPdf(
  containerOrSvg: HTMLElement | SVGSVGElement,
  filename: string,
  options?: {
    title?: string;
    subtitle?: string;
    notes?: string;
    dataSummary?: string;
  }
): Promise<boolean> {
  try {
    const lightResult = prepareSvgForLightExport(containerOrSvg, options?.title);
    if (!lightResult) {
      return false;
    }

    const scale = 2.5;
    const { svgString, width, height } = lightResult;

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = window.URL.createObjectURL(svgBlob);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          window.URL.revokeObjectURL(blobURL);
          resolve(false);
          return;
        }

        // Fondo blanco puro en el canvas del PDF
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgDataUri = canvas.toDataURL('image/png');
        window.URL.revokeObjectURL(blobURL);

        // Crear documento PDF con orientación horizontal o vertical según aspect ratio
        const isLandscape = width >= height;
        const pdf = new jsPDF({
          orientation: isLandscape ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = isLandscape ? 297 : 210;
        const pageHeight = isLandscape ? 210 : 297;

        // Barra institucional superior
        pdf.setFillColor(15, 23, 42); // slate-900
        pdf.rect(0, 0, pageWidth, 28, 'F');

        pdf.setTextColor(52, 211, 153); // emerald-400
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('REPUBLICA DEL PERU — SISTEMA NACIONAL DE INFORMACION AMBIENTAL / INAIGEM', 14, 11);

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(13);
        pdf.text(options?.title || 'Reporte de Figura Científica — Gemelo Digital Chirimayo', 14, 19);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(203, 213, 225);
        pdf.text(`Generado: ${new Date().toLocaleString('es-PE')} | Microcuenca Chirimayo, Cajamarca | Formato: Modo Claro Oficial`, 14, 25);

        // Subtítulo o descripción si existe
        let currentY = 35;
        if (options?.subtitle) {
          pdf.setFontSize(9.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(51, 65, 85);
          const splitSub = pdf.splitTextToSize(options.subtitle, pageWidth - 28);
          pdf.text(splitSub, 14, currentY);
          currentY += splitSub.length * 5 + 3;
        }

        // Renderizar imagen del gráfico con borde sutil
        const imgMaxW = pageWidth - 28;
        const imgMaxH = pageHeight - currentY - 30;
        const imgAspect = (width * scale) / (height * scale);
        
        let renderW = imgMaxW;
        let renderH = renderW / imgAspect;
        if (renderH > imgMaxH) {
          renderH = imgMaxH;
          renderW = renderH * imgAspect;
        }

        const imgX = 14 + (imgMaxW - renderW) / 2;

        // Marco sutil para delimitar la figura clara sobre el papel
        pdf.setDrawColor(226, 232, 240); // slate-200
        pdf.setFillColor(255, 255, 255);
        pdf.rect(imgX - 1, currentY - 1, renderW + 2, renderH + 2, 'FD');
        pdf.addImage(imgDataUri, 'PNG', imgX, currentY, renderW, renderH);

        // Notas / Leyenda inferior
        const footerY = pageHeight - 12;
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        const notes = options?.notes || 'Datos calibrados de campo (Piezómetros & Cámaras de Flujo Chirimayo) | Modelo IPCC Tier 2 / XGBoost';
        pdf.text(notes, 14, footerY);
        pdf.text(`Página 1 de 1`, pageWidth - 28, footerY, { align: 'right' });

        pdf.save(ensureExtension(filename, '.pdf'));
        resolve(true);
      };

      img.onerror = (e) => {
        console.error('Error cargando imagen para PDF:', e);
        window.URL.revokeObjectURL(blobURL);
        resolve(false);
      };

      img.src = blobURL;
    });
  } catch (err) {
    console.error('Error al exportar gráfico a PDF:', err);
    return false;
  }
}

/**
 * Exporta una tabla a PDF utilizando jsPDF y jspdf-autotable con diseño formal.
 */
export function exportTableToPdf(
  filename: string,
  title: string,
  data: any[],
  columns: ExportColumnDef[],
  subtitle?: string
): boolean {
  try {
    if (!data || data.length === 0) return false;

    const doc = new jsPDF({
      orientation: columns.length > 5 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const isLandscape = columns.length > 5;
    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;

    // Encabezado
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 26, 'F');

    doc.setTextColor(52, 211, 153);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('GEMELO DIGITAL DE TURBERAS CHIRIMAYO — REPORTE TABULAR CIENTÍFICO', 14, 10);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(title, 14, 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Fecha: ${new Date().toLocaleString('es-PE')} | Total Registros: ${data.length}`, 14, 23);

    let startY = 32;
    if (subtitle) {
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const splitSub = doc.splitTextToSize(subtitle, pageWidth - 28);
      doc.text(splitSub, 14, startY);
      startY += splitSub.length * 4.5 + 4;
    }

    const head = [columns.map(c => c.label)];
    const body = data.map(item => {
      return columns.map(c => {
        const val = item[c.key];
        const formatted = c.format ? c.format(val) : val;
        return formatted === null || formatted === undefined ? '-' : String(formatted);
      });
    });

    autoTable(doc, {
      startY,
      head,
      body,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 14, right: 14, bottom: 16 }
    });

    // Pie de página
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Gemelo Digital Chirimayo • INAIGEM-UNC • Página ${i} de ${totalPages}`,
        14,
        pageHeight - 8
      );
    }

    doc.save(ensureExtension(filename, '.pdf'));
    return true;
  } catch (err) {
    console.error('Error al exportar tabla a PDF:', err);
    return false;
  }
}

/**
 * Genera un archivo HTML interactivo autónomo con visualizador responsivo,
 * tabla interactiva y datos en formato JSON embebido para exploración offline sin dependencias.
 */
export function exportHtmlInteractive(
  filename: string,
  title: string,
  data: any[],
  columns?: ExportColumnDef[]
): boolean {
  try {
    const cols: ExportColumnDef[] = columns && columns.length > 0
      ? columns
      : Object.keys(data[0] || {}).map(k => ({ key: k, label: k }));

    const jsonDataStr = JSON.stringify(data, null, 2);
    const dateStr = new Date().toLocaleString('es-PE');

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Gemelo Digital Chirimayo</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #0f172a;
      --border: #1e293b;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --accent: #10b981;
      --accent-hover: #059669;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      padding: 24px;
      line-height: 1.5;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-family: monospace;
      font-weight: bold;
      border: 1px solid rgba(16, 185, 129, 0.3);
      margin-bottom: 6px;
    }
    h1 { font-size: 20px; font-weight: 700; }
    p.meta { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
    .controls {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    input[type="text"] {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 12px;
      min-width: 260px;
    }
    button.btn {
      background: var(--accent);
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button.btn:hover { background: var(--accent-hover); }
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow-x: auto;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
    }
    table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
    thead { background: #020617; border-bottom: 1px solid var(--border); }
    th { padding: 12px 16px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; font-size: 10px; }
    td { padding: 12px 16px; border-bottom: 1px solid var(--border); }
    tbody tr:hover { background: rgba(255,255,255,0.02); }
    footer {
      margin-top: 24px;
      text-align: center;
      font-size: 11px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <span class="badge">GEMELO DIGITAL CHIRIMAYO • ARCHIVO OFFLINE</span>
        <h1>${title}</h1>
        <p class="meta">Exportado: ${dateStr} • Registros: ${data.length} • Microcuenca Chirimayo, Cajamarca</p>
      </div>
      <button class="btn" onclick="downloadJSON()">Descargar JSON</button>
    </header>

    <div class="controls">
      <input type="text" id="searchInput" placeholder="Filtrar datos en tiempo real..." onkeyup="filterTable()">
    </div>

    <div class="table-container">
      <table id="dataTable">
        <thead>
          <tr>
            ${cols.map(c => `<th>${c.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(item => `
            <tr>
              ${cols.map(c => {
                const val = item[c.key];
                const formatted = c.format ? c.format(val) : val;
                return `<td>${formatted === null || formatted === undefined ? '-' : String(formatted)}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <footer>
      Documento generado automáticamente por el Gemelo Digital de Turberas Chirimayo (INAIGEM - UNC - MERESE).
    </footer>
  </div>

  <script>
    const rawData = ${jsonDataStr};
    function filterTable() {
      const q = document.getElementById('searchInput').value.toLowerCase();
      const rows = document.querySelectorAll('#dataTable tbody tr');
      rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
      });
    }
    function downloadJSON() {
      const blob = new Blob([JSON.stringify(rawData, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '${filename}.json';
      a.click();
    }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    triggerDownload(blob, ensureExtension(filename, '.html'));
    return true;
  } catch (err) {
    console.error('Error al exportar HTML interactivo:', err);
    return false;
  }
}

// Helpers privados
function triggerDownload(blob: Blob, fullFilename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fullFilename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 200);
}

function ensureExtension(filename: string, ext: string): string {
  const clean = filename.trim().replace(/\s+/g, '_');
  return clean.toLowerCase().endsWith(ext.toLowerCase()) ? clean : clean + ext;
}
