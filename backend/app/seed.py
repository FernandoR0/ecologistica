"""Crea las tablas y carga datos de demostración de Huancayo Metropolitano. Uso: python -m app.seed

Los límites distritales provienen de OpenStreetMap (© colaboradores de OpenStreetMap, licencia ODbL), simplificados.
La zona de riesgo es un ejemplo de demostración; la empresa registra las suyas desde Administración.
"""

import json
import random
from pathlib import Path

from sqlalchemy import select

from app.core.security import hash_password
from app.db import Base, SessionLocal, engine
from app.models import Cliente, Conductor, Pedido, Usuario, Vehiculo, Zona

DATOS = Path(__file__).parent / "data"

# Centros aproximados de las zonas urbanas de cada distrito
DISTRITOS = {
    "Huancayo": (-12.0680, -75.2090),
    "El Tambo": (-12.0560, -75.2180),
    "Chilca": (-12.0850, -75.2030),
}
CENTRO_HUANCAYO = [[-12.0640, -75.2155], [-12.0640, -75.2050], [-12.0730, -75.2050], [-12.0730, -75.2155]]
ZONA_RIESGO_DEMO = [[-12.0790, -75.1990], [-12.0790, -75.1930], [-12.0840, -75.1930], [-12.0840, -75.1990]]

CLIENTES = [
    # nombre, distrito, horario, días, punto de referencia, restricción
    ("Bodega Doña Rosa", "Huancayo", ("06:00", "21:00"), "LU,MA,MI,JU,VI,SA,DO", "Frente al mercado Modelo", None),
    ("Minimarket El Sol", "El Tambo", ("07:00", "21:00"), "LU,MA,MI,JU,VI,SA", None, None),
    ("Restaurante Wanka", "Huancayo", ("08:00", "11:00"), "LU,MA,MI,JU,VI,SA", "Frente al parque Huamanmarca",
     "No ingresar por Calle Real; descargar por la puerta lateral"),
    ("Farmacia Salud Total", "Chilca", ("08:00", "12:00"), "LU,MA,MI,JU,VI", None, None),
    ("Bodega San Carlos", "El Tambo", ("06:00", "20:00"), "LU,MA,MI,JU,VI,SA,DO",
     "Altura de la cuadra 20, Mz. C, Lote 5", None),
    ("Panadería La Espiga", "Chilca", ("05:30", "10:00"), "LU,MA,MI,JU,VI,SA,DO", None,
     "Calle angosta: solo camioneta"),
    ("Market Los Andes", "El Tambo", ("08:00", "20:00"), "LU,MA,MI,JU,VI,SA", None, None),
    ("Pollería El Huanca", "Huancayo", ("10:00", "16:00"), "LU,MA,MI,JU,VI,SA,DO", None, None),
    ("Botica Mantaro", "Chilca", ("08:00", "18:00"), "LU,MA,MI,JU,VI,SA", "Al costado de la comisaría", None),
    ("Bodega Santa Isabel", "Huancayo", ("07:00", "13:00"), "LU,MA,MI,JU,VI,SA", None, None),
]


