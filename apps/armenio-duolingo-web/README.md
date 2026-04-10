# Armenio Path

Mini app web tipo Duolingo para aprender armenio con un mapa de unidades y lecciones reales.

## Qué incluye

- Mapa de curso con desbloqueo progresivo.
- Ejercicios de elección múltiple, completar frases, ordenar palabras y voz.
- Corazones, XP, racha y coronas por lección.
- Progreso persistente en `localStorage`.

## Probarlo en local

```bash
cd apps/armenio-duolingo-web
python3 -m http.server 4173
```

Abre `http://localhost:4173` en el navegador.

## Probarlo desde iPhone

### Opción A: misma Wi-Fi

1. Ejecuta el servidor local.
2. Abre la IP que imprime el script o el servidor, por ejemplo `http://192.168.1.34:4173`.

### Opción B: enlace público temporal

```bash
cd apps/armenio-duolingo-web
./run-public.sh
```

El script levanta un túnel y te devuelve una URL `https://...` para abrir en Safari.

## Enlace estable

El proyecto está preparado para GitHub Pages con el workflow `.github/workflows/armenio-pages.yml`.

Cuando el repo se publique en `main`, el enlace estable será:

```text
https://pausiecloud.github.io/ruflo/
```
