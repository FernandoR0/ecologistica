"""Casos de borde de pedidos, rutas y usuarios (RN-012, RN-013, RN-014)."""

from tests.conftest import token
from tests.test_api import _crear_cliente, _crear_flota, _crear_pedidos, _optimizar


def test_actualizar_y_cancelar_pedido(client, admin):
    [pid] = _crear_pedidos(client, admin, 1)
    r = client.put(f"/api/pedidos/{pid}", headers=admin, json={"peso_kg": 90, "prioridad": "EXPRESS"})
    assert r.status_code == 200 and r.json()["peso_kg"] == 90 and r.json()["prioridad"] == "EXPRESS"
    malo = client.put(f"/api/pedidos/{pid}", headers=admin, json={"ventana_inicio": "18:00"})
    assert malo.status_code == 422
    assert client.put(f"/api/pedidos/{pid}", headers=admin,
                      json={"ventana_inicio": "12:00", "ventana_fin": "09:00"}).status_code == 422
    assert client.delete(f"/api/pedidos/{pid}", headers=admin).status_code == 204
    assert client.get(f"/api/pedidos/{pid}", headers=admin).json()["estado"] == "CANCELADO"
    assert client.get("/api/pedidos?estado=cancelado", headers=admin).headers["X-Total-Count"] == "1"
    assert client.get("/api/pedidos/999", headers=admin).status_code == 404


def test_pedido_planificado_solo_cambia_por_reoptimizacion(client, admin):
    _crear_flota(client, admin, n=1)
    [pid] = _crear_pedidos(client, admin, 1)
    _optimizar(client, admin)
    r = client.put(f"/api/pedidos/{pid}", headers=admin, json={"peso_kg": 10})
    assert r.status_code == 409 and "re-optimice" in r.json()["detail"]


def test_pedido_de_cliente_inactivo_y_codigo_duplicado(client, admin):
    cli = _crear_cliente(client, admin, "Bodega Cerrada")
    datos = {"codigo": "DUP-1", "cliente_id": cli["id"], "peso_kg": 10}
    assert client.post("/api/pedidos", headers=admin, json=datos).status_code == 201
    assert client.post("/api/pedidos", headers=admin, json=datos).status_code == 409
    # Con un pedido pendiente el cliente no se puede desactivar; al cancelarlo, sí
    assert client.delete(f"/api/clientes/{cli['id']}", headers=admin).status_code == 409
    dup = next(p for p in client.get("/api/pedidos", headers=admin).json() if p["codigo"] == "DUP-1")
    assert client.delete(f"/api/pedidos/{dup['id']}", headers=admin).status_code == 204
    assert client.delete(f"/api/clientes/{cli['id']}", headers=admin).status_code == 204
    assert client.post("/api/pedidos", headers=admin, json={**datos, "codigo": "DUP-2"}).status_code == 422


def test_cancelar_desde_pedidos_saca_el_pedido_de_su_ruta(client, admin, monkeypatch):
    monkeypatch.setattr("app.api.routers.gestion.hora_actual", lambda: "10:00")
    _crear_flota(client, admin, n=1)
    ids = _crear_pedidos(client, admin, 3)
    ruta = _optimizar(client, admin)["rutas"][0]
    cancelado = ruta["paradas"][1]["pedido"]["id"]
    assert client.delete(f"/api/pedidos/{cancelado}", headers=admin).status_code == 204
    assert client.get(f"/api/pedidos/{cancelado}", headers=admin).json()["estado"] == "CANCELADO"
    # La ruta original queda re-optimizada y la nueva ya no lleva el pedido cancelado
    assert client.get(f"/api/rutas/{ruta['id']}", headers=admin).json()["estado"] == "REOPTIMIZADA"
    vigentes = client.get("/api/rutas?vigentes=true", headers=admin).json()
    en_ruta = [p["pedido"]["id"] for r in vigentes for p in r["paradas"]]
    assert cancelado not in en_ruta and sorted(en_ruta) == sorted(set(ids) - {cancelado})
    inc = client.get(f"/api/rutas/{ruta['id']}/incidentes", headers=admin).json()
    assert inc[0]["tipo"] == "CANCELACION" and inc[0]["pedido_id"] == cancelado
    # Cancelar de nuevo no falla; un pedido entregado no se puede cancelar
    assert client.delete(f"/api/pedidos/{cancelado}", headers=admin).status_code == 204
    nueva = vigentes[0]
    entregado = nueva["paradas"][0]
    client.patch(f"/api/rutas/{nueva['id']}/paradas/{entregado['id']}/entregada", headers=admin)
    r = client.delete(f"/api/pedidos/{entregado['pedido']['id']}", headers=admin)
    assert r.status_code == 409 and "ya fue entregado" in r.json()["detail"]


