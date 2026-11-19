"""Pruebas de integración: gestión (RF-001, RF-002, RF-008, RF-009) y flujo pedido → ruta → incidente → indicadores."""

from datetime import date

from tests.conftest import token

HOY = date(2026, 11, 16).isoformat()  # lunes


def _crear_flota(client, h, n=2):
    datos = [
        {"placa": "ABC-101", "tipo": "CAMIONETA", "capacidad_kg": 800, "volumen_m3": 8, "combustible": "DIESEL",
         "rendimiento": 9, "anio_fabricacion": 2018, "valor_adquisicion_soles": 100000, "seguro_anual_soles": 3650},
        {"placa": "ELE-001", "tipo": "CAMIONETA", "capacidad_kg": 500, "volumen_m3": 4, "combustible": "ELECTRICO",
         "rendimiento": 5.5, "anio_fabricacion": 2023},
        {"placa": "GLP-003", "tipo": "FURGON", "capacidad_kg": 1000, "volumen_m3": 10, "combustible": "GLP",
         "rendimiento": 7.5},
    ][:n]
    vehiculos = []
    for i, d in enumerate(datos):
        v = client.post("/api/vehiculos", headers=h, json=d)
        assert v.status_code == 201, v.text
        r = client.post("/api/conductores", headers=h, json={
            "nombre": f"Conductor {i}", "dni": f"7000000{i}", "licencia": f"Q7000000{i}",
            "categoria_licencia": "A-IIb", "vehiculo_id": v.json()["id"]})
        assert r.status_code == 201, r.text
        vehiculos.append(v.json())
    return vehiculos


def _crear_cliente(client, h, nombre="Bodega 0", **extra):
    r = client.post("/api/clientes", headers=h, json={
        "nombre": nombre, "direccion": "Jr. Real 100", "distrito": "Huancayo", "lat": -12.07, "lng": -75.21, **extra})
    assert r.status_code == 201, r.text
    return r.json()


def _crear_pedidos(client, h, n=6, cliente_id=None, **extra):
    cid = cliente_id or _crear_cliente(client, h, "Bodega Pedidos")["id"]
    ids = []
    for i in range(n):
        r = client.post("/api/pedidos", headers=h, json={
            "codigo": f"PED-{i}", "cliente_id": cid, "lat": -12.06 - i * 0.004, "lng": -75.21 + i * 0.002,
            "peso_kg": 100, "volumen_m3": 0.5, "ventana_inicio": "09:00", "ventana_fin": "17:00", **extra})
        assert r.status_code == 201, r.text
        ids.append(r.json()["id"])
    return ids


def _optimizar(client, h):
    r = client.post("/api/rutas/optimizar", headers=h, json={"fecha": HOY, "limite_segundos": 1})
    assert r.status_code == 200, r.text
    return r.json()


def test_crud_vehiculo_factor_y_duplicado(client, admin):
    r = client.post("/api/vehiculos", headers=admin, json={"placa": "ABC-101", "capacidad_kg": 800, "rendimiento": 9})
    assert r.status_code == 201
    assert r.json()["factor_emision_kg_km"] == 0.2978
    dup = client.post("/api/vehiculos", headers=admin, json={"placa": "ABC-101", "capacidad_kg": 1, "rendimiento": 1})
    assert dup.status_code == 409 and dup.json()["detail"] == "La placa ya está registrada"
    vid = r.json()["id"]
    cambio = client.put(f"/api/vehiculos/{vid}", headers=admin, json={"capacidad_kg": 900, "rendimiento": 10}).json()
    assert cambio["capacidad_kg"] == 900 and cambio["factor_emision_kg_km"] == 0.268
    assert client.delete(f"/api/vehiculos/{vid}", headers=admin).status_code == 204
    assert client.get("/api/vehiculos?activo=true", headers=admin).json() == []
    assert client.post("/api/vehiculos", headers=admin,
                       json={"placa": "ZZZ-000", "capacidad_kg": 0, "rendimiento": 9}).status_code == 422


def test_vehiculo_antiguo_restringido_en_centro(client, admin):
    v = client.post("/api/vehiculos", headers=admin, json={
        "placa": "OLD-008", "capacidad_kg": 800, "rendimiento": 8, "anio_fabricacion": 2008}).json()
    assert v["restringido_centro"] is True and v["antiguedad_anios"] > 15


