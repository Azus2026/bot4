export interface NicheItem {
  id: string;
  name: string;
  icon?: string;
  recommendedService: 'WEB_DEVELOPMENT' | 'WHATSAPP_AGENT' | 'BOOKING_SYSTEM' | 'REFORMA_3D' | 'SUMAC_PMS';
  ticketLevel: 'ALTO' | 'MEDIO' | 'VOLUMEN';
  description: string;
}

export interface NicheCategoryGroup {
  id: string;
  name: string;
  icon: string;
  niches: NicheItem[];
}

export interface NichePresetPack {
  id: string;
  title: string;
  badge: string;
  description: string;
  categories: string[];
}

export const NICHE_CATALOG: NicheCategoryGroup[] = [
  {
    id: "hospedaje-peru",
    name: "Hospedaje & Turismo Perú (Sistema Sumac)",
    icon: "🏨",
    niches: [
      { id: "hoteles", name: "hotel", recommendedService: "SUMAC_PMS", ticketLevel: "ALTO", description: "Hoteles independientes: gestión de habitaciones, reservas y caja con Sumac." },
      { id: "hostales", name: "hostal", recommendedService: "SUMAC_PMS", ticketLevel: "ALTO", description: "Hostales familiares que aún usan cuaderno o Excel." },
      { id: "hospedajes", name: "hospedaje", recommendedService: "SUMAC_PMS", ticketLevel: "MEDIO", description: "Hospedajes y casas de huéspedes en ciudades intermedias." },
      { id: "lodges", name: "lodge", recommendedService: "SUMAC_PMS", ticketLevel: "ALTO", description: "Lodges y alojamientos turísticos (Cusco, Valle Sagrado, selva)." },
      { id: "tour-operadores", name: "agencia de turismo", recommendedService: "SUMAC_PMS", ticketLevel: "MEDIO", description: "Tour operadores: cupos, pasajeros y pagos (adaptación de Sumac)." },
    ],
  },
  {
    id: "reformas-hogar",
    name: "Hogar, Reformas & Construcción (Alto Ticket / Bono 3D)",
    icon: "🔨",
    niches: [
      {
        id: "reformas-interiores",
        name: "reformas e interiores",
        recommendedService: "REFORMA_3D",
        ticketLevel: "ALTO",
        description: "El nicho perfecto para tu bono exclusivo de planos 3D y presupuesto de interiores.",
      },
      {
        id: "diseno-interiores",
        name: "diseño de interiores",
        recommendedService: "REFORMA_3D",
        ticketLevel: "ALTO",
        description: "Estudios de arquitectura y decoración receptivos a modelado 3D y web estética.",
      },
      {
        id: "climatizacion-aire",
        name: "instalación de aire acondicionado",
        recommendedService: "WHATSAPP_AGENT",
        ticketLevel: "MEDIO",
        description: "Alto volumen de consultas estacionales para capturar con agente de WhatsApp.",
      },
      {
        id: "paneles-solares",
        name: "paneles solares e instaladores",
        recommendedService: "WEB_DEVELOPMENT",
        ticketLevel: "ALTO",
        description: "Sector en pleno auge con alto presupuesto publicitario y necesidad de landing page veloz.",
      },
      {
        id: "electricistas",
        name: "electricistas y mantenimiento",
        recommendedService: "WHATSAPP_AGENT",
        ticketLevel: "MEDIO",
        description: "Urgencias 24/7 donde un bot de WhatsApp cierra el servicio de inmediato.",
      },
      {
        id: "fontaneros",
        name: "fontaneros y plomeros",
        recommendedService: "WHATSAPP_AGENT",
        ticketLevel: "MEDIO",
        description: "Frecuentemente sin sitio web propio, dependen 100% de llamadas urgentes.",
      },
      {
        id: "carpinterias",
        name: "carpinterías y muebles a medida",
        recommendedService: "REFORMA_3D",
        ticketLevel: "ALTO",
        description: "Gran valor añadido con diseño previo en 3D y portafolio web de trabajos.",
      },
      {
        id: "pintores",
        name: "pintores profesionales",
        recommendedService: "WEB_DEVELOPMENT",
        ticketLevel: "MEDIO",
        description: "Generalmente solo tienen página de Facebook; fácil de cerrar con web rápida.",
      },
    ],
  },
  {
    id: "salud-medico",
    name: "Salud, Clínicas & Bienestar",
    icon: "🏥",
    niches: [
      {
        id: "clinicas-dentales",
        name: "clínicas dentales",
        recommendedService: "BOOKING_SYSTEM",
        ticketLevel: "ALTO",
        description: "Gran necesidad de sistema automatizado de citas y recordatorios por WhatsApp.",
      },
      {
        id: "fisioterapeutas",
        name: "fisioterapeutas y osteopatía",
        recommendedService: "BOOKING_SYSTEM",
        ticketLevel: "MEDIO",
        description: "Agenda saturada donde el autoagendamiento online ahorra horas de recepción.",
      },
      {
        id: "psicologos",
        name: "psicólogos y terapeutas",
        recommendedService: "BOOKING_SYSTEM",
        ticketLevel: "MEDIO",
        description: "Consultas privadas con alta disposición a pagar por discreción y agenda web.",
      },
      {
        id: "quiropracticos",
        name: "quiroprácticos",
        recommendedService: "WHATSAPP_AGENT",
        ticketLevel: "ALTO",
        description: "Pacientes con dolor que buscan atención rápida y respuestas inmediatas.",
      },
      {
        id: "podologos",
        name: "clínicas podológicas",
        recommendedService: "BOOKING_SYSTEM",
        ticketLevel: "MEDIO",
        description: "Clientela recurrente con margen para citas automatizadas.",
      },
      {
        id: "opticas",
        name: "ópticas y optometristas",
        recommendedService: "WEB_DEVELOPMENT",
        ticketLevel: "MEDIO",
        description: "Catálogo de marcas y agenda para exámenes visuales.",
      },
      {
        id: "nutricionistas",
        name: "nutricionistas y dietistas",
        recommendedService: "WHATSAPP_AGENT",
        ticketLevel: "MEDIO",
        description: "Seguimiento constante de pacientes por WhatsApp ideal para IA.",
      },
    ],
  },
  {
    id: "belleza-estetica",
    name: "Belleza, Estética & Cuidado Personal",
    icon: "✂️",
    niches: [
      {
        id: "centros-estetica",
        name: "centros de estética y spa",
        recommendedService: "WHATSAPP_AGENT",
        ticketLevel: "ALTO",
        description: "Consultas constantes sobre tratamientos, precios y reservas que saturan el teléfono.",
      },
      {
        id: "peluquerias",
        name: "peluquerías y salones de belleza",
        recommendedService: "BOOKING_SYSTEM",
        ticketLevel: "VOLUMEN",
        description: "Flujo constante de reservas semanales que necesitan agendamiento 24/7.",
      },
      {
        id: "barberias",
        name: "barberías y barber shops",
        recommendedService: "BOOKING_SYSTEM",
        ticketLevel: "VOLUMEN",
        description: "Público joven acostumbrado a reservar por link en Instagram o WhatsApp.",
      },
      {
        id: "depilacion-laser",
        name: "clínicas de depilación láser",
        recommendedService: "WHATSAPP_AGENT",
        ticketLevel: "ALTO",
        description: "Tratamientos de alto ticket con dudas previas y paquetes de sesiones.",
      },
      {
        id: "salones-unas",
        name: "salones de uñas y manicura",
        recommendedService: "BOOKING_SYSTEM",
        ticketLevel: "VOLUMEN",
        description: "Citas recurrentes cada 15 a 21 días que se benefician de recordatorios automáticos.",
      },
      {
        id: "estudios-tatuajes",
        name: "estudios de tatuajes y piercing",
        recommendedService: "WEB_DEVELOPMENT",
        ticketLevel: "MEDIO",
        description: "Necesidad de portafolio web visual para no depender únicamente de Instagram.",
      },
    ],
  },
  {
    id: "automotriz",
    name: "Automotriz & Talleres",
    icon: "🚗",
    niches: [
      {
        id: "talleres-mecanicos",
        name: "talleres mecánicos",
        recommendedService: "WHATSAPP_AGENT",
        ticketLevel: "MEDIO",
        description: "Preguntas frecuentes sobre presupuestos y estado de reparación del coche.",
      },
      {
        id: "detailing-autos",
        name: "detailing y estética vehicular",
        recommendedService: "WEB_DEVELOPMENT",
        ticketLevel: "ALTO",
        description: "Servicio premium donde una web moderna genera alta percepción de valor.",
      },
      {
        id: "chapa-pintura",
        name: "talleres de chapa y pintura",
        recommendedService: "WHATSAPP_AGENT",
        ticketLevel: "ALTO",
        description: "Recepción de fotos por WhatsApp para presupuestos rápidos con IA.",
      },
      {
        id: "talleres-motos",
        name: "talleres de motos y repuestos",
        recommendedService: "WEB_DEVELOPMENT",
        ticketLevel: "MEDIO",
        description: "Comunidad apasionada que busca talleres de confianza con presencia web sólida.",
      },
      {
        id: "concesionarios-ocasion",
        name: "concesionarios de autos usados",
        recommendedService: "WEB_DEVELOPMENT",
        ticketLevel: "ALTO",
        description: "Catálogo de vehículos actualizado y captura de leads de compraventa.",
      },
    ],
  },
  {
    id: "servicios-b2b",
    name: "Servicios Profesionales, Legales & B2B",
    icon: "⚖️",
    niches: [
      {
        id: "inmobiliarias",
        name: "inmobiliarias y bienes raíces",
        recommendedService: "WHATSAPP_AGENT",
        ticketLevel: "ALTO",
        description: "Filtrado automático de prospectos compradores y agendamiento de visitas a propiedades.",
      },
      {
        id: "abogados",
        name: "despachos de abogados",
        recommendedService: "WEB_DEVELOPMENT",
        ticketLevel: "ALTO",
        description: "Requieren máxima autoridad, confianza y formulario seguro de consulta inicial.",
      },
      {
        id: "gestorias",
        name: "gestorías y asesorías fiscales",
        recommendedService: "WHATSAPP_AGENT",
        ticketLevel: "ALTO",
        description: "Clientes autónomos y empresas con dudas constantes de trámites e impuestos.",
      },
      {
        id: "agencias-seguros",
        name: "corredurías y agentes de seguros",
        recommendedService: "WHATSAPP_AGENT",
        ticketLevel: "MEDIO",
        description: "Cotizaciones automatizadas por WhatsApp para seguros de auto, salud y hogar.",
      },
      {
        id: "notarias",
        name: "notarías y servicios notariales",
        recommendedService: "BOOKING_SYSTEM",
        ticketLevel: "MEDIO",
        description: "Organización de citas para firmas y revisión previa de documentación.",
      },
    ],
  },
  {
    id: "fitness-deportes",
    name: "Fitness, Deportes & Ocio",
    icon: "🏋️‍♂️",
    niches: [
      {
        id: "gimnasios",
        name: "gimnasios y centros fitness",
        recommendedService: "WEB_DEVELOPMENT",
        ticketLevel: "VOLUMEN",
        description: "Captación de nuevos socios con pase de prueba gratuito y tarifas claras en web.",
      },
      {
        id: "crossfit-boxes",
        name: "boxes de crossfit",
        recommendedService: "BOOKING_SYSTEM",
        ticketLevel: "MEDIO",
        description: "Reservas de clases por cupos limitados y bienvenida automática a nuevos atletas.",
      },
      {
        id: "yoga-pilates",
        name: "estudios de yoga y pilates",
        recommendedService: "BOOKING_SYSTEM",
        ticketLevel: "MEDIO",
        description: "Clases grupales que requieren calendario interactivo y pagos de suscripción.",
      },
      {
        id: "padel-canchas",
        name: "clubes de pádel y canchas de fútbol",
        recommendedService: "BOOKING_SYSTEM",
        ticketLevel: "VOLUMEN",
        description: "Alquiler de pistas por franjas horarias; el sistema de reservas es vital.",
      },
      {
        id: "artes-marciales",
        name: "academias de artes marciales",
        recommendedService: "WHATSAPP_AGENT",
        ticketLevel: "MEDIO",
        description: "Atención a padres sobre horarios infantiles y clases de prueba.",
      },
    ],
  },
  {
    id: "veterinarias-mascotas",
    name: "Veterinarias & Cuidado de Mascotas",
    icon: "🐾",
    niches: [
      {
        id: "veterinarios",
        name: "clínicas veterinarias",
        recommendedService: "WHATSAPP_AGENT",
        ticketLevel: "MEDIO",
        description: "Urgencias y recordatorios periódicos de vacunación y desparasitación.",
      },
      {
        id: "peluquerias-caninas",
        name: "peluquerías caninas y grooming",
        recommendedService: "BOOKING_SYSTEM",
        ticketLevel: "VOLUMEN",
        description: "Citas escalonadas por turnos para evitar aglomeración de mascotas.",
      },
      {
        id: "adiestramiento-canino",
        name: "adiestradores caninos",
        recommendedService: "WEB_DEVELOPMENT",
        ticketLevel: "ALTO",
        description: "Cursos y programas de modificación de conducta con alta tasa de cierre web.",
      },
    ],
  },
  {
    id: "educacion-formacion",
    name: "Educación & Formación",
    icon: "🎓",
    niches: [
      {
        id: "autoescuelas",
        name: "autoescuelas",
        recommendedService: "WHATSAPP_AGENT",
        ticketLevel: "ALTO",
        description: "Dudas de precios de matrícula, prácticas y agendamiento de clases de manejo.",
      },
      {
        id: "academias-idiomas",
        name: "academias de idiomas",
        recommendedService: "BOOKING_SYSTEM",
        ticketLevel: "MEDIO",
        description: "Exámenes de nivelación y reservas de clases de prueba gratuitas.",
      },
      {
        id: "escuelas-musica",
        name: "escuelas y academias de música",
        recommendedService: "BOOKING_SYSTEM",
        ticketLevel: "MEDIO",
        description: "Horarios individuales por instrumento con gestión de profesores.",
      },
    ],
  },
];

