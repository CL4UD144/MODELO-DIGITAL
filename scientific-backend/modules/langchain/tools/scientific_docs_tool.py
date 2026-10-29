"""
Sistema RAG (Retrieval-Augmented Generation) para la consulta de Documentos y Literatura Científica.
Carga archivos markdown/txt/pdf en docs_scientific, los divide en fragmentos y recupera evidencia con citas.
"""

import os
import glob
from typing import Dict, Any, List, Optional
from langchain_core.documents import Document

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DOCS_DIR = os.path.join(BASE_DIR, "docs_scientific")

class ScientificDocsTool:
    """
    Herramienta de Búsqueda RAG sobre literatura científica cargada en el sistema.
    """
    def __init__(self, docs_dir: str = DOCS_DIR):
        self.docs_dir = docs_dir
        self.documents: List[Document] = []
        self._load_documents()

    def _load_documents(self):
        """Carga y procesa todos los archivos de literatura científica en docs_scientific"""
        if not os.path.exists(self.docs_dir):
            os.makedirs(self.docs_dir, exist_ok=True)

        files = glob.glob(os.path.join(self.docs_dir, "*.md")) + glob.glob(os.path.join(self.docs_dir, "*.txt"))
        
        for fpath in files:
            fname = os.path.basename(fpath)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Text Splitter simple por secciones o párrafos
                sections = content.split("\n## ")
                for i, sec in enumerate(sections):
                    title_line = sec.split("\n")[0].strip("# ")
                    doc = Document(
                        page_content=sec.strip(),
                        metadata={
                            "source_file": fname,
                            "section": title_line if i > 0 else "Introducción",
                            "file_path": fpath
                        }
                    )
                    self.documents.append(doc)
            except Exception as e:
                print(f"[RAG WARNING] Error leyendo documento {fname}: {e}")

    def search_literature(self, query: str, top_k: int = 3) -> Dict[str, Any]:
        """
        Realiza búsqueda semántica / por palabras clave en los documentos científicos.
        """
        if not self.documents:
            self._load_documents()

        q_words = [w.lower() for w in query.split() if len(w) > 3]
        
        scored_docs = []
        for doc in self.documents:
            content_lower = doc.page_content.lower()
            score = 0
            for w in q_words:
                if w in content_lower:
                    score += content_lower.count(w)
            
            if score > 0:
                scored_docs.append((score, doc))

        # Ordenar por relevancia
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        top_matches = scored_docs[:top_k]

        if not top_matches:
            return {
                "success": False,
                "found": False,
                "summary": "No se encontraron fragmentos en la literatura científica almacenada que coincidan directamente con la consulta.",
                "sources": [],
                "data_used": []
            }

        citations = []
        results_text = []
        data_used = []

        for score, doc in top_matches:
            src_file = doc.metadata.get("source_file", "Documento Científico")
            sec_name = doc.metadata.get("section", "Sección General")
            citation_str = f"Documento: `{src_file}` (Sección: {sec_name})"
            
            if citation_str not in citations:
                citations.append(citation_str)
            data_used.append(f"Cita RAG: {src_file} -> {sec_name}")

            snippet = doc.page_content[:400] + ("..." if len(doc.page_content) > 400 else "")
            results_text.append(f"📌 **[{sec_name}] (Fuente: {src_file}):**\n{snippet}")

        formatted_response = (
            f"**Evidencia Recuperada de la Literatura Científica (RAG Pipeline):**\n\n"
            + "\n\n".join(results_text)
            + f"\n\n📚 **Fuentes y Citas Bibliográficas Consultadas:**\n"
            + "\n".join([f"- {c}" for c in citations])
        )

        return {
            "success": True,
            "found": True,
            "matches_count": len(top_matches),
            "citations": citations,
            "sources": citations,
            "data_used": data_used,
            "summary": formatted_response
        }