def test_validaciones_de_pedido(client, admin):
    cid = _crear_cliente(client, admin)["id"]
    base = {"codigo": "X1", "cliente_id": cid, "peso_kg": 10}
    assert client.post("/api/pedidos", headers=admin, json={**base, "peso_kg": -1}).status_code == 422
    assert client.post("/api/pedidos", headers=admin,
                       json={**base, "ventana_inicio": "12:00", "ventana_fin": "09:00"}).status_code == 422
    assert client.post("/api/pedidos", headers=admin, json={**base, "lat": -12.5, "lng": -75.2}).status_code == 422
    assert client.post("/api/pedidos", headers=admin, json={**base, "cliente_id": 999}).status_code == 422


def test_pedido_hereda_datos_del_cliente(client, admin):
    cli = _crear_cliente(client, admin, "Restaurante Wanka", hora_desde="08:00", hora_hasta="11:00",
                         punto_referencia="Frente al parque", restricciones_acceso="No ingresar por Calle Real")
    p = client.post("/api/pedidos", headers=admin, json={
        "codigo": "W-1", "cliente_id": cli["id"], "peso_kg": 80, "volumen_m3": 0.4, "prioridad": "EXPRESS",
        "tipo_producto": "PERECEDERO"}).json()
    assert (p["ventana_inicio"], p["ventana_fin"]) == ("08:00", "11:00")
    assert p["punto_referencia"] == "Frente al parque" and p["cliente_nombre"] == "Restaurante Wanka"
    assert p["prioridad"] == "EXPRESS" and p["tipo_producto"] == "PERECEDERO"


def test_cliente_horario_fuera_de_rango(client, admin):
    r = client.post("/api/clientes", headers=admin, json={
        "nombre": "Bodega Nocturna", "direccion": "Jr. Ica 1", "distrito": "Chilca", "lat": -12.08, "lng": -75.2,
        "hora_desde": "04:00", "hora_hasta": "23:00"})
    assert r.status_code == 422
    assert "Horario fuera del rango operativo" in r.text


def test_conductor_licencia_segun_vehiculo_y_dni_unico(client, admin):
    moto = client.post("/api/vehiculos", headers=admin, json={
        "placa": "MOT-001", "tipo": "MOTO", "capacidad_kg": 40, "volumen_m3": 0.2, "combustible": "GASOLINA",
        "rendimiento": 35}).json()
    furgon = client.post("/api/vehiculos", headers=admin, json={
        "placa": "FUR-001", "tipo": "FURGON", "capacidad_kg": 1000, "rendimiento": 8}).json()
    base = {"nombre": "Ana Torres", "dni": "71000001", "licencia": "Q71000001", "anios_experiencia": 5,
            "disponible_desde": "07:00", "disponible_hasta": "16:00"}
    malo = client.post("/api/conductores", headers=admin,
                       json={**base, "categoria_licencia": "B-IIc", "vehiculo_id": furgon["id"]})
    assert malo.status_code == 422 and "no es válida" in malo.json()["detail"]
    ok = client.post("/api/conductores", headers=admin,
                     json={**base, "categoria_licencia": "B-IIc", "vehiculo_id": moto["id"]})
    assert ok.status_code == 201
    duplicado = client.post("/api/conductores", headers=admin, json={**base, "categoria_licencia": "A-IIb"})
    assert duplicado.status_code == 409
    assert client.post("/api/conductores", headers=admin, json={
        **base, "dni": "71000002", "disponible_desde": "16:00", "disponible_hasta": "07:00"}).status_code == 422


