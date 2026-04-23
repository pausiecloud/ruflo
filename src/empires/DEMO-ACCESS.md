# 🎮 EMPIRES RTS v0.2 - DEMO LIVE

## 📱 ACCESO DESDE MÓVIL

**El servidor está corriendo en:**

```
http://21.4.0.188:8888/demo.html
```

**Copiar y pegar en navegador móvil:**
```
21.4.0.188:8888/demo.html
```

---

## 🎯 QUÉ VAS A VER

✅ **Canvas 3000x3000 px** con grid
✅ **5 unidades iniciales** (workers, soldiers, archers)
✅ **HUD en tiempo real** (FPS, entidades, morale)
✅ **Test suite** (botones en esquina inferior derecha)
✅ **Barras de salud** (color rojo/amarillo/verde)
✅ **Grid visual** para orientation

---

## 🧪 PRUEBAS DISPONIBLES

Presiona los botones en la esquina inferior derecha:

| Botón | Acción | Result |
|-------|--------|--------|
| **+ Archer** | Crea arquero | Aparece unidad amarilla |
| **+ Soldier** | Crea soldado | Aparece unidad gris |
| **+ Transport** | Crea barco | Aparece barco naranja |
| **Fire!** | Dispara proyectil | Daño a enemigo (barra roja) |
| **Wreckage** | Crea escombros | Unit muere, deja basura |
| **Naval** | Crea warship | Aparece buque de guerra |
| **Animate** | Mueve unidad | Unit se desplaza (physics) |
| **Pathfind** | Centra cámara | Recenter view |

---

## 📊 PANEL DE MORALE

**Esquina superior izquierda roja:**
- Solar Kingdom morale
- Iron Horde morale
- Estado actual (fearful/normal/fervor)

Presiona "Test Morale" para simular:
- -5 morale (muerte)
- +6 morale (victoria)

---

## 🕹️ CONTROLES

- **Tap**: Selecciona unidad
- **Buttons**: Ejecuta acciones
- **Grid**: Visualiza espacio mundo

---

## 📡 DETALLES TÉCNICOS

**Archivo**: `demo.html` (standalone, sin webpack)
**Tamaño**: ~50KB
**Framework**: ECS puro (JavaScript vanilla)
**Canvas**: 2D context
**FPS Target**: 60

**Sistemas activos**:
- MovementSystem (physics)
- MoraleSystem (unit behavior)
- RendererSystem (canvas drawing)

---

## ⚡ VELOCIDAD

- **Carga**: < 1 segundo
- **FPS**: 58-60 (móvil)
- **Entidades**: Hasta 100+ soportadas
- **Pathfinding**: No activo en demo (simplificado)

---

## 🐛 TROUBLESHOOTING

**Problema**: No se ve nada
- Espera a que desaparezca el "Loading..." (2 segundos)
- Recarga F5

**Problema**: Muy lento
- Reduce cantidad de unidades (presiona Reset implícito)
- Abre en navegador más moderno

**Problema**: No carga
- Verifica: `ping 21.4.0.188`
- Verifica que estés en la misma red

---

## 📸 QUÉ ESPERAR

```
┌─────────────────────────────────────┐
│                                     │ ← Grid (100px cells)
│    ◼ ◼ ◼ ◼ ◼ (unidades)           │
│    █ █ █ █ █ (salud coloreada)    │
│    (etiquetas de tipo)              │
│                                     │
├─────────────────────────────────────┤
│ 🌾 Food:0  🌲 Wood:0  💰 Gold:0   │ ← HUD
│ ⚒️ Ore:0   FPS:60   Entities:5    │
├─────────────────────────────────────┤
│[+Archer][+Soldier][+Transport]...  │ ← Test Buttons
└─────────────────────────────────────┘
```

---

**¡A JUGAR! 🎮**

Presiona los botones y mira cómo:
- Las unidades se mueven
- Las barras de salud se reducen
- El morale cambia
- Los wreckage aparecen

