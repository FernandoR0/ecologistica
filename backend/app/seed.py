"""Crea las tablas y carga datos de demostración (Huancayo). Uso: python -m app.seed"""

import random

from sqlalchemy import select

from app.core.security import hash_password
from app.db import Base, SessionLocal, engine
from app.models import Conductor, Pedido, PreferenciaCliente, Usuario, Vehiculo

DISTRITOS = {
    "Huancayo": (-12.0651, -75.2049),
    "El Tambo": (-12.0560, -75.2160),
    "Chilca": (-12.0850, -75.2010),
}
CLIENTES = [
    "Bodega Doña Rosa", "Minimarket El Sol", "Restaurante Wanka", "Farmacia Salud Total", "Bodega San Carlos",
    "Panadería La Espiga", "Market Los Andes", "Pollería El Huanca", "Botica Mantaro", "Bodega Santa Isabel",
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
        ])
        conductor_user = Usuario(correo="conductor@ecologistica.pe", nombre="Luis Quispe", rol="CONDUCTOR",
                                 password_hash=hash_password("Cond123*"))
        db.add(conductor_user)
        vehs = [
            Vehiculo(placa="ABC-101", tipo="Furgón", capacidad_kg=1500, combustible="DIESEL", consumo_100km=11),
            Vehiculo(placa="ABC-102", tipo="Furgoneta", capacidad_kg=1000, combustible="GLP", consumo_100km=13),
            Vehiculo(placa="ELE-001", tipo="Furgoneta eléctrica", capacidad_kg=600, combustible="ELECTRICO",
                     consumo_100km=18),
        ]
        db.add_all(vehs)
        db.flush()
        db.add_all([
            Conductor(nombre="Luis Quispe", dni="70000001", licencia="A-IIb-1001", vehiculo_id=vehs[0].id,
                      usuario_id=conductor_user.id),
            Conductor(nombre="María Huamán", dni="70000002", licencia="A-IIb-1002", vehiculo_id=vehs[1].id),
            Conductor(nombre="Jorge Rojas", dni="70000003", licencia="A-IIa-1003", vehiculo_id=vehs[2].id,
                      partida_lat=-12.0560, partida_lng=-75.2160),  # sale desde El Tambo
        ])
        rnd = random.Random(42)  # noqa: S311 - datos de demostración, no criptografía
        for i in range(20):
            distrito, (lat, lng) = rnd.choice(list(DISTRITOS.items()))
            ini = rnd.choice(["08:00", "09:00", "10:00", "13:00"])
            fin = {"08:00": "12:00", "09:00": "13:00", "10:00": "16:00", "13:00": "18:00"}[ini]
            db.add(Pedido(
                codigo=f"PED-{i + 1:04d}", cliente=CLIENTES[i % len(CLIENTES)],
                direccion=f"Jr. Demo {100 + i}", distrito=distrito,
                lat=round(lat + rnd.uniform(-0.012, 0.012), 6), lng=round(lng + rnd.uniform(-0.012, 0.012), 6),
                peso_kg=rnd.choice([40, 60, 80, 120, 150, 200]), ventana_inicio=ini, ventana_fin=fin,
                prioridad=rnd.choice([1, 2, 2, 3]),
            ))
        db.add_all([
            PreferenciaCliente(cliente="Restaurante Wanka", hora_desde="09:00", hora_hasta="11:00",
                               punto_referencia="Frente al parque Huamanmarca",
                               restricciones_acceso="Descarga por la puerta lateral",
                               notas="Recibe antes del almuerzo"),
            PreferenciaCliente(cliente="Farmacia Salud Total", hora_desde="08:00", hora_hasta="10:00",
                               dias="1,2,3,4,5"),
        ])
        db.commit()
        print("Datos demo cargados. Usuario: admin@ecologistica.pe / Admin123*")
    finally:
        db.close()


if __name__ == "__main__":
    run()
