import { PrismaClient, UnitOfMeasure } from "@prisma/client";

export async function seedProducts(prisma: PrismaClient) {
  const products = [
    {
      id: "prod-grn-energetico",
      name: "Gránulo Energético Núcleo Oscuro",
      description:
        "Alimento base de alta densidad calórica para actividad intensa en entornos hostiles.",
      ownerId: "own-void-nutrition",
      categoryId: "cat-nutricion-profunda",
      unitOfMeasure: UnitOfMeasure.GRAM,
      isActive: true,
    },
    {
      id: "prod-conc-proteico",
      name: "Concentrado Proteico Sintético",
      description:
        "Suplemento para recuperación muscular y desarrollo óptimo post-misión.",
      ownerId: "own-void-nutrition",
      categoryId: "cat-nutricion-profunda",
      unitOfMeasure: UnitOfMeasure.GRAM,
      isActive: true,
    },
    {
      id: "prod-barras-impulso",
      name: "Barras de Impulso Nutricional",
      description:
        "Raciones compactas de emergencia de rápida asimilación para despliegues prolongados.",
      ownerId: "own-void-nutrition",
      categoryId: "cat-nutricion-profunda",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-formula-crecimiento",
      name: "Fórmula de Crecimiento Abyss",
      description:
        "Nutriente especializado para fases de desarrollo crítico en unidades jóvenes.",
      ownerId: "own-void-nutrition",
      categoryId: "cat-nutricion-profunda",
      unitOfMeasure: UnitOfMeasure.GRAM,
      isActive: true,
    },
    {
      id: "prod-hidratacion-plasma",
      name: "Hidratación Plasma-Electrolítica",
      description:
        "Solución rehidratante avanzada para entornos de estrés térmico.",
      ownerId: "own-void-nutrition",
      categoryId: "cat-salud-biometrica",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-alimento-medicado",
      name: "Alimento Terapéutico Neuro-Regenerativo",
      description:
        "Dieta especializada para recuperación de funciones neuronales y cognitivas.",
      ownerId: "own-void-nutrition",
      categoryId: "cat-salud-biometrica",
      unitOfMeasure: UnitOfMeasure.GRAM,
      isActive: true,
    },
    {
      id: "prod-shampoo-bioregen",
      name: "Shampoo Bio-Regenerativo Aura",
      description:
        "Limpieza profunda y restauración del manto protector biotecnológico.",
      ownerId: "own-nebula-care",
      categoryId: "cat-higiene-plasma",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-acond-ultrabrillo",
      name: "Acondicionador Ultra-Brillo Estelar",
      description:
        "Suaviza, desenreda y potencia el brillo natural del pelaje sintético o biológico.",
      ownerId: "own-nebula-care",
      categoryId: "cat-higiene-plasma",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-spray-desinfec",
      name: "Spray Desinfectante Superficie Zero",
      description:
        "Elimina agentes patógenos y neutraliza olores de origen desconocido.",
      ownerId: "own-nebula-care",
      categoryId: "cat-higiene-plasma",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-toallas-hipoaler",
      name: "Toallas Hipoalergénicas Secuencia N",
      description:
        "Para limpieza rápida y sensible en áreas de interfaz neural, sin irritaciones.",
      ownerId: "own-nebula-care",
      categoryId: "cat-higiene-plasma",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-perfume-quantum",
      name: "Perfume Ambiental Quantum",
      description:
        "Fragancia de larga duración, elimina olores persistentes de zonas confinadas.",
      ownerId: "own-nebula-care",
      categoryId: "cat-higiene-plasma",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-suplemento-macro",
      name: "Suplemento Macro-Mineral Omega",
      description:
        "Complejo esencial para el soporte óseo y vital en organismos avanzados.",
      ownerId: "own-singularity-labs",
      categoryId: "cat-salud-biometrica",
      unitOfMeasure: UnitOfMeasure.GRAM,
      isActive: true,
    },
    {
      id: "prod-analizador-bio",
      name: "Analizador Biométrico de Campo",
      description:
        "Dispositivo portátil para monitoreo en tiempo real de signos vitales operativos.",
      ownerId: "own-singularity-labs",
      categoryId: "cat-salud-biometrica",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-bandas-recuperacion",
      name: "Bandas de Recuperación Muscular (Set)",
      description:
        "Optimiza la rehabilitación post-combate y previene lesiones por sobreesfuerzo.",
      ownerId: "own-singularity-labs",
      categoryId: "cat-salud-biometrica",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-gel-cicatrizante",
      name: "Gel Cicatrizante Hiperbárico",
      description:
        "Acelera la curación de heridas y quemaduras menores en tejidos complejos.",
      ownerId: "own-singularity-labs",
      categoryId: "cat-salud-biometrica",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-arnes-tactico",
      name: "Arnés Táctico Reforzado Sombra",
      description:
        "Máxima resistencia y confort para unidades K9 en misiones de infiltración.",
      ownerId: "own-dark-horizon",
      categoryId: "cat-equipo-tactico",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-correa-fibra",
      name: "Correa de Fibra Óptica Retráctil",
      description:
        "Visibilidad nocturna y control adaptable en condiciones de baja luz.",
      ownerId: "own-dark-horizon",
      categoryId: "cat-equipo-tactico",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-collar-luminico",
      name: "Collar Lumínico de Seguridad (Recargable)",
      description:
        "Iluminación 360° para identificación en entornos operativos nocturnos.",
      ownerId: "own-dark-horizon",
      categoryId: "cat-accesorios-zenit",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-placas-identidad",
      name: "Placas de Identidad Gravadas",
      description: "Identificación segura y codificada con diseño minimalista.",
      ownerId: "own-dark-horizon",
      categoryId: "cat-accesorios-zenit",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-comedero-inteligente",
      name: "Comedero Inteligente Autodispensador",
      description:
        "Programación de raciones y horarios, control remoto para unidades remotas.",
      ownerId: "own-dark-horizon",
      categoryId: "cat-accesorios-zenit",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-manta-termica",
      name: "Manta Térmica de Exploración",
      description:
        "Regula la temperatura corporal en ambientes extremos, compacta y ligera.",
      ownerId: "own-dark-horizon",
      categoryId: "cat-accesorios-zenit",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-simulador-vortex",
      name: "Simulador de Entorno Vortex",
      description:
        "Herramienta avanzada para entrenamiento adaptativo y desensibilización a distorsiones.",
      ownerId: "own-alpha-core",
      categoryId: "cat-entrenamiento-vortex",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-dispensador-refuerzo",
      name: "Dispensador Automático de Refuerzo Alpha",
      description:
        "Estimula el aprendizaje positivo con recompensas temporizadas para protocolos de conducta.",
      ownerId: "own-alpha-core",
      categoryId: "cat-entrenamiento-vortex",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-guia-cognitiva",
      name: "Guía de Entrenamiento Cognitivo",
      description:
        "Acceso a protocolos de mejora de habilidades mentales y resolución de problemas complejos.",
      ownerId: "own-alpha-core",
      categoryId: "cat-entrenamiento-vortex",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
    {
      id: "prod-pista-agilidad",
      name: "Pista de Agilidad Modular",
      description:
        "Circuito configurable para optimizar la destreza física y la respuesta rápida en campo.",
      ownerId: "own-alpha-core",
      categoryId: "cat-entrenamiento-vortex",
      unitOfMeasure: UnitOfMeasure.UNIT,
      isActive: true,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        description: p.description,
        ownerId: p.ownerId,
        categoryId: p.categoryId,
        unitOfMeasure: p.unitOfMeasure,
        isActive: p.isActive,
      },
      create: p,
    });
  }

  console.log(`${products.length} productos agregados`);
}
