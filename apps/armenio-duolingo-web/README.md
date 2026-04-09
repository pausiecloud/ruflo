# Armenio Trip Coach (Web móvil)

Mini app web estilo Duolingo para preparar un viaje de 10 días en Armenia.

## ¿Se puede probar con un enlace directo en el navegador?

Sí.

### Opción A (más simple, mismo equipo)
Pega este enlace en tu navegador:

```text
file:///workspace/ruflo/apps/armenio-duolingo-web/index.html
```

### Opción B (móvil en la misma red Wi‑Fi)
1. Levanta un servidor local:

```bash
cd apps/armenio-duolingo-web
./run-local.sh
```

2. Copia y pega en el navegador del móvil el enlace que imprime el script (por ejemplo `http://192.168.1.34:4173`).

## Ejecutar manualmente

```bash
cd apps/armenio-duolingo-web
python3 -m http.server 4173
```

Abre `http://localhost:4173` en tu navegador.

## Funciones

- Ruta de 10 días con desbloqueo progresivo.
- Tarjetas de práctica de frases esenciales.
- Mini quiz con puntuación.
- Progreso persistente en `localStorage`.
