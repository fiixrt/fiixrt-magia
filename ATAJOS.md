# 🃏 Atajos de iOS → web de magia

Todo lo necesario para que cualquier atajo mande una carta a la web y esta cambie al instante.

Web en producción: **https://fiixrt-magia.vercel.app** · estado en el dashboard: `http://192.168.1.45:7778`

```
https://fiixrt-magia.vercel.app/api/set?c=CARTA&k=CLAVE
```

- `CARTA` → la carta en cualquiera de los formatos aceptados (abajo).
- `k` → la clave de `MAGIA_KEY`. Ahora mismo está activa, así que **sin ella el atajo recibe 401**.

---

## 1. Atajo mínimo "Enviar carta"

En **Atajos → +** (nuevo atajo):

1. Añade la acción **Obtener contenido de URL**.
2. **URL:** `https://fiixrt-magia.vercel.app/api/set?c=Q-2&k=CLAVE`
3. Pulsa el desplegable «Mostrar más»:
   - **Método:** `GET`
   - **Solicitar encabezados:** sin tocar nada
   - **Cuerpo de la solicitud:** ninguno
4. (Opcional) Añade **Mostrar notificación** con el contenido de la respuesta: si la carta llega bien verás
   `{"ok":true,"card":"Q-2","label":"Reina de Corazones", ...}`.
5. Renombra el atajo, por ejemplo **Magia · Reina de corazones**, y añádelo a la pantalla de inicio, al widget o a *Tocar atrás*.

> Con eso, al ejecutarlo la web que esté abierta en cualquier móvil cambia a esa carta en menos de 1 segundo.

---

## 2. Formatos aceptados para `c`

Todos estos envían **la misma** carta (Reina de Corazones):

| Envías | Interpretación |
| --- | --- |
| `c=Q-2` | protocolo oficial `Valor-Palo` |
| `c=12-2` | 12 = Reina |
| `c=Reina+de+Corazones` | texto natural |
| `c=Q♥` | símbolo del palo |
| `c=qh` | forma compacta |

Códigos del truco:

**VALORES** — As = `A` (también vale `1`), 2…10 su número, Jota = `J` (`11`), Reina = `Q` (`12`), Rey = `K` (`13`).

**PALOS** — Picas = `1`, Corazones = `2`, Diamantes = `3`, Tréboles = `4`.

Ejemplos: As de Picas → `A-1` · 10 de Corazones → `10-2` · Jota de Diamantes → `J-3` · Reina de Tréboles → `Q-4` · Rey de Picas → `K-1`.

**Vaciar la pantalla:** `?c=reset&k=CLAVE` (la web vuelve a «Esperando carta»).

---

## 3. En los demás atajos: de la transcripción a la URL

Este es el bloque que usarás dentro de tus otros atajos. Dos maneras:

### A) Con un modelo (acción «Preguntar a ChatGPT» / «Usar modelo»)

Pega este texto como instrucción y pásale el texto transcrito:

```
Lee el siguiente texto transcrito e identifica la carta de póker mencionada.

VALORES:
- As = 1
- 2 al 10 = su propio número
- Jota = J
- Reina = Q
- Rey = K

PALOS:
- Picas = 1
- Corazones = 2
- Diamantes = 3
- Tréboles = 4

FORMATO DE RESPUESTA:
Valor-Palo

Ejemplos:
- As de Picas → 1-1
- 10 de Corazones → 10-2
- Jota de Diamantes → J-3
- Reina de Tréboles → Q-4
- Rey de Picas → K-1
```

La respuesta (`Q-2`, `10-3`, `1-1`…) se guarda en la variable **Carta** y se usa así:

1. **Obtener contenido de URL**
   - URL: `https://fiixrt-magia.vercel.app/api/set?c=` + variable **Carta** + `&k=CLAVE`
   - Método: `GET`
2. Fin.

### B) Sin modelo, con lógica del atajo

1. **Recibir** texto como entrada (o **Obtener portapapeles**).
2. **Coincidencia de texto** → `(\d{1,2}|[AJQK])[- ]([1-4])` → *Grupo 1* y *Grupo 2*.
3. **Combinar texto**: `Grupo 1` + `-` + `Grupo 2`.
4. Lo mismo del punto A.

> Si el atajo ya te devuelve la carta escrita («As de Picas»), no hace falta traducirla: la web entiende también el texto natural, así que puedes mandar `?c=` + el texto tal cual.

---

## 4. Atajos de escenario que salen gratis

- **Doble toque atrás** → asignado al atajo: la carta se envía sin mirar la pantalla.
- **Etiqueta NFC** pegada en la mesa: al acercar el móvil se manda la carta.
- **Una carta por atajo**: 52 atajos con nombre de carta (se agrupan en una carpeta «Magia») y se eligen desde el buscador de Atajos o con el widget.
- **Carta aleatoria** para ensayar: acción *Elemento aleatorio de la lista* con las 52 cartas y luego el envío.

---

## 5. Comprobar que todo está vivo

Cualquier móvil puede consultar el estado sin abrir la web:

```
https://fiixrt-magia.vercel.app/api/now
```

Devuelve `{"ok":true,"card":{"code":"Q-2","label":"Reina de Corazones",...}}` o `card: null` si está vacía.

Desde el dashboard de atajos (`http://192.168.1.45:7778`) hay una tarjeta **Truco de Magia** con el botón **🃏 Ver carta actual**: muestra la carta viva, si el repo está subido a GitHub y si Vercel responde.
