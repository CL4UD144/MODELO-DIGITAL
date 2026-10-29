"""
Pruebas automáticas unitarias e integradas para el Módulo LangChain del Gemelo Digital.
"""

import os
import sys
import unittest

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from modules.langchain.service import LangChainService
from modules.langchain.prompts import REJECT_NO_DATA_MESSAGE

class TestLangChainPeatlandAssistant(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.service = LangChainService()
        cls.session_id = "unit_test_session_1"

    def test_01_dataset_query(self):
        """1. Dataset: ¿Cuántos registros existen?"""
        res = self.service.chat("¿Cuántos registros existen?", conversation_id=self.session_id)
        self.assertTrue(res["success"])
        self.assertIn("registros", res["response"].lower())
        self.assertGreater(len(res["sources"]), 0)

    def test_02_carbon_query(self):
        """2. Carbono: ¿Cuál es el promedio de CH4?"""
        res = self.service.chat("¿Cuál es el promedio de CH4?", conversation_id=self.session_id)
        self.assertTrue(res["success"])
        self.assertIn("ch4", res["response"].lower())
        self.assertEqual(res["analysis_type"], "carbon")

    def test_03_hydrology_query(self):
        """3. Hidrología: ¿Cuál es el nivel freático promedio?"""
        res = self.service.chat("¿Cuál es el nivel freático promedio?", conversation_id=self.session_id)
        self.assertTrue(res["success"])
        self.assertIn("nivel freático", res["response"].lower())
        self.assertEqual(res["analysis_type"], "hydrology")

    def test_04_geospatial_query(self):
        """4. Geoespacial: ¿Cuál es la elevación del área?"""
        res = self.service.chat("¿Cuál es la elevación del área?", conversation_id=self.session_id)
        self.assertTrue(res["success"])
        self.assertIn("m s.n.m.", res["response"].lower())
        self.assertEqual(res["analysis_type"], "geospatial_elevation")

    def test_05_simulation_query(self):
        """5. Simulación: Compara escenario actual y restaurado."""
        res = self.service.chat("Compara escenario actual y restaurado.", conversation_id=self.session_id)
        self.assertTrue(res["success"])
        self.assertIn("escenario", res["response"].lower())
        self.assertEqual(res["analysis_type"], "scenario_comparison")

    def test_06_rag_query(self):
        """6. RAG: ¿Qué dice la literatura sobre emisiones de CH4?"""
        res = self.service.chat("¿Qué dice la literatura sobre emisiones de CH4?", conversation_id=self.session_id)
        self.assertTrue(res["success"])
        self.assertIn("literatura", res["response"].lower())

    def test_07_non_existent_query(self):
        """7. Pregunta inexistente: ¿Cuánto CH4 habrá exactamente dentro de 20 años?"""
        res = self.service.chat("¿Cuánto CH4 habrá exactamente dentro de 20 años?", conversation_id=self.session_id)
        self.assertFalse(res["success"])
        self.assertEqual(res["response"], REJECT_NO_DATA_MESSAGE)

if __name__ == "__main__":
    unittest.main()
