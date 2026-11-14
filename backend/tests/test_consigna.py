"""Pruebas de RF-005, RF-006, RF-007 (pedido nuevo y cancelación), RF-008, RF-009 y RF-012."""

from app.optimization.geo import hora_a_min
from app.optimization.vrptw import Instancia, PedidoNodo, VehiculoRecurso, resolver
from tests.conftest import token
from tests.test_api import HOY, _crear_flota, _crear_pedidos


def _optimizar(client, h):
    r = client.post("/api/rutas/optimizar", headers=h, json={"fecha": HOY, "limite_segundos": 1})
    assert r.status_code == 200, r.text
    return r.json()


def _nuevo_pedido(client, h, codigo="NUEVO-1"):
    r = client.post("/api/pedidos", headers=h, json={
        "codigo": codigo, "cliente": "Bodega Nueva", "direccion": "Jr. Lima 200",
        "lat": -12.07, "lng": -75.205, "peso_kg": 20, "ventana_inicio": "08:00", "ventana_fin": "18:00"})
    assert r.status_code == 201, r.text
    return r.json()["id"]


# ---------------- RF-008: punto de partida del conductor ----------------
def test_motor_cada_vehiculo_sale_de_su_punto_de_partida():
    deposito = (-12.0651, -75.2049)
    casa = (-12.0560, -75.2160)
    pedidos = [PedidoNodo(1, -12.057, -75.215, 10, hora_a_min("08:00"), hora_a_min("18:00"))]
    veh = VehiculoRecurso(1, 500, 0.3, origen=casa)
    plan = resolver(Instancia(deposito, pedidos, [veh]), 1)
    assert plan.rutas[0].partida == casa


def test_conductor_con_punto_de_partida(client, admin):
    v1, _ = _crear_flota(client, admin)
    conductores = client.get("/api/conductores", headers=admin).json()
    cid = next(c["id"] for c in conductores if c["vehiculo_id"] == v1["id"])
    r = client.put(f"/api/conductores/{cid}", headers=admin, json={"partida_lat": -12.056, "partida_lng": -75.216})
    assert r.status_code == 200 and r.json()["partida_lat"] == -12.056
    client.put(f"/api/vehiculos/{v1['id']}", headers=admin, json={"capacidad_kg": 5000})
    _crear_pedidos(client, admin, 2)
    plan = _optimizar(client, admin)
    rutas_v1 = [x for x in plan["rutas"] if x["vehiculo"]["id"] == v1["id"]]
    for ruta in rutas_v1:
        assert ruta["partida_lat"] == -12.056


# ---------------- RF-007: pedido nuevo y cancelación ----------------
def test_reoptimizar_con_pedido_nuevo(client, admin):
    _crear_flota(client, admin)
    _crear_pedidos(client, admin, 3)
    ruta = _optimizar(client, admin)["rutas"][0]
    nuevo = _nuevo_pedido(client, admin)
    r = client.post(f"/api/rutas/{ruta['id']}/reoptimizar", headers=admin, json={
        "tipo": "PEDIDO_NUEVO", "hora_actual": "09:00", "pedido_id": nuevo})
    assert r.status_code == 200, r.text
    ids = [p["pedido"]["id"] for x in r.json()["rutas"] for p in x["paradas"]]
    assert nuevo in ids
    assert client.get(f"/api/pedidos/{nuevo}", headers=admin).json()["estado"] == "PLANIFICADO"


def test_reoptimizar_por_cancelacion(client, admin):
    _crear_flota(client, admin)
    _crear_pedidos(client, admin, 3)
    ruta = max(_optimizar(client, admin)["rutas"], key=lambda x: len(x["paradas"]))
    cancelado = ruta["paradas"][-1]["pedido"]["id"]
    r = client.post(f"/api/rutas/{ruta['id']}/reoptimizar", headers=admin, json={
        "tipo": "CANCELACION", "hora_actual": "08:30", "pedido_id": cancelado})
    assert r.status_code == 200, r.text
    ids = [p["pedido"]["id"] for x in r.json()["rutas"] for p in x["paradas"]]
    assert cancelado not in ids
    assert client.get(f"/api/pedidos/{cancelado}", headers=admin).json()["estado"] == "CANCELADO"


def test_reoptimizar_validaciones_de_pedido(client, admin):
    _crear_flota(client, admin)
    _crear_pedidos(client, admin, 2)
    ruta = _optimizar(client, admin)["rutas"][0]
    sin_pedido = client.post(f"/api/rutas/{ruta['id']}/reoptimizar", headers=admin,
                             json={"tipo": "PEDIDO_NUEVO", "hora_actual": "09:00"})
    assert sin_pedido.status_code == 422
    ya_planificado = ruta["paradas"][0]["pedido"]["id"]
    r = client.post(f"/api/rutas/{ruta['id']}/reoptimizar", headers=admin,
                    json={"tipo": "PEDIDO_NUEVO", "hora_actual": "09:00", "pedido_id": ya_planificado})
    assert r.status_code == 409
    r = client.post(f"/api/rutas/{ruta['id']}/reoptimizar", headers=admin,
                    json={"tipo": "CANCELACION", "hora_actual": "09:00", "pedido_id": 9999})
    assert r.status_code == 409


