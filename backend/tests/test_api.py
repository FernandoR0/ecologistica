"""Pruebas de integración: flujo completo pedido → ruta → incidente → indicadores."""

from datetime import date

from tests.conftest import token

HOY = date(2026, 11, 16).isoformat()  # lunes


def _crear_flota(client, h):
    v1 = client.post("/api/vehiculos", headers=h, json={
        "placa": "ABC-101", "capacidad_kg": 800, "combustible": "DIESEL", "consumo_100km": 11}).json()
    v2 = client.post("/api/vehiculos", headers=h, json={
        "placa": "ELE-001", "capacidad_kg": 500, "combustible": "ELECTRICO", "consumo_100km": 18}).json()
    for i, v in enumerate((v1, v2)):
        r = client.post("/api/conductores", headers=h, json={
            "nombre": f"Conductor {i}", "dni": f"7000000{i}", "licencia": "A-IIb-1", "vehiculo_id": v["id"]})
        assert r.status_code == 201, r.text
    return v1, v2


def _crear_pedidos(client, h, n=6):
    ids = []
    for i in range(n):
        r = client.post("/api/pedidos", headers=h, json={
            "codigo": f"PED-{i}", "cliente": f"Bodega {i}", "direccion": "Jr. Real 100",
            "lat": -12.06 - i * 0.004, "lng": -75.21 + i * 0.002, "peso_kg": 100,
            "ventana_inicio": "08:00", "ventana_fin": "17:00"})
        assert r.status_code == 201, r.text
        ids.append(r.json()["id"])
    return ids


def test_crud_vehiculo_y_duplicado(client, admin):
    r = client.post("/api/vehiculos", headers=admin,
                    json={"placa": "ABC-101", "capacidad_kg": 800, "consumo_100km": 11})
    assert r.status_code == 201
    dup = client.post("/api/vehiculos", headers=admin, json={"placa": "ABC-101", "capacidad_kg": 1, "consumo_100km": 1})
    assert dup.status_code == 409
    vid = r.json()["id"]
    assert client.put(f"/api/vehiculos/{vid}", headers=admin, json={"capacidad_kg": 900}).json()["capacidad_kg"] == 900
    assert client.delete(f"/api/vehiculos/{vid}", headers=admin).status_code == 204
    assert client.get("/api/vehiculos?activo=true", headers=admin).json() == []


def test_validacion_pedido(client, admin):
    r = client.post("/api/pedidos", headers=admin, json={
        "codigo": "X1", "cliente": "A", "direccion": "x", "lat": 0, "lng": 0, "peso_kg": -1})
    assert r.status_code == 422


def test_preferencia_restringe_ventana(client, admin):
    _crear_flota(client, admin)
    [pid] = _crear_pedidos(client, admin, 1)
    r = client.put("/api/preferencias/Bodega 0", headers=admin, json={"hora_desde": "11:00", "hora_hasta": "12:00"})
    assert r.status_code == 200
    plan = client.post("/api/rutas/optimizar", headers=admin, json={"fecha": HOY, "limite_segundos": 1}).json()
    llegada = plan["rutas"][0]["paradas"][0]["hora_llegada"]
    assert "11:00" <= llegada <= "12:00"