def test_cancelar_el_ultimo_pendiente_sin_jornada_cierra_la_ruta(client, admin, monkeypatch):
    _crear_flota(client, admin, n=1)
    [pid] = _crear_pedidos(client, admin, 1)
    ruta = _optimizar(client, admin)["rutas"][0]
    # A las 23:00 ya no queda jornada para recalcular: se quita la parada y la ruta se cierra
    monkeypatch.setattr("app.api.routers.gestion.hora_actual", lambda: "23:00")
    assert client.delete(f"/api/pedidos/{pid}", headers=admin).status_code == 204
    detalle = client.get(f"/api/rutas/{ruta['id']}", headers=admin).json()
    assert detalle["paradas"] == [] and detalle["estado"] == "COMPLETADA"
    assert client.get(f"/api/rutas/{ruta['id']}/incidentes", headers=admin).json()[0]["hora"] == "23:00"


def test_no_desactiva_vehiculo_conductor_ni_cliente_con_trabajo_pendiente(client, admin):
    [v1] = _crear_flota(client, admin, n=1)
    cli = _crear_cliente(client, admin, "Bodega Activa")
    _crear_pedidos(client, admin, 1, cliente_id=cli["id"])
    # Cliente con un pedido pendiente
    r = client.delete(f"/api/clientes/{cli['id']}", headers=admin)
    assert r.status_code == 409 and "Cancélelos en Pedidos" in r.json()["detail"]
    ruta = _optimizar(client, admin)["rutas"][0]
    cid = ruta["conductor"]["id"]
    for url in (f"/api/vehiculos/{v1['id']}", f"/api/conductores/{cid}"):
        r = client.delete(url, headers=admin)
        assert r.status_code == 409 and f"ruta #{ruta['id']}" in r.json()["detail"]
        # Tampoco por el formulario de edición (casilla "Activo")
        assert client.put(url, headers=admin, json={"activo": False}).status_code == 409
    # Al terminar la ruta ya se pueden desactivar
    client.patch(f"/api/rutas/{ruta['id']}/estado", headers=admin, json={"estado": "COMPLETADA"})
    assert client.delete(f"/api/conductores/{cid}", headers=admin).status_code == 204
    assert client.delete(f"/api/vehiculos/{v1['id']}", headers=admin).status_code == 204
    assert client.delete(f"/api/clientes/{cli['id']}", headers=admin).status_code == 204


def test_generar_no_reasigna_vehiculos_en_reparto(client, admin):
    _crear_flota(client, admin, n=1)
    _crear_pedidos(client, admin, 2)
    ruta = _optimizar(client, admin)["rutas"][0]
    client.patch(f"/api/rutas/{ruta['id']}/paradas/{ruta['paradas'][0]['id']}/entregada", headers=admin)
    _crear_pedidos(client, admin, 1)
    r = client.post("/api/rutas/optimizar", headers=admin, json={"fecha": "2026-11-16", "limite_segundos": 1})
    assert r.status_code == 409 and "en reparto" in r.json()["detail"]
    # La ruta en curso no se tocó
    assert client.get(f"/api/rutas/{ruta['id']}", headers=admin).json()["estado"] == "EN_CURSO"


def test_rutas_vigentes_y_de_dias_anteriores(client, admin, db):
    from datetime import date  # noqa: PLC0415

    from app.models import Ruta  # noqa: PLC0415

    _crear_flota(client, admin, n=1)
    _crear_pedidos(client, admin, 1)
    ruta = _optimizar(client, admin)["rutas"][0]
    assert [r["id"] for r in client.get("/api/rutas?vigentes=true", headers=admin).json()] == [ruta["id"]]
    # Una ruta planificada de un día anterior ya no se muestra como vigente
    db.get(Ruta, ruta["id"]).fecha = date(2026, 11, 13)
    db.commit()
    assert client.get("/api/rutas?vigentes=true", headers=admin).json() == []
    # Pero si quedó en curso, sigue a la vista hasta cerrarla
    db.get(Ruta, ruta["id"]).estado = "EN_CURSO"
    db.commit()
    assert [r["id"] for r in client.get("/api/rutas?vigentes=true", headers=admin).json()] == [ruta["id"]]


