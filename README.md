# 🛰️ Radar de Clientes

**Radar de Clientes** es una estación de trabajo telemétrica de prospección y auditoría comercial B2B para negocios locales en **LATAM, Estados Unidos y Europa**, construida con **Next.js 15, React 19, TypeScript, Tailwind CSS, Three.js e IndexedDB**.

Está diseñada específicamente para **Jose Rivas** (marca **Hik**), integrando tu historial auditable en blockchain ([Hik | ETHGas ⛽ en ZAPS](https://app.zaps.wtf/creator/Hik18977534) con **$3.8M USD de volumen generado**, **Clan Score 618** y **Top #6 global**) junto a tu oferta de soluciones digitales (Páginas Web, Agentes de IA por WhatsApp y Sistemas de Citas) y el **bono exclusivo para fundadores de planos arquitectónicos 3D y presupuesto de remodelación**.

---

## ⚡ Características Principales

1. **Búsqueda & Exploración Geográfica**:
   - Conexión con **Google Places API (New)** (`places:searchText`) con `FieldMask` optimizado (sin reseñas ni descripciones editoriales para reducir costes).
   - Filtro geográfico por regiones (**LATAM, EE.UU. y Europa**) con heurística para **destacar y ordenar primero a negocios de personas hispanohablantes** en EE.UU. y Europa.
   - Detección automática de **web propia vs. perfil social** (Facebook, Instagram, TikTok, Linktree, directorios) etiquetándolos como *«Solo Red Social»*.
   - Filtros rápidos: solo sin web, solo con teléfono, valoración $\ge 4.0★$, reseñas $\ge 15$, ocultar cerrados.
   - Paginación fluida con botón *«Cargar más»* y delay preventivo de 2 segundos.
   - Vista dual: **Tabla Densa Telemétrica** y **Tarjetas Visuales**.

2. **Laboratorio de Auditoría & Ficha Técnica**:
   - Integración con **PageSpeed Insights v5 (Mobile)**: 4 notas (Rendimiento, SEO, Accesibilidad, Buenas Prácticas) y extracción de la **captura de pantalla real** del sitio.
   - Si el negocio no tiene web, omite PageSpeed y clasifica de inmediato la oportunidad como *«Sin web propia»*.
   - Diagnóstico estructurado con **Gemini 2.0 Flash**:
     - Resumen del modelo de negocio en 2 frases.
     - Checklist técnico (WhatsApp, motor de reservas, formulario, HTTPS, adaptabilidad móvil, copyright desactualizado).
     - Correos y redes sociales extraídos del DOM.
     - 3 a 5 problemas críticos explicados en lenguaje de negocios.
     - Servicio digital recomendado con justificación comercial.
   - **Consola de Outreach**: 3 borradores personalizados (**WhatsApp**, **Guion de llamada de 30s** y **Correo en frío**) con copiado en 1 clic y selector de tono (*Directo, Consultivo, Disruptivo*).
   - Botón de **Exportar Ficha** en formato imprimible o PDF vectorizado.

3. **Radar de Nichos**:
   - Análisis comparativo de múltiples sectores en una misma ciudad.
   - Matriz con porcentaje sin web, valoración media y volumen promedio de reseñas.
   - Calculadora preventiva de llamadas a Places con confirmación previa.
   - Veredicto estratégico con **Gemini Flash** recomendando el Top 3 de nichos con mayor retorno.
   - Botón directo *«Ver negocios»* para saltar a la prospección activa de esa categoría.

4. **Pipeline CRM (Mis Leads)**:
   - Tablero Kanban por estados: `Nuevo`, `Analizado`, `Contactado`, `Respondió`, `Reunión`, `Cliente`, `Descartado`.
   - Cambio rápido de estados y notas de seguimiento.
   - Exportación completa a archivo **CSV estandarizado**.

5. **Persistencia & Caché Local**:
   - Arquitectura desacoplada basada en el patrón *Repository* sobre **IndexedDB** (`idb`), lista para migrar a Firebase o Supabase en el futuro.
   - **Caché de 7 días** para evitar repetir consultas idénticas a Google Places.
   - **Gestor de cola concurrente** (máximo 2 análisis paralelos con exponential backoff ante límites 429).
   - Control de cuota mensual con alerta visual preventiva al llegar a 800 de las 1.000 llamadas gratuitas.

6. **Módulo 3D Interactivo (Three.js)**:
   - Radar holográfico orbital en el dock flotante con esfera de latitud/longitud, barrido lumínico y nodos parpadeantes que representan prospectos en tiempo real.

---

## 🚀 Puesta en Marcha

### 1. Iniciar en Modo Desarrollo
```bash
npm run dev
```
Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

### 2. Configurar Claves de API
Puedes ingresar las credenciales de dos maneras:
- **Opción A (Recomendada)**: Copia `.env.example` a `.env.local` y coloca tus claves:
  ```env
  GOOGLE_CLOUD_API_KEY=tu_clave_de_google_cloud
  GEMINI_API_KEY=tu_clave_de_gemini
  ```
- **Opción B (Directa en Navegador)**: En la aplicación, ve a la pestaña **Ajustes** y escribe tu clave de Google Cloud; quedará almacenada de forma segura únicamente en tu navegador.
