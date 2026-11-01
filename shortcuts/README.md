# Atajos listos para firmar

Estos `.xml` son atajos completos, escritos con el formato de
[Shortcuts Playground](https://github.com/viticci/shortcuts-playground-plugin) y **validados** con su
validador (Crazy/Craig Loop). Son la versión «hecha» de lo que explica [../ATAJOS.md](../ATAJOS.md).

| Archivo | Acciones | Para qué |
| --- | --- | --- |
| `magia-enviar-carta.xml` | 3 | Envía una **carta fija** (`c=Q-2`). Duplícalo y cambia la carta para tener uno por carta. |
| `magia-enviar-carta-entrada.xml` | 6 | Toma el **texto de entrada** (`Q-2`, `Reina de Corazones`, `A♠`…), lo codifica y lo envía. Es el que usan tus otros atajos con «Ejecutar atajo». |
| `copiar-al-pc-y-magia.xml` | 8 | Reconstrucción de tu atajo **Copiar al pc** con la magia añadida: manda el portapapeles a la web del truco y después al PC (`POST http://192.168.1.45:7777/clipboard` con cuerpo JSON `{"text": …}`). |

| `identificar-carta-y-magia.xml` | 13 | Reproduce tu atajo **Identificar Carta de Póker** (grabar → transcribir → modelo) y le añade el envío: si el modelo no responde «Ninguna», codifica la carta y la manda a la web. |

> El `.shortcut` original de `iCloud/Shortcuts/Copiar al pc.shortcut` está firmado por Apple (AEA1) y su
> contenido va cifrado, así que se ha reconstruido a partir del contrato de la API del dashboard
> (`/clipboard` espera JSON con la clave `text`). Si tu atajo hacía otra cosa, dilo y se ajusta.

Ambos llevan `TU_MAGIA_KEY` como marcador: sustitúyelo por tu `MAGIA_KEY` antes de firmar.

## Firmar e importar (requiere macOS)

Apple solo firma atajos con su herramienta `shortcuts`, que existe únicamente en macOS:

```bash
shortcuts sign --mode anyone \
  --input shortcuts/magia-enviar-carta.xml \
  --output "Magia · Enviar carta.shortcut"
```

Luego abre el `.shortcut` en el Mac o mándalo al iPhone (AirDrop/Archivos) y elige *Añadir atajo*.

Si tienes Claude Code o Codex en un Mac, el plugin hace todo el ciclo solo:

```bash
claude plugin marketplace add https://github.com/viticci/shortcuts-playground-plugin
claude plugin install shortcuts-playground@shortcuts-playground
# y luego: /shortcuts-playground:sign  (o pide "sign shortcuts/magia-enviar-carta.xml")
```

## Validar sin Mac

El validador es Python y funciona en Linux/Windows:

```bash
python3 ~/.local/share/shortcuts-playground/claude/skills/shortcuts-playground/scripts/validate_shortcut.py \
  shortcuts/magia-enviar-carta.xml
```

## Si no tienes Mac

No pasa nada: montar el atajo a mano en el iPhone son 30 segundos (una acción *Obtener contenido de
URL* con la URL completa). Está paso a paso en [../ATAJOS.md](../ATAJOS.md), sección 1.