def test_cancelar_unica_parada_completa_la_ruta(client, admin):
    _crear_flota(client, admin)
    [pid] = _crear_pedidos(client, admin, 1)
    ruta = _optimizar(client, admin)["rutas"][0]
    r = client.post(f"/api/rutas/{ruta['id']}/reoptimizar", headers=admin,
                    json={"tipo": "CANCELACION", "hora_actual": "08:30", "pedido_id": pid})
    assert r.json()["estado"] == "SIN_PEDIDOS"
    assert client.get(f"/api/rutas/{ruta['id']}", headers=admin).json()["estado"] == "COMPLETADA"


# ---------------- RF-005 y RF-006 ----------------
def test_dashboard_con_combustible_ventanas_y_equivalentes(client, admin):
    _crear_flota(client, admin)
    _crear_pedidos(client, admin, 6)
    _optimizar(client, admin)
    d = client.get("/api/indicadores", headers=admin).json()
    assert d["cumplimiento_ventanas_pct"] == 100.0
    assert d["combustible_ahorrado_l"] >= 0 and d["electricidad_ahorrada_kwh"] >= 0
    assert d["ahorro_combustible_soles"] >= 0
    assert d["arboles_equivalentes"] >= 0


def test_reporte_pdf(client, admin):
    _crear_flota(client, admin)
    _crear_pedidos(client, admin, 3)
    _optimizar(client, admin)
    client.post("/api/compensacion", headers=admin, json={"fecha": HOY, "accion": "Plantón", "co2_kg": 1})
    r = client.get(f"/api/indicadores/reporte.pdf?desde={HOY}&hasta={HOY}", headers=admin)
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert "attachment" in r.headers["content-disposition"]
    assert r.content[:4] == b"%PDF"


# ---------------- RF-009 ----------------
def test_preferencia_con_referencia_y_restricciones(client, admin):
    r = client.put("/api/preferencias/Bodega X", headers=admin, json={
        "hora_desde": "09:00", "hora_hasta": "11:00", "punto_referencia": "Frente al mercado",
        "restricciones_acceso": "Solo furgoneta"})
    assert r.status_code == 200
    assert r.json()["punto_referencia"] == "Frente al mercado"
    assert r.json()["restricciones_acceso"] == "Solo furgoneta"


# ---------------- RF-012 ----------------
def test_configuracion_del_motor_solo_admin(client, admin):
    conf = client.get("/api/configuracion", headers=admin).json()
    assert conf["factor_vial"] == 1.3
    nuevo = {**conf, "velocidad_kmh": 30, "limite_segundos": 2}
    r = client.put("/api/configuracion", headers=admin, json=nuevo)
    assert r.status_code == 200 and r.json()["velocidad_kmh"] == 30
    assert client.get("/api/configuracion", headers=token(client, "plan@test.pe")).status_code == 403


def test_auditoria_registra_escrituras_e_inicios_de_sesion(client, admin):
    client.post("/api/auth/login", json={"correo": "plan@test.pe", "password": "mala"})
    client.post("/api/vehiculos", headers=admin, json={"placa": "AUD-001", "capacidad_kg": 500, "consumo_100km": 10})
    registros = client.get("/api/auditoria?limite=50", headers=admin).json()
    acciones = {(x["accion"], x["recurso"], x["estado_http"], x["correo"]) for x in registros}
    assert ("LOGIN", "/api/auth/login", 401, "plan@test.pe") in acciones
    assert ("POST", "/api/vehiculos", 201, "admin@test.pe") in acciones
    solo_admin = client.get("/api/auditoria?correo=admin@test.pe", headers=admin).json()
    assert all(x["correo"] == "admin@test.pe" for x in solo_admin)
    assert client.get("/api/auditoria", headers=token(client, "plan@test.pe")).status_code == 403


def test_gestion_de_usuarios(client, admin):
    r = client.post("/api/auth/usuarios", headers=admin, json={
        "correo": "nuevo@test.pe", "nombre": "Nuevo Planificador", "password": "Secreta123", "rol": "PLANIFICADOR"})
    assert r.status_code == 201
    uid = r.json()["id"]
    assert client.post("/api/auth/usuarios", headers=admin, json={
        "correo": "nuevo@test.pe", "nombre": "Otro", "password": "Secreta123"}).status_code == 409
    assert any(u["correo"] == "nuevo@test.pe" for u in client.get("/api/auth/usuarios", headers=admin).json())
    r = client.put(f"/api/auth/usuarios/{uid}", headers=admin, json={"activo": False})
    assert r.status_code == 200 and r.json()["activo"] is False
    assert client.put("/api/auth/usuarios/9999", headers=admin, json={"activo": False}).status_code == 404
    yo = client.get("/api/auth/me", headers=admin).json()["id"]
    assert client.put(f"/api/auth/usuarios/{yo}", headers=admin, json={"activo": False}).status_code == 409