export const PRESET_PACKS: NichePresetPack[] = [
  {
    id: "pack-alto-ticket-3d",
    title: "Pack «Alto Ticket & Bono 3D»",
    badge: "Bono Remodelación",
    description: "Sectores de alto presupuesto y sedes físicas ideales para regalar planos 3D y presupuesto de interiores.",
    categories: [
      "reformas e interiores",
      "diseño de interiores",
      "inmobiliarias",
      "clínicas dentales",
      "centros de estética",
      "detailing de autos",
      "carpinterías",
    ],
  },
  {
    id: "pack-whatsapp-ia",
    title: "Pack «Agentes WhatsApp IA»",
    badge: "Respuestas 24/7",
    description: "Negocios con avalancha de consultas repetitivas sobre precios, citas y ubicación.",
    categories: [
      "clínicas dentales",
      "peluquerías",
      "talleres mecánicos",
      "centros de estética",
      "veterinarios",
      "inmobiliarias",
      "autoescuelas",
      "instalación de aire acondicionado",
    ],
  },
  {
    id: "pack-citas-online",
    title: "Pack «Sistemas de Citas & Reservas»",
    badge: "Autoagendamiento",
    description: "Sectores donde automatizar la agenda ahorra 15 a 20 horas de recepción al mes.",
    categories: [
      "fisioterapeutas",
      "barberías",
      "clínicas dentales",
      "psicólogos",
      "salones de uñas",
      "peluquerías caninas",
      "estudios de yoga y pilates",
    ],
  },
  {
    id: "pack-sin-web-rapida",
    title: "Pack «Oportunidad Web (Sin Web Propia)»",
    badge: "Mayor Probabilidad Cierre",
    description: "Sectores que tradicionalmente dependen de redes sociales o no tienen web propia.",
    categories: [
      "talleres mecánicos",
      "fontaneros y plomeros",
      "electricistas",
      "gimnasios",
      "pintores profesionales",
      "peluquerías",
      "reformas e interiores",
    ],
  },
  {
    id: "pack-salud-wellness",
    title: "Pack «Salud & Bienestar Completo»",
    badge: "Servicios Médicos",
    description: "Ecosistema médico local de alta reputación y capacidad de inversión comprobada.",
    categories: [
      "clínicas dentales",
      "fisioterapeutas",
      "podólogos",
      "psicólogos",
      "quiroprácticos",
      "ópticas",
      "nutricionistas",
    ],
  },
];

// Lista plana de todos los nombres para sugerencias de autocompletado
export const ALL_NICHE_NAMES: string[] = Array.from(
  new Set(NICHE_CATALOG.flatMap((group) => group.niches.map((n) => n.name)))
);
