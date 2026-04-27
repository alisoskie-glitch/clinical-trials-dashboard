/**
 * Therapeutic specialty taxonomy and condition-mapping logic.
 * Each trial is assigned to ONE primary specialty for grouping in the dashboard.
 */

export type Specialty =
  | "Oncology"
  | "Hematology"
  | "Cardiology"
  | "Neurology"
  | "Psychiatry"
  | "Immunology & Rheumatology"
  | "Dermatology"
  | "Infectious Disease"
  | "Endocrinology & Metabolism"
  | "Gastroenterology"
  | "Pulmonology"
  | "Nephrology"
  | "Ophthalmology"
  | "Women's Health"
  | "Rare Disease"
  | "Other";

export const SPECIALTIES: Specialty[] = [
  "Oncology",
  "Hematology",
  "Cardiology",
  "Neurology",
  "Psychiatry",
  "Immunology & Rheumatology",
  "Dermatology",
  "Infectious Disease",
  "Endocrinology & Metabolism",
  "Gastroenterology",
  "Pulmonology",
  "Nephrology",
  "Ophthalmology",
  "Women's Health",
  "Rare Disease",
  "Other",
];

/** Display color (Tailwind class) for each specialty — used in charts and badges */
export const SPECIALTY_COLORS: Record<Specialty, string> = {
  "Oncology": "hsl(320 57% 40%)",
  "Hematology": "hsl(0 65% 45%)",
  "Cardiology": "hsl(355 70% 50%)",
  "Neurology": "hsl(265 50% 50%)",
  "Psychiatry": "hsl(285 45% 55%)",
  "Immunology & Rheumatology": "hsl(30 70% 45%)",
  "Dermatology": "hsl(15 65% 50%)",
  "Infectious Disease": "hsl(150 50% 40%)",
  "Endocrinology & Metabolism": "hsl(45 75% 45%)",
  "Gastroenterology": "hsl(85 45% 40%)",
  "Pulmonology": "hsl(195 60% 45%)",
  "Nephrology": "hsl(220 55% 50%)",
  "Ophthalmology": "hsl(180 50% 40%)",
  "Women's Health": "hsl(335 55% 55%)",
  "Rare Disease": "hsl(245 45% 55%)",
  "Other": "hsl(220 5% 50%)",
};

/**
 * Mapping from MeSH browse branch abbreviations to specialty
 * Source: https://meshb.nlm.nih.gov/treeView (BC = Diseases tree)
 */
const MESH_BRANCH_MAP: Record<string, Specialty> = {
  "BC04": "Oncology", // Neoplasms
  "BC15": "Hematology", // Hemic and Lymphatic Diseases (default before override)
  "BC14": "Cardiology", // Cardiovascular Diseases
  "BC10": "Neurology", // Nervous System Diseases
  "F03": "Psychiatry", // Mental Disorders
  "BC20": "Immunology & Rheumatology", // Immune System Diseases
  "BC17": "Dermatology", // Skin and Connective Tissue Diseases
  "BC01": "Infectious Disease", // Infections
  "BC19": "Endocrinology & Metabolism", // Endocrine System Diseases
  "BC18": "Endocrinology & Metabolism", // Nutritional and Metabolic Diseases
  "BC06": "Gastroenterology", // Digestive System Diseases
  "BC08": "Pulmonology", // Respiratory Tract Diseases
  "BC12": "Nephrology", // Urogenital Diseases (split below)
  "BC11": "Ophthalmology", // Eye Diseases
  "BC13": "Women's Health", // Female Urogenital Diseases
};

/**
 * Keyword-based fallback when MeSH branches are missing or ambiguous.
 * Order matters — earlier rules win. Each rule has higher specificity.
 */
