"""Pruebas E2E con Playwright sobre el sistema levantado con los datos demo (python -m app.seed).

Requisitos:
  - API en http://localhost:8000 con datos demo recién cargados
  - Frontend compilado y servido (por defecto http://localhost:4176)

Uso:
  pip install pytest playwright
  python -m playwright install chromium        # o usar Chrome instalado con E2E_CANAL=chrome
  pytest e2e -v

Guarda capturas de cada pantalla en docs/06 Anexos/evidencias/ y el resultado de accesibilidad
(axe-core, reglas WCAG 2.1 A/AA) en docs/06 Anexos/evidencias/accesibilidad-axe.json.
"""

import json
import os
from pathlib import Path

import pytest
from playwright.sync_api import Page, expect, sync_playwright

URL = os.getenv("E2E_URL", "http://localhost:4176")
CANAL = os.getenv("E2E_CANAL", "chrome")
RAIZ = Path(__file__).resolve().parent.parent
EVIDENCIAS = RAIZ / "docs" / "06 Anexos" / "evidencias"
AXE = RAIZ / "frontend" / "node_modules" / "axe-core" / "axe.min.js"
RESULTADOS_AXE: dict[str, dict] = {}


@pytest.fixture(scope="session")
def navegador():
    EVIDENCIAS.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        nav = p.chromium.launch(channel=CANAL or None)
        yield nav
        nav.close()
    if RESULTADOS_AXE:
        (EVIDENCIAS / "accesibilidad-axe.json").write_text(
            json.dumps(RESULTADOS_AXE, ensure_ascii=False, indent=2), encoding="utf-8"
        )


@pytest.fixture
def pagina(navegador):
    ctx = navegador.new_context(viewport={"width": 1366, "height": 860}, locale="es-PE")
    page = ctx.new_page()
    yield page
    ctx.close()


def ingresar(page: Page, correo: str, clave: str) -> None:
    page.goto(f"{URL}/login")
    page.get_by_label("Correo").fill(correo)
    page.get_by_label("Contraseña").fill(clave)
    page.get_by_role("button", name="Ingresar").click()
    expect(page.get_by_role("heading", name="Dashboard")).to_be_visible()


def capturar(page: Page, nombre: str) -> None:
    page.wait_for_load_state("networkidle")
    page.screenshot(path=str(EVIDENCIAS / f"{nombre}.png"), full_page=True)


def auditar(page: Page, pantalla: str) -> None:
    """Corre axe-core con las reglas WCAG 2.1 A y AA y guarda las violaciones."""
    if not AXE.exists():
        return
    page.add_script_tag(path=str(AXE))
    r = page.evaluate(
        "async () => await axe.run(document, {runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa']})"
    )
    RESULTADOS_AXE[pantalla] = {
        "reglas_aprobadas": len(r["passes"]),
        "violaciones": [
            {"regla": v["id"], "impacto": v["impact"], "descripcion": v["help"], "nodos": len(v["nodes"])}
            for v in r["violations"]
        ],
    }


def test_e2e_01_login_y_pantallas_de_gestion(pagina: Page):
    pagina.goto(f"{URL}/login")
    capturar(pagina, "e2e-01-login")
    auditar(pagina, "Login")

    ingresar(pagina, "planificador@ecologistica.pe", "Plan123*")
    expect(pagina.get_by_text("Pedidos pendientes")).to_be_visible()
    capturar(pagina, "e2e-02-dashboard")
    auditar(pagina, "Dashboard")

    for ruta, titulo, archivo in [
        ("pedidos", "Pedidos", "e2e-03-pedidos"),
        ("vehiculos", "Flota", "e2e-04-flota"),
        ("conductores", "Conductores", "e2e-05-conductores"),
        ("preferencias", "Preferencias de recepción", "e2e-06-preferencias"),
    ]:
        pagina.get_by_role("link", name=titulo.split()[0]).click()
        expect(pagina.get_by_role("heading", name=titulo)).to_be_visible()
        capturar(pagina, archivo)
        auditar(pagina, titulo)

    # Paginación: hay 20 pedidos demo, se muestran 12
    pagina.get_by_role("link", name="Pedidos").click()
    expect(pagina.get_by_text("Página 1 de 2")).to_be_visible()


def test_e2e_02_generar_rutas_y_reoptimizar(pagina: Page):
    ingresar(pagina, "planificador@ecologistica.pe", "Plan123*")
    pagina.get_by_role("link", name="Rutas").click()
    pagina.get_by_role("button", name="Generar rutas optimizadas").click()
    resumen = pagina.get_by_role("status")
    expect(resumen).to_contain_text("FACTIBLE", timeout=60_000)
    expect(pagina.locator(".leaflet-marker-icon").first).to_be_visible()
    capturar(pagina, "e2e-07-rutas-generadas")
    auditar(pagina, "Rutas")

    # Incidente de tráfico sobre la primera ruta
    form = pagina.get_by_role("form", name="Registrar incidente")
    form.get_by_label("Ruta").select_option(index=1)
    form.get_by_label("Tipo").select_option("TRAFICO")
    form.get_by_label("Hora actual").fill("10:00")
    form.get_by_label("Demora (min)").fill("30")
    form.get_by_role("button", name="Re-optimizar").click()
    expect(pagina.get_by_text("re-optimizada de #").first).to_be_visible(timeout=60_000)
    capturar(pagina, "e2e-08-ruta-reoptimizada")


def test_e2e_03_sostenibilidad(pagina: Page):
    ingresar(pagina, "admin@ecologistica.pe", "Admin123*")
    pagina.get_by_role("link", name="Sostenibilidad").click()
    expect(pagina.get_by_role("heading", name="Plan de compensación de carbono")).to_be_visible()
    capturar(pagina, "e2e-09-sostenibilidad")
    auditar(pagina, "Sostenibilidad")


def test_e2e_04_conductor_sin_menus_de_gestion(pagina: Page):
    ingresar(pagina, "conductor@ecologistica.pe", "Cond123*")
    menu = pagina.get_by_role("navigation", name="Menú principal")
    expect(menu.get_by_role("link", name="Rutas")).to_be_visible()
    for oculto in ("Pedidos", "Flota", "Conductores"):
        expect(menu.get_by_role("link", name=oculto)).to_have_count(0)
    pagina.get_by_role("link", name="Rutas").click()
    capturar(pagina, "e2e-10-vista-conductor")
