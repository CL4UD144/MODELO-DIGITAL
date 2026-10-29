"""
Módulo de Exportación en Modo Claro y Componentes de Interpretabilidad & Operabilidad
para el Sistema Científico del Gemelo Digital de Turberas Chirimayo.

Garantiza:
1. Exportación de gráficos en Modo Claro estricto (fondo blanco #ffffff, texto oscuro #0f172a, cuadrícula sutil).
2. Generación de botones de descarga para PNG HD, SVG, HTML interactivo y CSV/Excel.
3. Bloque obligatorio y visible inmediatamente debajo de cada gráfico y tabla:
   'Interpretabilidad y operabilidad' estructurado según los 5 apartados requeridos.
"""

import io
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import streamlit as st
from typing import List, Dict, Any, Optional

def make_fig_light_for_export(fig: go.Figure, title: Optional[str] = None) -> go.Figure:
    """
    Transforma cualquier figura Plotly a Modo Claro estricto para exportación e impresión académica:
    - Fondo de papel y de trazado blanco puro (#ffffff).
    - Tipografía oscura (#0f172a) con contraste óptimo.
    - Ejes visibles (#475569) y cuadrícula discreta (#e2e8f0).
    - Preserva los colores semánticos de las series de datos.
    """
    export_fig = go.Figure(fig)
    export_fig.update_layout(
        template="plotly_white",
        paper_bgcolor="#ffffff",
        plot_bgcolor="#ffffff",
        font=dict(
            family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            color="#0f172a",
            size=11
        ),
        title=dict(
            text=title or export_fig.layout.title.text if export_fig.layout.title else None,
            font=dict(color="#0f172a", size=13, family="sans-serif")
        ),
        xaxis=dict(
            gridcolor="#e2e8f0",
            linecolor="#475569",
            zerolinecolor="#cbd5e1",
            tickfont=dict(color="#1e293b", size=10),
            title_font=dict(color="#0f172a", size=11, family="sans-serif")
        ),
        yaxis=dict(
            gridcolor="#e2e8f0",
            linecolor="#475569",
            zerolinecolor="#cbd5e1",
            tickfont=dict(color="#1e293b", size=10),
            title_font=dict(color="#0f172a", size=11, family="sans-serif")
        ),
        legend=dict(
            font=dict(color="#0f172a", size=10),
            bgcolor="rgba(255, 255, 255, 0.9)",
            bordercolor="#e2e8f0",
            borderwidth=1
        )
    )
    return export_fig

def get_plot_image_bytes(fig: go.Figure, fmt: str = "png", scale: int = 2) -> bytes:
    """Genera bytes de la figura en formato de alta resolución y modo claro."""
    light_fig = make_fig_light_for_export(fig)
    return light_fig.to_image(format=fmt, scale=scale)

def get_plot_html_string(fig: go.Figure) -> str:
    """Genera HTML interactivo independiente con fondo claro."""
    light_fig = make_fig_light_for_export(fig)
    return light_fig.to_html(include_plotlyjs="cdn", full_html=True)