const KEYWORD_RULES: Array<{ specialty: Specialty; patterns: RegExp[] }> = [
  // Oncology — broadest cancer keywords first
  {
    specialty: "Oncology",
    patterns: [
      /\b(cancer|carcinoma|sarcoma|lymphoma|leukemia|melanoma|tumor|tumour|neoplasm|malignan|metasta|glioma|glioblastoma|myeloma|oncolog)/i,
    ],
  },
  // Hematology (non-cancer blood disorders)
  {
    specialty: "Hematology",
    patterns: [
      /\b(hemophilia|sickle cell|thalassem|anemia|thrombocytop|coagulopat|von willebrand|aplastic|myelodysplastic|polycythem|hemoglobin)/i,
    ],
  },
  // Rare disease (catch before more specific specialties for orphan indications)
  {
    specialty: "Rare Disease",
    patterns: [
      /\b(huntington|gaucher|fabry|pompe|niemann.pick|batten disease|duchenne|spinal muscular atrophy|cystic fibrosis|amyotrophic lateral sclerosis|als)\b/i,
    ],
  },
  // Cardiology
  {
    specialty: "Cardiology",
    patterns: [
      /\b(heart failure|myocard|coronary|atrial fib|ventricular|arrhythm|hypertension|cardiomyopath|cardiovas|pulmonary hypertension|aortic|valvular|stroke|ischemic heart)/i,
    ],
  },
  // Neurology
  {
    specialty: "Neurology",
    patterns: [
      /\b(alzheimer|parkinson|multiple sclerosis|epilep|seizure|migraine|neuropath|dementia|neurodegen|stroke recovery|spinal cord|peripheral nerve)/i,
    ],
  },
  // Psychiatry
  {
    specialty: "Psychiatry",
    patterns: [
      /\b(depression|major depressive|schizophren|bipolar|anxiety|ptsd|post-traumatic|substance use|opioid use|alcohol use|eating disorder|adhd|attention deficit|autism|psychiatric)/i,
    ],
  },
  // Immunology & Rheumatology
  {
    specialty: "Immunology & Rheumatology",
    patterns: [
      /\b(rheumatoid|lupus|systemic sclerosis|psoriatic arthritis|ankylosing|sjogren|vasculitis|myasthenia|autoimmune|graft.versus.host)/i,
    ],
  },
  // Dermatology
  {
    specialty: "Dermatology",
    patterns: [
      /\b(psoriasis|atopic dermatitis|eczema|vitiligo|hidradenitis|alopecia|acne|rosacea|urticaria|dermatolog)/i,
    ],
  },
  // Infectious Disease
  {
    specialty: "Infectious Disease",
    patterns: [
      /\b(hiv|hepatitis|covid|sars-cov|tuberculosis|influenza|malaria|sepsis|pneumonia|bacterial|viral infection|fungal|antibiotic|antimicrobial|vaccine)/i,
    ],
  },
  // Endocrinology & Metabolism
  {
    specialty: "Endocrinology & Metabolism",
    patterns: [
      /\b(diabetes|obesity|thyroid|cushing|acromegaly|growth hormone|hypogonad|metabolic|nash|nonalcoholic steatohepat|hyperlipid|cholesterol|insulin)/i,
    ],
  },
  // Gastroenterology
  {
    specialty: "Gastroenterology",
    patterns: [
      /\b(crohn|ulcerative colitis|inflammatory bowel|ibd|ibs|gerd|hepatitis|cirrhosis|liver disease|pancreat|gastrointestinal|esophag|gastric)/i,
    ],
  },
  // Pulmonology
  {
    specialty: "Pulmonology",
    patterns: [
      /\b(asthma|copd|chronic obstructive|cystic fibrosis|idiopathic pulmonary|interstitial lung|pulmonary fibrosis|bronchiec|sleep apnea|respiratory)/i,
    ],
  },
  // Nephrology
  {
    specialty: "Nephrology",
    patterns: [
      /\b(kidney disease|renal|nephrop|dialysis|chronic kidney|polycystic kidney|nephritis|glomerul|focal segmental)/i,
    ],
  },
  // Ophthalmology
  {
    specialty: "Ophthalmology",
    patterns: [
      /\b(macular degenera|diabetic retinopathy|glaucoma|dry eye|uveitis|retinal|geographic atrophy|ophthalmic|eye disease|cataract)/i,
    ],
  },
  // Women's Health
  {
    specialty: "Women's Health",
    patterns: [
      /\b(endometriosis|menopaus|fibroid|polycystic ovary|pcos|preeclampsia|postpartum|contracept|cervical|ovarian (?!cancer)|uterine (?!cancer)|breast (?!cancer)|gynecolog)/i,
    ],
  },
];

/**
 * Assign a primary specialty to a trial based on its conditions and MeSH branches.
 *
 * @param conditions - Free-text conditions (from `conditions[]`)
 * @param browseBranchAbbrevs - MeSH branch abbreviations (from `conditionBrowseModule.browseBranches[].abbrev`)
 */
export function assignSpecialty(
  conditions: string[] = [],
  browseBranchAbbrevs: string[] = [],
): Specialty {
  const conditionText = conditions.join(" | ").toLowerCase();

  // PRIORITY 1: Cancer keyword takes precedence over hematology MeSH branch
  // (e.g., a leukemia trial appears in BC04 AND BC15 — we want Oncology)
  if (/\b(cancer|carcinoma|sarcoma|lymphoma|leukemia|melanoma|malignan|glioma|glioblastoma|myeloma|tumou?r|metasta)/i.test(conditionText)) {
    return "Oncology";
  }

  // PRIORITY 2: MeSH branch mapping
  for (const abbrev of browseBranchAbbrevs) {
    const mapped = MESH_BRANCH_MAP[abbrev];
    if (mapped) {
      // Special-case: BC12 (Urogenital) — split between Nephrology and Women's Health
      if (abbrev === "BC12") {
        if (/\b(female|gynec|ovar|uter|cervix|cervical|endometr)/i.test(conditionText)) {
          return "Women's Health";
        }
        if (/\b(prostate|bladder|kidney|renal)/i.test(conditionText)) {
          // prostate/bladder cancer caught by oncology rule above — these are non-cancer
          return /\b(prostate|bladder)/i.test(conditionText) ? "Other" : "Nephrology";
        }
        return "Nephrology";
      }
      return mapped;
    }
  }

  // PRIORITY 3: Keyword fallback
  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.some((re) => re.test(conditionText))) {
      return rule.specialty;
    }
  }

  return "Other";
}