def test_hora_de_operacion_en_lima():
    from datetime import timedelta  # noqa: PLC0415

    from app.core import tiempo  # noqa: PLC0415

    assert tiempo.ahora().utcoffset() == timedelta(hours=-5)
    assert tiempo.hoy() == tiempo.ahora().date()
    assert len(tiempo.hora_actual()) == 5 and tiempo.hora_actual()[2] == ":"


def test_codigo_de_pedido_automatico(client, admin):
    cli = _crear_cliente(client, admin, "Bodega Auto")
    a = client.post("/api/pedidos", headers=admin, json={"cliente_id": cli["id"], "peso_kg": 10})
    b = client.post("/api/pedidos", headers=admin, json={"cliente_id": cli["id"], "peso_kg": 12})
    assert a.status_code == b.status_code == 201
    assert a.json()["codigo"] == f"PED-{a.json()['id']:04d}"
    assert b.json()["codigo"] == f"PED-{b.json()['id']:04d}"
    # Si alguien ya usó a mano el código que tocaba, se agrega un sufijo en lugar de fallar
    siguiente = f"PED-{b.json()['id'] + 2:04d}"
    assert client.post("/api/pedidos", headers=admin,
                       json={"codigo": siguiente, "cliente_id": cli["id"], "peso_kg": 5}).status_code == 201
    c = client.post("/api/pedidos", headers=admin, json={"cliente_id": cli["id"], "peso_kg": 7})
    assert c.status_code == 201 and c.json()["codigo"] == f"{siguiente}-2"


def test_cliente_hereda_horario_invalido(client, admin):
    cli = _crear_cliente(client, admin, "Bodega Tarde", hora_desde="15:00", hora_hasta="18:00")
    r = client.post("/api/pedidos", headers=admin, json={"codigo": "T-1", "cliente_id": cli["id"], "peso_kg": 10,
                                                        "ventana_inicio": "17:00"})
    assert r.status_code == 201
    malo = client.post("/api/pedidos", headers=admin, json={"codigo": "T-2", "cliente_id": cli["id"], "peso_kg": 10,
                                                           "ventana_fin": "08:00"})
    assert malo.status_code == 422


def test_estado_de_ruta_y_rutas_inexistentes(client, admin):
    _crear_flota(client, admin, n=1)
    _crear_pedidos(client, admin, 2)
    ruta = _optimizar(client, admin)["rutas"][0]
    r = client.patch(f"/api/rutas/{ruta['id']}/estado", headers=admin, json={"estado": "COMPLETADA"})
    assert r.status_code == 200 and all(p["estado"] == "ENTREGADA" for p in r.json()["paradas"])
    assert client.get("/api/rutas/999", headers=admin).status_code == 404
    assert client.patch(f"/api/rutas/{ruta['id']}/paradas/999/entregada", headers=admin).status_code == 404
    assert client.get(f"/api/rutas/{ruta['id']}/incidentes", headers=admin).json() == []
    h = token(client, "cond@test.pe")
    assert client.patch(f"/api/rutas/{ruta['id']}/estado", headers=h, json={"estado": "EN_CURSO"}).status_code == 403
    parada = ruta["paradas"][0]["id"]
    assert client.patch(f"/api/rutas/{ruta['id']}/paradas/{parada}/entregada", headers=h).status_code == 403


def test_usuario_duplicado_y_conductor_sin_vehiculo(client, admin):
    datos = {"correo": "otro@test.pe", "nombre": "Otro Usuario", "password": "Secreta123", "rol": "CONDUCTOR"}
    assert client.post("/api/auth/usuarios", headers=admin, json=datos).status_code == 201
    assert client.post("/api/auth/usuarios", headers=admin, json=datos).status_code == 409
    r = client.post("/api/conductores", headers=admin, json={
        "nombre": "Sin Vehículo", "dni": "72000001", "licencia": "Q72000001", "vehiculo_id": 999})
    assert r.status_code == 422
    assert client.get("/api/conductores/999", headers=admin).status_code == 404
    assert client.put("/api/conductores/999", headers=admin, json={"nombre": "X"}).status_code == 404