def test_flujo_optimizar_reoptimizar_indicadores(client, admin):
    _crear_flota(client, admin)
    ids = _crear_pedidos(client, admin)

    r = client.post("/api/rutas/optimizar", headers=admin, json={"fecha": HOY, "limite_segundos": 1})
    assert r.status_code == 200, r.text
    plan = r.json()
    assert plan["estado"] == "FACTIBLE"
    assert sorted(p["pedido"]["id"] for ruta in plan["rutas"] for p in ruta["paradas"]) == ids
    assert plan["ahorro_km"] >= 0
    assert all(p["estado"] == "PLANIFICADO" for p in client.get("/api/pedidos", headers=admin).json())

    # Sin pedidos pendientes → 409
    assert client.post("/api/rutas/optimizar", headers=admin, json={"fecha": HOY}).status_code == 409

    ruta = max(plan["rutas"], key=lambda x: len(x["paradas"]))
    primera = ruta["paradas"][0]["pedido"]["id"]
    inc = client.post(f"/api/rutas/{ruta['id']}/reoptimizar", headers=admin, json={
        "tipo": "TRAFICO", "hora_actual": "10:00", "demora_min": 30, "paradas_completadas": [primera]})
    assert inc.status_code == 200, inc.text
    nueva = inc.json()
    assert nueva["rutas"][0]["ruta_origen_id"] == ruta["id"]
    assert nueva["rutas"][0]["hora_inicio"] >= "10:30"
    assert primera not in [p["pedido"]["id"] for p in nueva["rutas"][0]["paradas"]]
    assert client.get(f"/api/rutas/{ruta['id']}", headers=admin).json()["estado"] == "REOPTIMIZADA"

    dash = client.get("/api/indicadores", headers=admin).json()
    assert dash["rutas"] >= 1 and dash["co2_kg"] > 0
    sost = client.get("/api/indicadores/sostenibilidad", headers=admin).json()
    assert sost["co2_emitido_kg"] > 0

    comp = client.post("/api/compensacion", headers=admin, json={
        "fecha": HOY, "accion": "Plantón de quinuales", "co2_kg": 1.0, "costo_soles": 50})
    assert comp.status_code == 201
    plan_c = client.get("/api/compensacion/plan", headers=admin).json()
    assert plan_c["co2_pendiente_kg"] == round(max(0, sost["co2_emitido_kg"] - 1.0), 2)


def test_averia_reparte_en_otro_vehiculo(client, admin):
    v1, _ = _crear_flota(client, admin)
    # Un tercer vehículo libre para recibir las paradas
    v3 = client.post("/api/vehiculos", headers=admin, json={
        "placa": "GLP-003", "capacidad_kg": 1000, "combustible": "GLP", "consumo_100km": 13}).json()
    client.post("/api/conductores", headers=admin, json={
        "nombre": "Reserva", "dni": "70000099", "licencia": "A-IIb-9", "vehiculo_id": v3["id"]})
    _crear_pedidos(client, admin, 3)
    plan = client.post("/api/rutas/optimizar", headers=admin, json={
        "fecha": HOY, "limite_segundos": 1}).json()
    ruta = plan["rutas"][0]
    r = client.post(f"/api/rutas/{ruta['id']}/reoptimizar", headers=admin, json={
        "tipo": "AVERIA_VEHICULO", "hora_actual": "09:00"})
    assert r.status_code in (200, 409), r.text
    if r.status_code == 200:
        assert all(n["vehiculo"]["id"] != ruta["vehiculo"]["id"] for n in r.json()["rutas"])


def test_conductor_ve_solo_sus_rutas(client, admin):
    assert client.get("/api/rutas/mias", headers=token(client, "cond@test.pe")).json() == []


def test_paginacion_de_pedidos(client, admin):
    _crear_pedidos(client, admin, 15)
    r = client.get("/api/pedidos", headers=admin)
    assert r.headers["X-Total-Count"] == "15"
    assert len(r.json()) == 12
    assert len(client.get("/api/pedidos?pagina=2", headers=admin).json()) == 3
    # El listado solo trae las columnas de la tabla
    assert "direccion" not in r.json()[0]


def test_gzip_y_etag(client, admin):
    _crear_pedidos(client, admin, 12)
    r = client.get("/api/pedidos", headers={**admin, "Accept-Encoding": "gzip"})
    assert r.headers["content-encoding"] == "gzip"
    etag = r.headers["etag"]
    otra = client.get("/api/pedidos", headers={**admin, "If-None-Match": etag})
    assert otra.status_code == 304
    assert otra.content == b""


def test_filtro_rutas_por_varios_estados(client, admin):
    _crear_flota(client, admin)
    _crear_pedidos(client, admin, 3)
    client.post("/api/rutas/optimizar", headers=admin, json={"fecha": HOY, "limite_segundos": 1})
    r = client.get("/api/rutas?estado=PLANIFICADA,EN_CURSO", headers=admin)
    assert r.status_code == 200 and len(r.json()) >= 1
    assert client.get("/api/rutas?estado=COMPLETADA", headers=admin).json() == []
