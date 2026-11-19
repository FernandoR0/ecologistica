"""Pruebas de las reglas del caso: RF-005 a RF-010, RF-012, RN-005, RN-006, RN-007 y la encuesta SUS."""

import pytest

from app.models import Zona
from app.services import sus
from tests.conftest import token
from tests.test_api import HOY, _crear_cliente, _crear_flota, _crear_pedidos, _optimizar


def _nuevo_pedido(client, h, codigo="NUEVO-1"):
    cid = _crear_cliente(client, h, "Bodega Nueva")["id"]
    r = client.post("/api/pedidos", headers=h, json={
        "codigo": codigo, "cliente_id": cid, "lat": -12.07, "lng": -75.205, "peso_kg": 20,
        "ventana_inicio": "08:00", "ventana_fin": "18:00"})
    assert r.status_code == 201, r.text
    return r.json()["id"]


# ---------------- RF-008 / RN-007 ----------------
def test_conductor_con_punto_de_partida(client, admin):
    v1, _ = _crear_flota(client, admin)
    cid = next(c["id"] for c in client.get("/api/conductores", headers=admin).json() if c["vehiculo_id"] == v1["id"])
    r = client.put(f"/api/conductores/{cid}", headers=admin, json={"partida_lat": -12.056, "partida_lng": -75.216})
    assert r.status_code == 200 and r.json()["partida_lat"] == -12.056
    client.put(f"/api/vehiculos/{v1['id']}", headers=admin, json={"capacidad_kg": 5000})
    _crear_pedidos(client, admin, 2)
    for ruta in [x for x in _optimizar(client, admin)["rutas"] if x["vehiculo"]["id"] == v1["id"]]:
        assert ruta["partida_lat"] == -12.056


def test_horario_del_cliente_restringe_la_ventana(client, admin):
    _crear_flota(client, admin, n=1)
    cli = _crear_cliente(client, admin, "Farmacia", hora_desde="11:00", hora_hasta="12:00",
                         dias_atencion="LU,MA,MI,JU,VI")
    _crear_pedidos(client, admin, 1, cliente_id=cli["id"], ventana_inicio="08:00", ventana_fin="17:00")
    llegada = _optimizar(client, admin)["rutas"][0]["paradas"][0]["hora_llegada"]
    assert "11:00" <= llegada <= "12:00"


# ---------------- RN-005 / RN-006 ----------------
def test_regla_de_placa_excluye_vehiculos_del_dia(client, admin):
    _crear_flota(client, admin)  # ABC-101 y ELE-001; HOY es lunes
    conf = client.get("/api/configuracion", headers=admin).json()
    assert client.put("/api/configuracion", headers=admin,
                      json={**conf, "digitos_placa_restringidos": "1:1"}).status_code == 200
    _crear_pedidos(client, admin, 2)
    assert client.post("/api/rutas/optimizar", headers=admin, json={"fecha": HOY}).status_code == 409
    assert client.put("/api/configuracion", headers=admin,
                      json={**conf, "digitos_placa_restringidos": "1:x"}).status_code == 422


def test_zona_restringida_del_centro(client, admin, db):
    db.add(Zona(nombre="Centro", tipo="RESTRINGIDA",
                poligono=[[-12.064, -75.2155], [-12.064, -75.205], [-12.073, -75.205], [-12.073, -75.2155]]))
    db.commit()
    viejo = client.post("/api/vehiculos", headers=admin, json={
        "placa": "OLD-008", "capacidad_kg": 800, "rendimiento": 8, "anio_fabricacion": 2008}).json()
    client.post("/api/conductores", headers=admin, json={
        "nombre": "Rosa Pari", "dni": "70000004", "licencia": "Q70000004", "categoria_licencia": "A-I",
        "vehiculo_id": viejo["id"]})
    cid = _crear_cliente(client, admin, "Bodega Centro")["id"]
    client.post("/api/pedidos", headers=admin, json={"codigo": "C-1", "cliente_id": cid, "lat": -12.068,
                                                     "lng": -75.21, "peso_kg": 10})
    plan = _optimizar(client, admin)
    assert plan["rutas"] == [] and len(plan["no_asignados"]) == 1
    zonas = client.get("/api/zonas?tipo=RESTRINGIDA", headers=admin).json()
    assert zonas[0]["nombre"] == "Centro"


def test_zonas_solo_admin_crea_y_elimina(client, admin):
    poligono = [[-12.07, -75.21], [-12.07, -75.20], [-12.08, -75.20]]
    h = token(client, "plan@test.pe")
    assert client.post("/api/zonas", headers=h, json={"nombre": "Riesgo", "tipo": "RIESGO",
                                                      "poligono": poligono}).status_code == 403
    z = client.post("/api/zonas", headers=admin, json={"nombre": "Riesgo", "tipo": "RIESGO", "poligono": poligono})
    assert z.status_code == 201
    assert client.delete(f"/api/zonas/{z.json()['id']}", headers=admin).status_code == 204
    assert client.delete("/api/zonas/999", headers=admin).status_code == 404


