/**
 * Top 100 pharmaceutical/biotech parent companies and their key subsidiaries
 * Used to expand a single search query into all relevant sponsor names on ClinicalTrials.gov.
 *
 * Format: parent company display name -> array of names to search (parent + subsidiaries + common alternates).
 * The parent name itself is always included as the first entry.
 */

export interface PharmaCompany {
  /** Canonical display name shown to the user */
  name: string;
  /** All sponsor names to search on ClinicalTrials.gov (includes parent + subsidiaries + alt spellings) */
  searchNames: string[];
  /** Headquarters country (for display) */
  country?: string;
}

export const PHARMA_COMPANIES: PharmaCompany[] = [
  // ===== TOP 25 GLOBAL PHARMA =====
  {
    name: "Pfizer",
    searchNames: ["Pfizer", "Wyeth", "Hospira", "Array BioPharma", "Medivation", "Anacor", "Trillium Therapeutics", "Arena Pharmaceuticals", "Biohaven Pharmaceutical", "Seagen"],
    country: "USA",
  },
  {
    name: "Roche",
    searchNames: ["Hoffmann-La Roche", "Roche", "Genentech", "Chugai Pharmaceutical", "Spark Therapeutics", "Foundation Medicine", "Flatiron Health"],
    country: "Switzerland",
  },
  {
    name: "Johnson & Johnson",
    searchNames: ["Johnson & Johnson", "Janssen", "Janssen Research & Development", "Janssen Pharmaceuticals", "Janssen-Cilag", "Janssen Biotech", "Actelion", "Momenta Pharmaceuticals", "Abiomed"],
    country: "USA",
  },
  {
    name: "Novartis",
    searchNames: ["Novartis", "Novartis Pharmaceuticals", "Sandoz", "AveXis", "Advanced Accelerator Applications", "The Medicines Company", "Cadent Therapeutics", "Gyroscope Therapeutics"],
    country: "Switzerland",
  },
  {
    name: "Merck & Co",
    searchNames: ["Merck Sharp & Dohme", "Merck Sharp & Dohme LLC", "Merck Sharp and Dohme", "MSD", "Schering-Plough", "Cubist Pharmaceuticals", "Idenix Pharmaceuticals", "Acceleron Pharma", "Prometheus Biosciences", "Imago BioSciences"],
    country: "USA",
  },
  {
    name: "AbbVie",
    searchNames: ["AbbVie", "Allergan", "Pharmacyclics", "Stemcentrx", "ImmunoGen", "Cerevel Therapeutics", "Landos Biopharma"],
    country: "USA",
  },
  {
    name: "Bristol-Myers Squibb",
    searchNames: ["Bristol-Myers Squibb", "Bristol Myers Squibb", "Celgene", "MyoKardia", "Turning Point Therapeutics", "Mirati Therapeutics", "RayzeBio"],
    country: "USA",
  },
  {
    name: "AstraZeneca",
    searchNames: ["AstraZeneca", "MedImmune", "Alexion Pharmaceuticals", "Alexion", "Caelum Biosciences", "TeneoTwo", "CinCor Pharma"],
    country: "UK",
  },
  {
    name: "Sanofi",
    searchNames: ["Sanofi", "Sanofi-Aventis", "Genzyme", "Bioverativ", "Ablynx", "Synthorx", "Principia Biopharma", "Translate Bio", "Kiadis Pharma", "Kymab", "Provention Bio"],
    country: "France",
  },
  {
    name: "GSK",
    searchNames: ["GlaxoSmithKline", "GSK", "ViiV Healthcare", "Tesaro", "Sierra Oncology", "Affinivax", "Bellus Health"],
    country: "UK",
  },
  {
    name: "Eli Lilly",
    searchNames: ["Eli Lilly and Company", "Eli Lilly", "Lilly", "Loxo Oncology", "Dermira", "Prevail Therapeutics", "Disarm Therapeutics", "Protomer Technologies", "POINT Biopharma", "DICE Therapeutics", "Versanis Bio", "Morphic Holding"],
    country: "USA",
  },
  {
    name: "Takeda",
    searchNames: ["Takeda", "Takeda Pharmaceuticals", "Takeda Pharmaceutical Company", "Shire", "Baxalta", "Ariad Pharmaceuticals", "Millennium Pharmaceuticals", "Nimbus Lakshmi"],
    country: "Japan",
  },
  {
    name: "Boehringer Ingelheim",
    searchNames: ["Boehringer Ingelheim", "Boehringer Ingelheim Pharmaceuticals"],
    country: "Germany",
  },
  {
    name: "Bayer",
    searchNames: ["Bayer", "Bayer HealthCare", "Bayer AG", "AskBio", "Asklepios BioPharmaceutical", "BlueRock Therapeutics", "Vividion Therapeutics"],
    country: "Germany",
  },
  {
    name: "Amgen",
    searchNames: ["Amgen", "Onyx Pharmaceuticals", "Five Prime Therapeutics", "Teneobio", "ChemoCentryx", "Horizon Therapeutics"],
    country: "USA",
  },
  {
    name: "Gilead Sciences",
    searchNames: ["Gilead Sciences", "Gilead", "Kite Pharma", "Kite", "Forty Seven", "Immunomedics", "MiroBio", "Tizona Therapeutics", "CymaBay Therapeutics"],
    country: "USA",
  },
  {
    name: "Novo Nordisk",
    searchNames: ["Novo Nordisk", "Novo Nordisk A/S", "Dicerna Pharmaceuticals", "Forma Therapeutics", "Inversago Pharma", "Embark Biotech", "Cardior Pharmaceuticals"],
    country: "Denmark",
  },
  {
    name: "Vertex Pharmaceuticals",
    searchNames: ["Vertex Pharmaceuticals", "Vertex", "Semma Therapeutics", "Exonics Therapeutics", "ViaCyte", "Alpine Immune Sciences"],
    country: "USA",
  },
  {
    name: "Biogen",
    searchNames: ["Biogen", "Biogen Idec", "Nightstar Therapeutics", "Reata Pharmaceuticals", "HI-Bio", "Human Immunology Biosciences"],
    country: "USA",
  },
  {
    name: "Regeneron",
    searchNames: ["Regeneron Pharmaceuticals", "Regeneron", "Decibel Therapeutics", "Checkmate Pharmaceuticals"],
    country: "USA",
  },
  {
    name: "Moderna",
    searchNames: ["Moderna", "ModernaTX", "Moderna Therapeutics", "OriCiro Genomics"],
    country: "USA",
  },
  {
    name: "BioNTech",
    searchNames: ["BioNTech", "BioNTech SE", "Kite Pharma EU", "InstaDeep"],
    country: "Germany",
  },
  {
    name: "CSL",
    searchNames: ["CSL Behring", "CSL", "CSL Limited", "Vifor Pharma", "Calimmune", "Seqirus"],
    country: "Australia",
  },
  {
    name: "Daiichi Sankyo",
    searchNames: ["Daiichi Sankyo", "Daiichi Sankyo Co., Ltd.", "Plexxikon"],
    country: "Japan",
  },
  {
    name: "Astellas Pharma",
    searchNames: ["Astellas Pharma", "Astellas", "Audentes Therapeutics", "Iveric Bio", "Xyphos Biosciences"],
    country: "Japan",
  },
  // ===== TOP 26-50 =====
  {
    name: "Otsuka Pharmaceutical",
    searchNames: ["Otsuka Pharmaceutical", "Otsuka", "Otsuka Pharmaceutical Co., Ltd.", "Visterra", "Mindset Pharma", "Taris Biomedical", "Proteus Digital Health"],
    country: "Japan",
  },
  {
    name: "Eisai",
    searchNames: ["Eisai", "Eisai Inc.", "Eisai Co., Ltd.", "MGI Pharma", "Morphotek"],
    country: "Japan",
  },
  {
    name: "Servier",
    searchNames: ["Servier", "Les Laboratoires Servier", "Agios Pharmaceuticals oncology"],
    country: "France",
  },
  {
    name: "Merck KGaA",
    searchNames: ["Merck KGaA", "EMD Serono", "Merck Serono", "Merck Healthcare KGaA", "Sigma-Aldrich"],
    country: "Germany",
  },
  {
    name: "Teva",
    searchNames: ["Teva", "Teva Pharmaceutical Industries", "Teva Pharmaceuticals", "Cephalon", "Auspex Pharmaceuticals"],
    country: "Israel",
  },
  {
    name: "Sun Pharmaceutical",
    searchNames: ["Sun Pharmaceutical", "Sun Pharmaceutical Industries", "Sun Pharma", "Ranbaxy Laboratories", "Taro Pharmaceuticals"],
    country: "India",
  },
  {
    name: "Bausch Health",
    searchNames: ["Bausch Health", "Bausch Health Companies", "Valeant Pharmaceuticals", "Bausch + Lomb", "Salix Pharmaceuticals"],
    country: "Canada",
  },
  {
    name: "Viatris",
    searchNames: ["Viatris", "Mylan", "Upjohn", "Mylan Pharmaceuticals"],
    country: "USA",
  },
  {
    name: "Organon",
    searchNames: ["Organon", "Organon & Co.", "Organon LLC"],
    country: "USA",
  },
  {
    name: "BeiGene",
    searchNames: ["BeiGene", "BeiGene, Ltd.", "BeOne Medicines"],
    country: "China",
  },
  {
    name: "Hengrui Medicine",
    searchNames: ["Jiangsu Hengrui Medicine", "Hengrui Medicine", "Jiangsu Hengrui Pharmaceuticals"],
    country: "China",
  },
  {
    name: "Innovent Biologics",
    searchNames: ["Innovent Biologics", "Innovent Biologics (Suzhou) Co., Ltd."],
    country: "China",
  },
  {
    name: "Jazz Pharmaceuticals",
    searchNames: ["Jazz Pharmaceuticals", "GW Pharmaceuticals", "Greenwich Biosciences"],
    country: "Ireland",
  },
  {
    name: "Incyte",
    searchNames: ["Incyte", "Incyte Corporation", "Escient Pharmaceuticals"],
    country: "USA",
  },
  {
    name: "Alnylam Pharmaceuticals",
    searchNames: ["Alnylam Pharmaceuticals", "Alnylam"],
    country: "USA",
  },
  {
    name: "BioMarin",
    searchNames: ["BioMarin Pharmaceutical", "BioMarin"],
    country: "USA",
  },
  {
    name: "Ipsen",
    searchNames: ["Ipsen", "Ipsen Bioscience", "Ipsen Pharma", "Clementia Pharmaceuticals", "Epizyme"],
    country: "France",
  },
  {
    name: "UCB",
    searchNames: ["UCB", "UCB S.A.", "UCB Pharma", "Ra Pharmaceuticals", "Engage Therapeutics", "Zogenix"],
    country: "Belgium",
  },
  {
    name: "Lundbeck",
    searchNames: ["H. Lundbeck", "Lundbeck", "Alder BioPharmaceuticals", "Abide Therapeutics"],
    country: "Denmark",
  },
  {
    name: "Mitsubishi Tanabe Pharma",
    searchNames: ["Mitsubishi Tanabe Pharma", "Mitsubishi Tanabe Pharma Corporation", "NeuroDerm"],
    country: "Japan",
  },
  {
    name: "Sumitomo Pharma",
    searchNames: ["Sumitomo Pharma", "Sumitomo Dainippon Pharma", "Sunovion Pharmaceuticals"],
    country: "Japan",
  },
  {
    name: "Kyowa Kirin",
    searchNames: ["Kyowa Kirin", "Kyowa Kirin Co., Ltd.", "Kyowa Hakko Kirin"],
    country: "Japan",
  },
  {
    name: "Chiesi Farmaceutici",
    searchNames: ["Chiesi Farmaceutici", "Chiesi", "Chiesi USA", "Atopix Therapeutics"],
    country: "Italy",
  },
  {
    name: "Recordati",
    searchNames: ["Recordati", "Recordati Rare Diseases", "Orphan Europe"],
    country: "Italy",
  },
  {
    name: "Grifols",
    searchNames: ["Grifols", "Grifols Therapeutics", "Talecris Biotherapeutics"],
    country: "Spain",
  },
  {
    name: "Almirall",
    searchNames: ["Almirall", "Almirall, S.A.", "Aqua Pharmaceuticals"],
    country: "Spain",
  },
  {
    name: "Lonza",
    searchNames: ["Lonza", "Lonza Group", "Capsugel"],
    country: "Switzerland",
  },
  // ===== TOP 51-100 =====
  {
    name: "Alkermes",
    searchNames: ["Alkermes", "Alkermes Inc.", "Alkermes plc"],
    country: "Ireland",
  },
  {
    name: "Argenx",
    searchNames: ["argenx", "Argenx SE", "Argenx BV"],
    country: "Netherlands",
  },
  {
    name: "Genmab",
    searchNames: ["Genmab", "Genmab A/S"],
    country: "Denmark",
  },
  {
    name: "Ionis Pharmaceuticals",
    searchNames: ["Ionis Pharmaceuticals", "Ionis", "Akcea Therapeutics"],
    country: "USA",
  },
  {
    name: "Exelixis",
    searchNames: ["Exelixis", "Exelixis Inc."],
    country: "USA",
  },
  {
    name: "Neurocrine Biosciences",
    searchNames: ["Neurocrine Biosciences", "Diurnal Group"],
    country: "USA",
  },
  {
    name: "United Therapeutics",
    searchNames: ["United Therapeutics", "United Therapeutics Corporation"],
    country: "USA",
  },
  {
    name: "Halozyme Therapeutics",
    searchNames: ["Halozyme Therapeutics", "Halozyme", "Antares Pharma"],
    country: "USA",
  },
  {
    name: "Sarepta Therapeutics",
    searchNames: ["Sarepta Therapeutics", "Sarepta", "Myonexus Therapeutics"],
    country: "USA",
  },
  {
    name: "Bluebird Bio",
    searchNames: ["bluebird bio", "Bluebird Bio"],
    country: "USA",
  },
  {
    name: "BeOne Medicines",
    searchNames: ["BeOne Medicines"],
    country: "Switzerland",
  },
  {
    name: "Krystal Biotech",
    searchNames: ["Krystal Biotech", "Krystal Biotech, Inc."],
    country: "USA",
  },
  {
    name: "Insmed",
    searchNames: ["Insmed", "Insmed Incorporated", "AlgaeneX", "Vertuis Bio"],
    country: "USA",
  },
  {
    name: "Ascendis Pharma",
    searchNames: ["Ascendis Pharma", "Ascendis Pharma A/S"],
    country: "Denmark",
  },
  {
    name: "Apellis Pharmaceuticals",
    searchNames: ["Apellis Pharmaceuticals", "Apellis"],
    country: "USA",
  },
  {
    name: "Neurogene",
    searchNames: ["Neurogene", "Neurogene Inc."],
    country: "USA",
  },
  {
    name: "Iovance Biotherapeutics",
    searchNames: ["Iovance Biotherapeutics", "Iovance"],
    country: "USA",
  },
  {
    name: "Karuna Therapeutics",
    searchNames: ["Karuna Therapeutics", "Karuna"],
    country: "USA",
  },
  {
    name: "Reata Pharmaceuticals",
    searchNames: ["Reata Pharmaceuticals", "Reata"],
    country: "USA",
  },
  {
    name: "Travere Therapeutics",
    searchNames: ["Travere Therapeutics", "Retrophin"],
    country: "USA",
  },
  {
    name: "Editas Medicine",
    searchNames: ["Editas Medicine", "Editas"],
    country: "USA",
  },
  {
    name: "CRISPR Therapeutics",
    searchNames: ["CRISPR Therapeutics", "CRISPR Therapeutics AG", "Casebia Therapeutics"],
    country: "Switzerland",
  },
  {
    name: "Intellia Therapeutics",
    searchNames: ["Intellia Therapeutics", "Intellia"],
    country: "USA",
  },
  {
    name: "Beam Therapeutics",
    searchNames: ["Beam Therapeutics", "Beam"],
    country: "USA",
  },
  {
    name: "Verve Therapeutics",
    searchNames: ["Verve Therapeutics", "Verve"],
    country: "USA",
  },
  {
    name: "Ultragenyx Pharmaceutical",
    searchNames: ["Ultragenyx Pharmaceutical", "Ultragenyx"],
    country: "USA",
  },
  {
    name: "Blueprint Medicines",
    searchNames: ["Blueprint Medicines", "Blueprint Medicines Corporation"],
    country: "USA",
  },
  {
    name: "Mirati Therapeutics",
    searchNames: ["Mirati Therapeutics", "Mirati"],
    country: "USA",
  },
  {
    name: "Arcus Biosciences",
    searchNames: ["Arcus Biosciences", "Arcus"],
    country: "USA",
  },
  {
    name: "Nuvation Bio",
    searchNames: ["Nuvation Bio", "Nuvation"],
    country: "USA",
  },
  {
    name: "Rigel Pharmaceuticals",
    searchNames: ["Rigel Pharmaceuticals", "Rigel"],
    country: "USA",
  },
  {
    name: "Agenus",
    searchNames: ["Agenus", "Agenus Inc."],
    country: "USA",
  },
  {
    name: "Replimune",
    searchNames: ["Replimune", "Replimune Group"],
    country: "USA",
  },
  {
    name: "Galapagos",
    searchNames: ["Galapagos NV", "Galapagos", "CellPoint", "AboundBio"],
    country: "Belgium",
  },
  {
    name: "Evotec",
    searchNames: ["Evotec", "Evotec SE", "Evotec AG"],
    country: "Germany",
  },
  {
    name: "Bavarian Nordic",
    searchNames: ["Bavarian Nordic", "Bavarian Nordic A/S"],
    country: "Denmark",
  },
  {
    name: "Coherus BioSciences",
    searchNames: ["Coherus BioSciences", "Coherus"],
    country: "USA",
  },
  {
    name: "Acadia Pharmaceuticals",
    searchNames: ["ACADIA Pharmaceuticals", "Acadia Pharmaceuticals", "Stoke Therapeutics"],
    country: "USA",
  },
  {
    name: "Supernus Pharmaceuticals",
    searchNames: ["Supernus Pharmaceuticals", "Supernus", "Adamas Pharmaceuticals"],
    country: "USA",
  },
  {
    name: "Pacira BioSciences",
    searchNames: ["Pacira BioSciences", "Pacira Pharmaceuticals"],
    country: "USA",
  },
  {
    name: "Harmony Biosciences",
    searchNames: ["Harmony Biosciences", "Harmony"],
    country: "USA",
  },
  {
    name: "Corcept Therapeutics",
    searchNames: ["Corcept Therapeutics", "Corcept"],
    country: "USA",
  },
  {
    name: "Madrigal Pharmaceuticals",
    searchNames: ["Madrigal Pharmaceuticals", "Madrigal"],
    country: "USA",
  },
  {
    name: "Vir Biotechnology",
    searchNames: ["Vir Biotechnology", "Vir"],
    country: "USA",
  },
  {
    name: "Cytokinetics",
    searchNames: ["Cytokinetics", "Cytokinetics, Incorporated"],
    country: "USA",
  },
  {
    name: "Ascletis Pharma",
    searchNames: ["Ascletis Pharma", "Ascletis"],
    country: "China",
  },
  {
    name: "Zai Lab",
    searchNames: ["Zai Lab", "Zai Lab Limited"],
    country: "China",
  },
  {
    name: "I-Mab Biopharma",
    searchNames: ["I-Mab Biopharma", "I-Mab"],
    country: "China",
  },
  {
    name: "Legend Biotech",
    searchNames: ["Legend Biotech", "Legend Biotech Corporation"],
    country: "USA",
  },
  {
    name: "Junshi Biosciences",
    searchNames: ["Junshi Biosciences", "Shanghai Junshi Biosciences"],
    country: "China",
  },
];

