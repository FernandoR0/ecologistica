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
    assert client.delete(f"/api/clientes/{cli['id']}", headers=admin).status_code == 204
    assert client.post("/api/pedidos", headers=admin, json={**datos, "codigo": "DUP-2"}).status_code == 422


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