def run() -> None:
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        if db.scalar(select(Usuario).where(Usuario.correo == "admin@ecologistica.pe")):
            print("Datos demo ya cargados.")
            return
        db.add_all([
            Usuario(correo="admin@ecologistica.pe", nombre="Administrador", rol="ADMIN",
                    password_hash=hash_password("Admin123*")),
            Usuario(correo="planificador@ecologistica.pe", nombre="Planificador", rol="PLANIFICADOR",
                    password_hash=hash_password("Plan123*")),
            Usuario(correo="auditor@ecologistica.pe", nombre="Auditor ambiental", rol="AUDITOR",
                    password_hash=hash_password("Audi123*")),
            Usuario(correo="evaluador@ecologistica.pe", nombre="Evaluador de usabilidad", rol="PLANIFICADOR",
                    password_hash=hash_password("Eval123*")),
        ])
        conductor_user = Usuario(correo="conductor@ecologistica.pe", nombre="Luis Quispe", rol="CONDUCTOR",
                                 password_hash=hash_password("Cond123*"))
        db.add(conductor_user)
        vehs = [
            Vehiculo(placa="ABC-101", tipo="CAMIONETA", capacidad_kg=1500, volumen_m3=8, combustible="DIESEL",
                     rendimiento=9, anio_fabricacion=2018, valor_adquisicion_soles=120000, seguro_anual_soles=3500),
            Vehiculo(placa="ABC-102", tipo="FURGON", capacidad_kg=1000, volumen_m3=10, combustible="GLP",
                     rendimiento=7.5, anio_fabricacion=2016, valor_adquisicion_soles=95000, seguro_anual_soles=3000),
            Vehiculo(placa="ELE-001", tipo="CAMIONETA", capacidad_kg=600, volumen_m3=4, combustible="ELECTRICO",
                     rendimiento=5.5, anio_fabricacion=2023, valor_adquisicion_soles=150000, seguro_anual_soles=4000),
            Vehiculo(placa="DSL-208", tipo="CAMIONETA", capacidad_kg=1200, volumen_m3=6, combustible="DIESEL",
                     rendimiento=8, anio_fabricacion=2008, valor_adquisicion_soles=45000, seguro_anual_soles=2500),
        ]
        db.add_all(vehs)
        db.flush()
        db.add_all([
            Conductor(nombre="Luis Quispe", dni="70000001", licencia="Q70000001", categoria_licencia="A-IIb",
                      anios_experiencia=8, telefono="964000001", disponible_desde="07:00", disponible_hasta="17:00",
                      vehiculo_id=vehs[0].id, usuario_id=conductor_user.id),
            Conductor(nombre="María Huamán", dni="70000002", licencia="Q70000002", categoria_licencia="A-IIb",
                      anios_experiencia=5, telefono="964000002", disponible_desde="07:00", disponible_hasta="16:00",
                      vehiculo_id=vehs[1].id),
            Conductor(nombre="Jorge Rojas", dni="70000003", licencia="Q70000003", categoria_licencia="A-IIa",
                      anios_experiencia=3, telefono="964000003", disponible_desde="08:00", disponible_hasta="17:00",
                      vehiculo_id=vehs[2].id, partida_lat=-12.0560, partida_lng=-75.2160),  # sale desde El Tambo
            Conductor(nombre="Rosa Pari", dni="70000004", licencia="Q70000004", categoria_licencia="A-I",
                      anios_experiencia=12, telefono="964000004", disponible_desde="07:00", disponible_hasta="15:00",
                      vehiculo_id=vehs[3].id),
        ])
        rnd = random.Random(42)  # noqa: S311 - datos de demostración, no criptografía
        clientes = []
        for i, (nombre, distrito, (desde, hasta), dias, referencia, restriccion) in enumerate(CLIENTES):
            lat, lng = DISTRITOS[distrito]
            if nombre in ("Restaurante Wanka", "Bodega Santa Isabel"):
                lat, lng = -12.0690 + rnd.uniform(-0.002, 0.002), -75.2100 + rnd.uniform(-0.003, 0.003)  # Centro
            else:
                lat, lng = lat + rnd.uniform(-0.010, 0.010), lng + rnd.uniform(-0.010, 0.010)
            clientes.append(Cliente(
                nombre=nombre, telefono=f"96410{i:04d}", direccion=f"Jr. Demostración {100 + i}", distrito=distrito,
                punto_referencia=referencia, restricciones_acceso=restriccion, hora_desde=desde, hora_hasta=hasta,
                dias_atencion=dias, lat=round(lat, 6), lng=round(lng, 6),
            ))
        db.add_all(clientes)
        db.flush()
        for i in range(20):
            cli = clientes[i % len(clientes)]
            ini = rnd.choice(["08:00", "09:00", "10:00", "13:00"])
            fin = {"08:00": "12:00", "09:00": "13:00", "10:00": "16:00", "13:00": "18:00"}[ini]
            db.add(Pedido(
                codigo=f"PED-{i + 1:04d}", cliente_id=cli.id, direccion=cli.direccion,
                punto_referencia=cli.punto_referencia,
                lat=round(cli.lat + rnd.uniform(-0.0015, 0.0015), 6),
                lng=round(cli.lng + rnd.uniform(-0.0015, 0.0015), 6),
                peso_kg=rnd.choice([40, 60, 80, 120, 150, 200]), volumen_m3=rnd.choice([0.2, 0.4, 0.6, 0.8, 1.0]),
                ventana_inicio=ini, ventana_fin=fin,
                prioridad=rnd.choice(["EXPRESS", "ESTANDAR", "ESTANDAR", "ECONOMICO"]),
                tipo_producto=rnd.choice(["PERECEDERO", "NO_PERECEDERO", "NO_PERECEDERO"]),
            ))
        distritos = json.loads((DATOS / "distritos.json").read_text(encoding="utf-8"))
        db.add_all([Zona(nombre=f"Distrito de {n}", tipo="DISTRITO", poligono=p) for n, p in distritos.items()])
        db.add_all([
            Zona(nombre="Centro de Huancayo (acceso restringido a diésel > 15 años)", tipo="RESTRINGIDA",
                 poligono=CENTRO_HUANCAYO),
            Zona(nombre="Zona de riesgo (demostración)", tipo="RIESGO", poligono=ZONA_RIESGO_DEMO),
        ])
        db.commit()
        print("Datos demo cargados. Usuario: admin@ecologistica.pe / Admin123*")
    finally:
        db.close()


if __name__ == "__main__":
    run()
