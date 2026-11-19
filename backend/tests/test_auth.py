"""RF-011 · Autenticación, bloqueo (RN-001) y control de acceso por rol (matriz RBAC)."""

from tests.conftest import token


def test_login_correcto_devuelve_token(client):
    r = client.post("/api/auth/login", json={"correo": "admin@test.pe", "password": "Secreta123"})
    assert r.status_code == 200
    assert r.json()["usuario"]["rol"] == "ADMIN"


def test_login_incorrecto_401(client):
    r = client.post("/api/auth/login", json={"correo": "admin@test.pe", "password": "mala"})
    assert r.status_code == 401


def test_bloqueo_tras_tres_intentos_y_auditoria(client, admin):
    respuestas = [client.post("/api/auth/login", json={"correo": "plan@test.pe", "password": "mala"}).status_code
                  for _ in range(3)]
    assert respuestas == [401, 401, 423]
    r = client.post("/api/auth/login", json={"correo": "plan@test.pe", "password": "Secreta123"})
    assert r.status_code == 423
    eventos = client.get("/api/auditoria?correo=plan@test.pe", headers=admin).json()
    assert {e["estado_http"] for e in eventos} >= {401, 423}
    assert all(e["accion"] == "LOGIN" for e in eventos)


def test_acceso_correcto_limpia_intentos(client):
    for _ in range(2):
        client.post("/api/auth/login", json={"correo": "plan@test.pe", "password": "mala"})
    assert client.post("/api/auth/login", json={"correo": "plan@test.pe", "password": "Secreta123"}).status_code == 200
    assert client.post("/api/auth/login", json={"correo": "plan@test.pe", "password": "mala"}).status_code == 401


def test_endpoint_protegido_sin_token(client):
    assert client.get("/api/vehiculos").status_code == 401


def test_token_invalido(client):
    assert client.get("/api/vehiculos", headers={"Authorization": "Bearer xxx"}).status_code == 401


def test_conductor_no_puede_crear_vehiculos(client):
    h = token(client, "cond@test.pe")
    r = client.post("/api/vehiculos", headers=h, json={"placa": "XYZ-999", "capacidad_kg": 500, "rendimiento": 10})
    assert r.status_code == 403


def test_auditor_solo_lectura(client):
    h = token(client, "audi@test.pe")
    assert client.get("/api/vehiculos", headers=h).status_code == 200
    assert client.get("/api/auditoria", headers=h).status_code == 200
    assert client.get("/api/auth/usuarios", headers=h).status_code == 200
    assert client.post("/api/vehiculos", headers=h, json={"placa": "XYZ-998", "capacidad_kg": 1,
                                                          "rendimiento": 1}).status_code == 403
    assert client.post("/api/rutas/optimizar", headers=h, json={}).status_code == 403
    assert client.put("/api/configuracion", headers=h, json={}).status_code in (403, 422)


def test_planificador_no_entra_a_administracion(client):
    h = token(client, "plan@test.pe")
    assert client.get("/api/auditoria", headers=h).status_code == 403
    assert client.get("/api/auth/usuarios", headers=h).status_code == 403
    assert client.get("/api/configuracion", headers=h).status_code == 200  # lectura de parámetros


def test_me_y_cabeceras_seguridad(client, admin):
    r = client.get("/api/auth/me", headers=admin)
    assert r.json()["correo"] == "admin@test.pe"
    assert r.headers["X-Frame-Options"] == "DENY"
