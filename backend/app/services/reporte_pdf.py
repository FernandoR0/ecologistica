"""RF-006 · Reporte PDF de impacto ambiental y económico de un periodo."""

from datetime import date, datetime
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from app.services import indicadores

VERDE = colors.HexColor("#0f766e")


def _tabla(filas: list[list], anchos: list[float] | None = None) -> Table:
    t = Table(filas, colWidths=anchos, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), VERDE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d9ded6")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f6f4")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def generar(db: Session, desde: date | None = None, hasta: date | None = None) -> bytes:
    d = indicadores.dashboard(db, desde, hasta)
    s = indicadores.sostenibilidad(db, desde, hasta)
    plan = indicadores.plan_compensacion(db, desde, hasta)
    rutas = indicadores._rutas(db, desde, hasta)
    lcc = indicadores.costo_ciclo_vida(db, desde, hasta)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=1.8 * cm,
                            bottomMargin=1.8 * cm, title="Reporte de sostenibilidad - EcoLogística")
    est = getSampleStyleSheet()
    periodo = f"{desde or 'inicio'} a {hasta or 'hoy'}"
    partes = [
        Paragraph("EcoLogística · DistriRápido S.A.C.", est["Title"]),
        Paragraph(f"Reporte de impacto ambiental y económico · Periodo: {periodo}", est["Heading3"]),
        Paragraph(f"Generado el {datetime.now():%d/%m/%Y %H:%M}", est["Normal"]),
        Spacer(1, 12),
        Paragraph("1. Resumen de la operación", est["Heading2"]),
        _tabla([
            ["Indicador", "Valor"],
            ["Rutas", d["rutas"]],
            ["Entregas planificadas", d["entregas_planificadas"]],
            ["Distancia recorrida", f"{d['distancia_km']} km"],
            ["Ahorro de distancia", f"{d['ahorro_km']} km ({d['ahorro_km_pct']} %)"],
            ["Cumplimiento de ventanas horarias", f"{d['cumplimiento_ventanas_pct']} %"],
        ], [8 * cm, 7 * cm]),
        Spacer(1, 10),
        Paragraph("2. Impacto ambiental", est["Heading2"]),
        _tabla([
            ["Indicador", "Valor"],
            ["CO₂ emitido".replace("₂", "2"), f"{s['co2_emitido_kg']} kg"],
            ["CO2 evitado por la optimización", f"{s['co2_evitado_por_optimizacion_kg']} kg"],
            ["CO2 compensado", f"{s['co2_compensado_kg']} kg"],
            ["Huella neta", f"{s['co2_neto_kg']} kg"],
            ["CO2 por entrega", f"{d['co2_por_entrega_kg']} kg"],
            ["Equivalente en árboles (absorción de un año)", d["arboles_equivalentes"]],
        ], [8 * cm, 7 * cm]),
        Spacer(1, 10),
        Paragraph("3. Impacto económico", est["Heading2"]),
        _tabla([
            ["Indicador", "Valor"],
            ["Combustible ahorrado", f"{d['combustible_ahorrado_l']} L"],
            ["Electricidad ahorrada", f"{d['electricidad_ahorrada_kwh']} kWh"],
            ["Ahorro estimado en combustible", f"S/ {d['ahorro_combustible_soles']}"],
        ], [8 * cm, 7 * cm]),
        Spacer(1, 10),
        Paragraph("4. Emisiones por tipo de combustible", est["Heading2"]),
        _tabla([["Combustible", "Rutas", "km", "kg CO2"]]
               + [[k, v["rutas"], v["km"], v["co2_kg"]] for k, v in s["por_combustible"].items()]),
        Spacer(1, 10),
        Paragraph("5. Emisiones por ruta", est["Heading2"]),
        _tabla([["Ruta", "Fecha", "Vehículo", "Paradas", "km", "kg CO2", "Ahorro km"]]
               + [[f"#{r.id}", r.fecha.strftime("%d/%m/%Y"), r.vehiculo.placa, len(r.paradas), r.distancia_km,
                   r.co2_kg, round(r.distancia_base_km - r.distancia_km, 2)] for r in rutas]),
        Spacer(1, 10),
        Paragraph("6. Costo del ciclo de vida de la flota", est["Heading2"]),
        Paragraph(
            f"Periodo de {lcc['dias']} días. Supuestos: diésel S/ {lcc['supuestos']['precio_diesel_galon']} por galón, "
            f"mantenimiento S/ {lcc['supuestos']['mantenimiento_km']} por km, depreciación "
            f"{int(lcc['supuestos']['depreciacion_anual'] * 100)} % anual y seguros (SOAT + vehicular) prorrateados.",
            est["Normal"],
        ),
        _tabla([["Placa", "km", "Combustible", "Mant.", "Deprec.", "Seguros", "Total S/", "S/ por km"]]
               + [[v["placa"], v["km"], v["combustible_soles"], v["mantenimiento_soles"], v["depreciacion_soles"],
                   v["seguros_soles"], v["total_soles"], v["costo_por_km"]] for v in lcc["vehiculos"]]
               + [["Total", "", "", "", "", "", lcc["total_soles"], ""]]),
        Spacer(1, 10),
        Paragraph("7. Créditos de carbono y meta de cero carbono neto", est["Heading2"]),
        _tabla([
            ["Indicador", "Valor"],
            ["Ahorro en créditos de carbono (CO2 evitado a S/ 60 por t)", f"S/ {s['creditos_carbono_soles']}"],
            ["CO2 compensado / CO2 emitido", f"{s['avance_cero_neto_pct']} %"],
            ["Meta", plan["meta"]],
        ], [9 * cm, 6 * cm]),
        Spacer(1, 10),
        Paragraph("8. Plan de compensación", est["Heading2"]),
        Paragraph(f"CO2 pendiente de compensar: {plan['co2_pendiente_kg']} kg", est["Normal"]),
    ]
    for o in plan["opciones"]:
        detalle = (f"{o['arboles_necesarios_por_anio']} árboles por año" if "arboles_necesarios_por_anio" in o
                   else f"S/ {o['costo_estimado_soles']}")
        partes.append(Paragraph(f"• {o['accion']}: {detalle} ({o['supuesto']}).", est["Normal"]))
    doc.build(partes)
    return buffer.getvalue()