# ---------------- RF-007 ----------------
def test_reoptimizar_con_pedido_nuevo(client, admin):
    _crear_flota(client, admin)
    _crear_pedidos(client, admin, 3)
    ruta = _optimizar(client, admin)["rutas"][0]
    nuevo = _nuevo_pedido(client, admin)
    r = client.post(f"/api/rutas/{ruta['id']}/reoptimizar", headers=admin, json={
        "tipo": "PEDIDO_NUEVO", "hora_actual": "09:00", "pedido_id": nuevo})
    assert r.status_code == 200, r.text
    assert nuevo in [p["pedido"]["id"] for x in r.json()["rutas"] for p in x["paradas"]]
    assert client.get(f"/api/pedidos/{nuevo}", headers=admin).json()["estado"] == "PLANIFICADO"


def test_reoptimizar_por_cancelacion(client, admin):
    _crear_flota(client, admin)
    _crear_pedidos(client, admin, 3)
    ruta = max(_optimizar(client, admin)["rutas"], key=lambda x: len(x["paradas"]))
    cancelado = ruta["paradas"][-1]["pedido"]["id"]
    r = client.post(f"/api/rutas/{ruta['id']}/reoptimizar", headers=admin, json={
        "tipo": "CANCELACION", "hora_actual": "09:30", "pedido_id": cancelado})
    assert r.status_code == 200, r.text
    assert cancelado not in [p["pedido"]["id"] for x in r.json()["rutas"] for p in x["paradas"]]
    assert client.get(f"/api/pedidos/{cancelado}", headers=admin).json()["estado"] == "CANCELADO"


def test_reoptimizar_validaciones(client, admin):
    _crear_flota(client, admin)
    _crear_pedidos(client, admin, 2)
    ruta = _optimizar(client, admin)["rutas"][0]
    url = f"/api/rutas/{ruta['id']}/reoptimizar"
    assert client.post(url, headers=admin, json={"tipo": "PEDIDO_NUEVO", "hora_actual": "09:00"}).status_code == 422
    assert client.post(url, headers=admin, json={"tipo": "CANCELACION", "hora_actual": "09:00",
                                                 "pedido_id": 999}).status_code == 409
    otro = ruta["paradas"][0]["pedido"]["id"]
    assert client.post(url, headers=admin, json={"tipo": "PEDIDO_NUEVO", "hora_actual": "09:00",
                                                 "pedido_id": otro}).status_code == 409
    assert client.post("/api/rutas/999/reoptimizar", headers=admin,
                       json={"tipo": "TRAFICO", "hora_actual": "09:00"}).status_code == 409


def test_cancelar_unica_parada_completa_la_ruta(client, admin):
    _crear_flota(client, admin, n=1)
    [pid] = _crear_pedidos(client, admin, 1)
    ruta = _optimizar(client, admin)["rutas"][0]
    r = client.post(f"/api/rutas/{ruta['id']}/reoptimizar", headers=admin, json={
        "tipo": "CANCELACION", "hora_actual": "09:00", "pedido_id": pid})
    assert r.json()["estado"] == "SIN_PEDIDOS"
    assert client.get(f"/api/rutas/{ruta['id']}", headers=admin).json()["estado"] == "COMPLETADA"


# ---------------- RF-005 / RF-006 / RF-010 ----------------
def test_dashboard_vacio_y_con_rutas(client, admin):
    vacio = client.get("/api/indicadores", headers=admin).json()
    assert vacio["mensaje"] == "Aún no hay rutas planificadas" and vacio["distancia_km"] == 0
    _crear_flota(client, admin)
    _crear_pedidos(client, admin, 4)
    _optimizar(client, admin)
    d = client.get("/api/indicadores", headers=admin).json()
    for clave in ("combustible_ahorrado_l", "ahorro_combustible_soles", "cumplimiento_ventanas_pct",
                  "arboles_equivalentes", "ahorro_km_pct"):
        assert clave in d
    assert 0 <= d["cumplimiento_ventanas_pct"] <= 100


