# Generador de propuestas (rama `generador-propuestas`)

## Qué se añadió
- **Nueva pestaña «Propuestas»** (`components/proposals/ProposalsView.tsx`):
  - Selector de ciudad, calculado a partir de los leads guardados.
  - **Foto del mercado** de la ciudad: cantidad de negocios y hospedajes, rating medio, reseñas medias, % sin web y % con teléfono. Se calcula solo con datos de Google Places que ya tienes guardados, sin scraping.
  - **Top 5/10/12/15** prospectos por ciudad con el score hotelero; al pasar el mouse por el score ves de dónde salen los puntos.
  - Botones para generar la propuesta, abrir la ficha y marcar **No contactar**, con motivo y una lista donde puedes quitar la marca.
  - Vista previa de la propuesta, descarga en **PDF** y **DOCX**, y **borrador de WhatsApp** editable.
  - El botón «Copiar texto» solo se activa cuando la propuesta está aprobada. **No hay ningún envío automático.**
  - **Revisión humana obligatoria:** 3 casillas que marcas tú (datos verificados, tono revisado, contacto 1 a 1 permitido) antes de «Aprobar». Si editas el texto, la aprobación se anula.
  - Precios y marca configurables, guardados en IndexedDB (ajustes): implementación S/ 800–1.500 y planes de S/ 89, 169 y 299.
- **API `POST /api/proposal`** (`app/api/proposal/route.ts`): junta el lead, la auditoría web y la foto de la ciudad, y Gemini redacta la propuesta en español de Perú. Si no hay clave, o si Gemini falla, usa la **plantilla determinista**. Rechaza los leads marcados como No contactar (409). El modelo se elige con `GEMINI_MODEL` (por defecto `gemini-3.8-flash`).
- **Lógica** (`lib/proposal/`):
  - `hotel.ts`: detecta hospedajes, extrae la ciudad, calcula el score hotelero (0–100) y arma el Top-N (máximo 15).
  - `snapshot.ts`: foto del mercado y lista de ciudades.
  - `template.ts`: precios por defecto, plantilla, borrador de WhatsApp (siempre con la frase de baja) y validación de la respuesta de la IA.
  - `export.ts`: PDF (pdf-lib) y DOCX (docx) con cabecera de marca.
  - `brand.ts`: marca por defecto, **Dyad Finance**.
  - `workflow.ts`: reglas del Kanban.
- **Kanban:** nueva columna **«Propuesta lista»** (`PROPUESTA_LISTA`). No se puede pasar a Contactado o una etapa posterior sin aprobación, y un lead marcado como No contactar no avanza (`app/page.tsx`).
- **Nichos:** nuevo grupo «Hospedaje & Turismo Perú (Sistema Sumac)» y servicio `SUMAC_PMS`.
- **Tipos** (`types/lead.ts`): `doNotContact`, `proposal`, `CitySnapshot`, `ProposalData`, `ProposalPricing`, `proposalPricing` y `proposalBrand`. No hizo falta migrar IndexedDB, porque los campos nuevos van dentro del lead y de los ajustes.
- **Marca:** `public/brand/logo.jpg` es tu logo recortado; quité la estrella de marca de agua de la esquina inferior derecha. Los colores son azul marino #0E1424, azul #2F80FF, violeta #7B5CFF y plata #C9CED6, y se cambian en «Precios y marca».
- **Tests:** `tests/proposal.test.ts` (Vitest, 10 tests) y el script `scripts/sample-proposal.ts` para generar el PDF de ejemplo.

## Cómo usar
```bash
npm ci
npm test          # 10 tests
npm run typecheck
npm run build && npm start   # o npm run dev
npx tsx scripts/sample-proposal.ts ejemplo.pdf   # PDF/DOCX de ejemplo con datos ficticios
```
Flujo: Buscar → guardar leads → pestaña **Propuestas** → elegir ciudad → Generar → revisar, editar y aprobar → descargar el PDF y copiar el texto → enviarlo **tú mismo, 1 a 1** → mover el lead a Contactado.

## Notas
- Sin clave de Gemini todo funciona igual con la plantilla.
- `npm run lint` no está configurado en el repo (no hay configuración de ESLint, así que `next lint` pide crearla). La revisión de tipos y el build pasan.
- La extracción de ciudad usa la penúltima parte de la dirección de Google. Si una dirección rara sale mal, la ciudad aparecerá con otro nombre en el selector.
- Respeta la Ley 29733: usa solo datos empresariales públicos, la lista de No contactar y nada de envíos masivos.