def test_flujo_optimizar_reoptimizar_indicadores(client, admin):
    _crear_flota(client, admin)
    ids = _crear_pedidos(client, admin)

    plan = _optimizar(client, admin)
    assert plan["estado"] == "FACTIBLE"
    assert sorted(p["pedido"]["id"] for ruta in plan["rutas"] for p in ruta["paradas"]) == ids
    assert plan["ahorro_km"] >= 0
    parada = plan["rutas"][0]["paradas"][0]
    assert parada["congestion"] in ("VERDE", "AMARILLO", "ROJO") and parada["tiempo_tramo_min"] >= 0
    assert all(p["estado"] == "PLANIFICADO" for p in client.get("/api/pedidos", headers=admin).json())

    # Sin pedidos pendientes → 409
    assert client.post("/api/rutas/optimizar", headers=admin, json={"fecha": HOY}).status_code == 409

    ruta = max(plan["rutas"], key=lambda x: len(x["paradas"]))
    primera = ruta["paradas"][0]["pedido"]["id"]
    inc = client.post(f"/api/rutas/{ruta['id']}/reoptimizar", headers=admin, json={
        "tipo": "ACCIDENTE", "hora_actual": "10:00", "demora_min": 30, "paradas_completadas": [primera],
        "descripcion": "Choque en Av. Ferrocarril"})
    assert inc.status_code == 200, inc.text
    nueva = inc.json()
    assert nueva["rutas"][0]["ruta_origen_id"] == ruta["id"]
    assert nueva["rutas"][0]["hora_inicio"] >= "10:30"
    assert primera not in [p["pedido"]["id"] for p in nueva["rutas"][0]["paradas"]]
    assert client.get(f"/api/rutas/{ruta['id']}", headers=admin).json()["estado"] == "REOPTIMIZADA"
    incidentes = client.get(f"/api/rutas/{ruta['id']}/incidentes", headers=admin).json()
    assert incidentes[0]["tipo"] == "ACCIDENTE" and incidentes[0]["ruta_nueva_id"] == nueva["rutas"][0]["id"]

    dash = client.get("/api/indicadores", headers=admin).json()
    assert dash["rutas"] >= 1 and dash["co2_kg"] > 0
    assert dash["mensaje"].startswith("Has ahorrado S/")
    sost = client.get("/api/indicadores/sostenibilidad", headers=admin).json()
    assert sost["co2_emitido_kg"] > 0

    comp = client.post("/api/compensacion", headers=admin, json={
        "fecha": HOY, "accion": "REFORESTACION", "proveedor": "Programa de reforestación de Junín",
        "co2_kg": 1.0, "costo_soles": 50})
    assert comp.status_code == 201
    plan_c = client.get("/api/compensacion/plan", headers=admin).json()
    assert plan_c["co2_pendiente_kg"] == round(max(0, sost["co2_emitido_kg"] - 1.0), 2)
    assert client.post("/api/compensacion", headers=admin, json={
        "fecha": HOY, "accion": "REFORESTACION", "co2_kg": 0}).status_code == 422


def test_averia_reparte_en_otro_vehiculo(client, admin):
    _crear_flota(client, admin, n=3)
    _crear_pedidos(client, admin, 3)
    plan = _optimizar(client, admin)
    ruta = plan["rutas"][0]
    r = client.post(f"/api/rutas/{ruta['id']}/reoptimizar", headers=admin, json={
        "tipo": "AVERIA_VEHICULO", "hora_actual": "09:00"})
    assert r.status_code in (200, 409), r.text
    if r.status_code == 200:
        assert all(n["vehiculo"]["id"] != ruta["vehiculo"]["id"] for n in r.json()["rutas"])


def test_conductor_ve_y_marca_solo_su_ruta(client, admin, db):
    from app.models import Conductor, Usuario  # noqa: PLC0415

    _crear_flota(client, admin, n=1)
    _crear_pedidos(client, admin, 2)
    usuario = db.query(Usuario).filter_by(correo="cond@test.pe").one()
    conductor = db.query(Conductor).one()
    conductor.usuario_id = usuario.id
    db.commit()
    plan = _optimizar(client, admin)
    h = token(client, "cond@test.pe")
    mias = client.get("/api/rutas/mias", headers=h).json()
    assert [r["id"] for r in mias] == [plan["rutas"][0]["id"]]
    ruta = mias[0]
    for parada in ruta["paradas"]:
        r = client.patch(f"/api/rutas/{ruta['id']}/paradas/{parada['id']}/entregada", headers=h)
        assert r.status_code == 200 and r.json()["estado"] == "ENTREGADA"
    assert client.get(f"/api/rutas/{ruta['id']}", headers=h).json()["estado"] == "COMPLETADA"
    audi = token(client, "audi@test.pe")
    assert client.patch(f"/api/rutas/{ruta['id']}/paradas/{ruta['paradas'][0]['id']}/entregada",
                        headers=audi).status_code == 403


def test_paginacion_de_pedidos(client, admin):
    _crear_pedidos(client, admin, 15)
    r = client.get("/api/pedidos", headers=admin)
    assert r.headers["X-Total-Count"] == "15"
    assert len(r.json()) == 12
    assert len(client.get("/api/pedidos?pagina=2", headers=admin).json()) == 3
    assert "direccion" not in r.json()[0]  # el listado solo trae las columnas de la tabla


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
    _optimizar(client, admin)
    r = client.get("/api/rutas?estado=PLANIFICADA,EN_CURSO", headers=admin)
    assert r.status_code == 200 and len(r.json()) >= 1
    assert client.get("/api/rutas?estado=COMPLETADA", headers=admin).json() == []