/**
 * Build a search index for fast lookup. Maps lowercased company name (and aliases) -> canonical company.
 */
const SEARCH_INDEX = new Map<string, PharmaCompany>();
for (const company of PHARMA_COMPANIES) {
  SEARCH_INDEX.set(company.name.toLowerCase(), company);
  for (const alias of company.searchNames) {
    if (!SEARCH_INDEX.has(alias.toLowerCase())) {
      SEARCH_INDEX.set(alias.toLowerCase(), company);
    }
  }
}

/**
 * Resolve a free-text company name to a canonical PharmaCompany entry.
 * If no match found in the curated list, returns a synthetic entry with the input name.
 */
export function resolveCompany(input: string): PharmaCompany {
  const cleaned = input.trim();
  if (!cleaned) {
    return { name: "", searchNames: [] };
  }
  const exact = SEARCH_INDEX.get(cleaned.toLowerCase());
  if (exact) return exact;

  // Fuzzy partial match: find a company where any searchName contains the input or vice versa
  const lower = cleaned.toLowerCase();
  for (const company of PHARMA_COMPANIES) {
    for (const name of company.searchNames) {
      const n = name.toLowerCase();
      if (n.includes(lower) || lower.includes(n)) {
        return company;
      }
    }
  }

  // Fallback: synthetic single-name company for free-text searches
  return { name: cleaned, searchNames: [cleaned] };
}

/**
 * Suggest companies matching a partial input (for autocomplete).
 */
export function suggestCompanies(input: string, limit = 8): PharmaCompany[] {
  const lower = input.trim().toLowerCase();
  if (!lower) return [];
  const matches: PharmaCompany[] = [];
  const seen = new Set<string>();
  for (const company of PHARMA_COMPANIES) {
    if (matches.length >= limit) break;
    const allNames = [company.name, ...company.searchNames].map((n) => n.toLowerCase());
    if (allNames.some((n) => n.includes(lower)) && !seen.has(company.name)) {
      matches.push(company);
      seen.add(company.name);
    }
  }
  return matches;
}
