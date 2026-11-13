from tests.conftest import token


def test_login_correcto_devuelve_token(client):
    r = client.post("/api/auth/login", json={"correo": "admin@test.pe", "password": "Secreta123"})
    assert r.status_code == 200
    assert r.json()["usuario"]["rol"] == "ADMIN"


def test_login_incorrecto_401(client):
    r = client.post("/api/auth/login", json={"correo": "admin@test.pe", "password": "mala"})
    assert r.status_code == 401


def test_bloqueo_tras_cinco_intentos(client):
    for _ in range(5):
        client.post("/api/auth/login", json={"correo": "plan@test.pe", "password": "mala"})
    r = client.post("/api/auth/login", json={"correo": "plan@test.pe", "password": "Secreta123"})
    assert r.status_code == 429


def test_endpoint_protegido_sin_token(client):
    assert client.get("/api/vehiculos").status_code == 401


def test_token_invalido(client):
    assert client.get("/api/vehiculos", headers={"Authorization": "Bearer xxx"}).status_code == 401


def test_conductor_no_puede_crear_vehiculos(client):
    h = token(client, "cond@test.pe")
    r = client.post("/api/vehiculos", headers=h,
                    json={"placa": "XYZ-999", "capacidad_kg": 500, "consumo_100km": 10})
    assert r.status_code == 403


def test_me_y_cabeceras_seguridad(client, admin):
    r = client.get("/api/auth/me", headers=admin)
    assert r.json()["correo"] == "admin@test.pe"
    assert r.headers["X-Frame-Options"] == "DENY"