def render_chart_with_operability(
    fig: go.Figure,
    chart_id: str,
    title: str,
    what_shows: str,
    how_to_interpret: str,
    findings: List[str] | str,
    limitations: str,
    operability_instructions: Optional[List[str]] = None,
    export_df: Optional[pd.DataFrame] = None,
    filename_prefix: str = "grafico_cientifico"
):
    """
    Renderiza una figura en Streamlit junto con sus botones de exportación en modo claro
    e inserta inmediatamente debajo el bloque estructurado:
    'Interpretabilidad y operabilidad'
    """
    # 1. Configuración de Plotly en pantalla y exportación de cámara integrada en modo claro
    config = {
        'displaylogo': False,
        'toImageButtonOptions': {
            'format': 'png',
            'filename': f"{filename_prefix}_modo_claro",
            'height': 600,
            'width': 950,
            'scale': 3
        }
    }
    
    st.plotly_chart(fig, use_container_width=True, config=config)

    # 2. Barra de Herramientas de Descarga en Modo Claro (PNG HD, SVG, HTML y Datos)
    col_dl1, col_dl2, col_dl3, col_dl4 = st.columns([1, 1, 1, 1.2])
    
    try:
        png_bytes = get_plot_image_bytes(fig, fmt="png", scale=3)
        with col_dl1:
            st.download_button(
                label="📥 PNG HD (Fondo Blanco)",
                data=png_bytes,
                file_name=f"{filename_prefix}_modo_claro_300dpi.png",
                mime="image/png",
                key=f"dl_png_{chart_id}"
            )
    except Exception:
        pass

    try:
        svg_bytes = get_plot_image_bytes(fig, fmt="svg")
        with col_dl2:
            st.download_button(
                label="📥 SVG (Vectorial)",
                data=svg_bytes,
                file_name=f"{filename_prefix}_vector_claro.svg",
                mime="image/svg+xml",
                key=f"dl_svg_{chart_id}"
            )
    except Exception:
        pass

    try:
        html_str = get_plot_html_string(fig)
        with col_dl3:
            st.download_button(
                label="📥 HTML Interactivo",
                data=html_str,
                file_name=f"{filename_prefix}_interactivo.html",
                mime="text/html",
                key=f"dl_html_{chart_id}"
            )
    except Exception:
        pass

    if export_df is not None and not export_df.empty:
        csv_data = export_df.to_csv(index=False).encode('utf-8')
        with col_dl4:
            st.download_button(
                label="📥 Datos CSV",
                data=csv_data,
                file_name=f"{filename_prefix}_datos.csv",
                mime="text/csv",
                key=f"dl_csv_{chart_id}"
            )

    # 3. Instrucciones por defecto de interactividad si no se pasan específicas
    default_operability = [
        "**Zoom dinámico:** Haz clic y arrastra sobre cualquier cuadrante del gráfico para ampliar una zona de interés.",
        "**Inspección de valores (Hover):** Pasa el cursor sobre cualquier punto, barra o curva para visualizar valores numéricos exactos y unidades.",
        "**Aislar series:** Haz clic en los elementos de la leyenda para ocultar o aislar series individuales.",
        "**Restablecer vista:** Haz doble clic en el área del gráfico o presiona el botón 'Reset axes' de la barra superior.",
        "**Descarga en Modo Claro:** Utiliza los botones superiores (PNG HD, SVG, HTML) que garantizan fondo blanco puro para publicaciones e informes."
    ]
    ops = operability_instructions if operability_instructions else default_operability

    # 4. Bloque Obligatorio: Interpretabilidad y operabilidad
    with st.expander(f"📘 Interpretabilidad y operabilidad — {title}", expanded=True):
        st.markdown("##### 1. ¿Qué muestra este gráfico?")
        st.write(what_shows)

        st.markdown("##### 2. ¿Cómo se interpreta?")
        st.write(how_to_interpret)

        st.markdown("##### 3. Hallazgos principales")
        if isinstance(findings, list):
            for f in findings:
                st.markdown(f"- {f}")
        else:
            st.write(findings)

        st.markdown("##### 4. Limitaciones")
        st.caption(f"⚠️ {limitations}")

        st.markdown("##### 5. Cómo interactuar con este gráfico")
        for op in ops:
            st.markdown(f"- {op}")

def render_table_with_operability(
    df: pd.DataFrame,
    table_id: str,
    title: str,
    what_contains: str,
    how_to_interpret: str,
    findings: List[str] | str,
    limitations: str,
    operability_instructions: Optional[List[str]] = None,
    filename_prefix: str = "tabla_datos"
):
    """
    Renderiza una tabla en Streamlit con opciones de exportación (CSV y Excel)
    e inserta inmediatamente debajo el bloque estructurado:
    'Interpretabilidad y operabilidad'
    """
    st.dataframe(df, use_container_width=True)

    # Botones de exportación de la tabla
    col_t1, col_t2 = st.columns([1, 1])
    with col_t1:
        csv_bytes = df.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="📥 Descargar Tabla CSV",
            data=csv_bytes,
            file_name=f"{filename_prefix}.csv",
            mime="text/csv",
            key=f"t_csv_{table_id}"
        )

    with col_t2:
        output_excel = io.BytesIO()
        with pd.ExcelWriter(output_excel, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="Datos", index=False)
        st.download_button(
            label="📥 Descargar Tabla Excel (.xlsx)",
            data=output_excel.getvalue(),
            file_name=f"{filename_prefix}.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            key=f"t_xlsx_{table_id}"
        )

    default_table_ops = [
        "**Búsqueda y filtrado:** Utiliza los encabezados de columna o la barra de búsqueda para filtrar registros específicos.",
        "**Ordenamiento:** Haz clic sobre cualquier encabezado de columna para ordenar ascendentemente o descendentemente.",
        "**Selección y copia:** Selecciona celdas o filas con el ratón y presiona Ctrl+C para copiar datos directamente.",
        "**Exportación de datos:** Utiliza los botones superiores 'Descargar Tabla CSV' y 'Excel (.xlsx)' para obtener el conjunto completo auditado."
    ]
    ops = operability_instructions if operability_instructions else default_table_ops

    # Bloque Obligatorio: Interpretabilidad y operabilidad
    with st.expander(f"📋 Interpretabilidad y operabilidad — {title}", expanded=True):
        st.markdown("##### 1. ¿Qué contiene esta tabla?")
        st.write(what_contains)

        st.markdown("##### 2. ¿Cómo se interpreta?")
        st.write(how_to_interpret)

        st.markdown("##### 3. Hallazgos principales")
        if isinstance(findings, list):
            for f in findings:
                st.markdown(f"- {f}")
        else:
            st.write(findings)

        st.markdown("##### 4. Consideraciones y limitaciones")
        st.caption(f"⚠️ {limitations}")

        st.markdown("##### 5. Cómo utilizar esta tabla")
        for op in ops:
            st.markdown(f"- {op}")