def test_reporte_pdf_y_costo_ciclo_vida(client, admin):
    _crear_flota(client, admin)
    _crear_pedidos(client, admin, 3)
    _optimizar(client, admin)
    lcc = client.get("/api/indicadores/costo-ciclo-vida", headers=admin).json()
    abc = next(v for v in lcc["vehiculos"] if v["placa"] == "ABC-101")
    assert abc["seguros_soles"] == 10.0  # 3 650 / 365 por un día
    assert abc["depreciacion_soles"] == pytest.approx(100000 * 0.2 / 365, abs=0.01)
    r = client.get("/api/indicadores/reporte.pdf", headers=admin)
    assert r.status_code == 200 and r.content.startswith(b"%PDF")
    assert "attachment" in r.headers["content-disposition"]
    malo = client.get("/api/indicadores/reporte.pdf?desde=2026-12-01&hasta=2026-11-01", headers=admin)
    assert malo.status_code == 422 and malo.json()["detail"] == "Rango de fechas inválido"
    audi = token(client, "audi@test.pe")
    assert client.get("/api/indicadores/reporte.pdf", headers=audi).status_code == 200


def test_sostenibilidad_creditos_y_meta(client, admin):
    _crear_flota(client, admin)
    _crear_pedidos(client, admin, 3)
    _optimizar(client, admin)
    s = client.get("/api/indicadores/sostenibilidad", headers=admin).json()
    assert s["creditos_carbono_soles"] >= 0 and s["avance_cero_neto_pct"] == 0
    plan = client.get("/api/compensacion/plan", headers=admin).json()
    assert plan["meta"].endswith("3 años")


# ---------------- RF-012 ----------------
def test_configuracion_del_motor_solo_admin(client, admin):
    conf = client.get("/api/configuracion", headers=admin).json()
    assert conf["velocidad_punta_kmh"] == 15 and conf["precio_diesel_galon"] == 17.5
    r = client.put("/api/configuracion", headers=admin, json={**conf, "velocidad_kmh": 22})
    assert r.status_code == 200 and r.json()["velocidad_kmh"] == 22
    h = token(client, "plan@test.pe")
    assert client.put("/api/configuracion", headers=h, json=conf).status_code == 403


def test_auditoria_registra_y_exporta_csv(client, admin):
    client.post("/api/vehiculos", headers=admin, json={"placa": "AUD-001", "capacidad_kg": 500, "rendimiento": 9})
    eventos = client.get("/api/auditoria", headers=admin).json()
    assert any(e["recurso"] == "/api/vehiculos" and e["accion"] == "POST" for e in eventos)
    csv = client.get("/api/auditoria/exportar.csv?correo=admin@test.pe", headers=token(client, "audi@test.pe"))
    assert csv.status_code == 200 and csv.headers["content-type"].startswith("text/csv")
    assert csv.text.splitlines()[0] == "id,fecha,usuario_id,correo,accion,recurso,estado_http"


def test_gestion_de_usuarios(client, admin):
    r = client.post("/api/auth/usuarios", headers=admin, json={
        "correo": "nuevo@test.pe", "nombre": "Nuevo Auditor", "password": "Secreta123", "rol": "AUDITOR"})
    assert r.status_code == 201
    uid = r.json()["id"]
    assert client.put(f"/api/auth/usuarios/{uid}", headers=admin, json={"activo": False}).json()["activo"] is False
    me = client.get("/api/auth/me", headers=admin).json()
    assert client.put(f"/api/auth/usuarios/{me['id']}", headers=admin, json={"activo": False}).status_code == 409
    assert client.put("/api/auth/usuarios/999", headers=admin, json={"activo": True}).status_code == 404


# ---------------- Encuesta SUS (ENB-007) ----------------
def test_calculo_sus_ejemplo_del_estandar():
    assert sus.puntaje_sus([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]) == 100
    assert sus.puntaje_sus([3] * 10) == 50
    assert sus.puntaje_sus([4, 2, 4, 1, 4, 2, 5, 2, 4, 2]) == 80
    assert sus.grado(80) == "A-" and sus.grado(68) == "C" and sus.grado(40) == "F"
    assert sus.adjetivo(80) == "Bueno"
    with pytest.raises(ValueError):
        sus.puntaje_sus([6] * 10)


def test_encuesta_sus_en_la_aplicacion(client, admin):
    h = token(client, "plan@test.pe")
    assert len(client.get("/api/sus/preguntas", headers=h).json()["preguntas"]) == 10
    datos = {"codigo_participante": "P1", "perfil": "Estudiante", "respuestas": [4, 2, 4, 1, 4, 2, 5, 2, 4, 2],
             "tareas_completadas": 5}
    r = client.post("/api/sus", headers=h, json=datos)
    assert r.status_code == 201 and r.json()["puntaje"] == 80
    assert client.post("/api/sus", headers=h, json=datos).status_code == 409
    assert client.post("/api/sus", headers=h, json={**datos, "codigo_participante": "P2",
                                                    "respuestas": [4] * 9}).status_code == 422
    res = client.get("/api/sus/resultados", headers=token(client, "audi@test.pe")).json()
    assert res["n"] == 1 and res["promedio"] == 80 and res["grado"] == "A-" and res["aprobado"] is True
    assert client.get("/api/sus/resultados", headers=h).status_code == 403
