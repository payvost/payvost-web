/**
 * Business KYC/KYB Configuration
 * Know Your Business verification tiers and requirements
 */

export type BusinessTierKey = 'tier1' | 'tier2' | 'tier3';
export type BusinessType = 'sole_proprietor' | 'partnership' | 'limited_company' | 'ngo' | 'other';

export interface BusinessTierConfig {
  label: string;
  summary: string;
  limits: {
    daily: string;
    monthly: string;
  };
  requirements: string[];
  documents?: Array<{
    type: string;
    label: string;
    description?: string;
    required: boolean;
  }>;
  verificationSteps: string[];
  allowedActions: string[];
}

export interface BusinessTierConfigs {
  tier1: BusinessTierConfig;
  tier2: BusinessTierConfig;
  tier3: BusinessTierConfig;
}

const BASE_BUSINESS_TIERS: Record<BusinessTierKey, BusinessTierConfig> = {
  tier1: {
    label: 'Basic Business Registration',
    summary: 'Create your business account and explore the platform with starter limits.',
    limits: {
      daily: '$500',
      monthly: '$2,000',
    },
    requirements: [
      'Business name and contact information',
      'Business type and industry category',
      'Country of registration',
      'Business email and phone number',
    ],
    verificationSteps: [
      'Email verification',
      'Phone verification',
      'Basic AML screening of business name',
      'Basic verification of contact person',
    ],
    allowedActions: [
      'Browse dashboard',
      'Limited test transactions',
      'No withdrawals/payouts (or extremely limited)',
    ],
  },
  tier2: {
    label: 'Verified Business',
    summary: 'Unlock full transaction capability with standard KYB documentation.',
    limits: {
      daily: '$10,000',
      monthly: '$100,000',
    },
    requirements: [
      'Certificate of Incorporation / Business Registration',
      'Business address proof',
      'Director/Owner government IDs',
      'Tax Identification Number (TIN/EIN/Company Number)',
      'Bank account verification (business account)',
    ],
    documents: [
      {
        type: 'certificate_of_incorporation',
        label: 'Certificate of Incorporation / Business Registration',
        description: 'Official business registration document from your country\'s registry',
        required: true,
      },
      {
        type: 'business_address_proof',
        label: 'Proof of Business Address',
        description: 'Utility bill or bank statement showing business address',
        required: true,
      },
      {
        type: 'director_id',
        label: 'Director/Owner Government ID',
        description: 'Government-issued photo ID of at least one director/owner',
        required: true,
      },
      {
        type: 'tax_id',
        label: 'Tax Identification Number',
        description: 'TIN, EIN, Company Number, or equivalent tax ID',
        required: true,
      },
      {
        type: 'bank_statement',
        label: 'Business Bank Account Statement',
        description: 'Recent bank statement showing business account details',
        required: true,
      },
    ],
    verificationSteps: [
      'OCR + database validation of company documents',
      'Lookup via government registries',
      'AML/PEP screening of directors',
      'Owner selfie + ID face match',
      'Address verification',
      'Bank account verification',
    ],
    allowedActions: [
      'Accept payments',
      'Withdraw funds',
      'Access invoices, payouts, wallets',
      'API access enabled',
    ],
  },
  tier3: {
    label: 'Advanced / High-Value Business',
    summary: 'Unlock unlimited transactions and international features with enhanced due diligence.',
    limits: {
      daily: 'Unlimited',
      monthly: 'Unlimited',
    },
    requirements: [
      'Source of funds documentation',
      'Financial statements (6-12 months)',
      'Ultimate Beneficial Owner (UBO) details',
      'Organizational structure chart',
      'Compliance questionnaire',
      'High-risk merchant form (if applicable)',
    ],
    documents: [
      {
        type: 'source_of_funds',
        label: 'Source of Funds Documentation',
        description: 'Bank statements, audited accounts, or contracts explaining revenue sources',
        required: true,
      },
      {
        type: 'financial_statements',
        label: 'Financial Statements',
        description: '6-12 months of financial statements or audited accounts',
        required: true,
      },
      {
        type: 'ubo_details',
        label: 'Ultimate Beneficial Owner (UBO) Details',
        description: 'Complete information on all beneficial owners (25%+ ownership)',
        required: true,
      },
      {
        type: 'organizational_chart',
        label: 'Organizational Structure Chart',
        description: 'Diagram showing ownership structure and relationships',
        required: true,
      },
      {
        type: 'compliance_questionnaire',
        label: 'Compliance Questionnaire',
        description: 'Complete compliance and risk assessment questionnaire',
        required: true,
      },
      {
        type: 'video_kyc',
        label: 'Video KYC of Director(s)',
        description: 'Video call verification with at least one director (if required)',
        required: false,
      },
    ],
    verificationSteps: [
      'Deep AML/PEP screening',
      'Sanctions list checks (OFAC, FATF, UN, EU)',
      'Manual compliance officer review',
      'Verification of revenue sources',
      'Risk scoring',
      'Site visit (rare, only for banks or very high volume merchants)',
    ],
    allowedActions: [
      'High transaction limits',
      'Multi-currency wallets',
      'Global payouts',
      'Custom transaction thresholds',
      'Priority settlement',
      'Chargeback guarantee options',
    ],
  },
};

/**
 * Country-specific business requirements
 */
export const COUNTRY_BUSINESS_REQUIREMENTS: Record<
  string,
  {
    registrationDocumentType: string;
    registryName: string;
    taxIdLabel: string;
    taxIdPattern?: RegExp;
    additionalDocuments?: Array<{
      type: string;
      label: string;
      description: string;
      required: boolean;
    }>;
  }
> = {
  NG: {
    registrationDocumentType: 'CAC Certificate',
    registryName: 'Corporate Affairs Commission (CAC)',
    taxIdLabel: 'Tax Identification Number (TIN)',
    taxIdPattern: /^\d{10}$/,
    additionalDocuments: [
      {
        type: 'memorandum_of_association',
        label: 'Memorandum of Association',
        description: 'Company memorandum of association document',
        required: false,
      },
    ],
  },
  GH: {
    registrationDocumentType: 'Registrar General Certificate',
    registryName: 'Registrar General\'s Department',
    taxIdLabel: 'Ghana Revenue Authority TIN',
    taxIdPattern: /^[A-Z0-9]{8,13}$/,
  },
  KE: {
    registrationDocumentType: 'Business Registration Certificate',
    registryName: 'Business Registration Service',
    taxIdLabel: 'KRA PIN',
    taxIdPattern: /^[A-Z]\d{9}[A-Z]$/,
  },
  ZA: {
    registrationDocumentType: 'CIPC Certificate',
    registryName: 'Companies and Intellectual Property Commission (CIPC)',
    taxIdLabel: 'Tax Reference Number',
    taxIdPattern: /^\d{10}$/,
  },
  US: {
    registrationDocumentType: 'EIN Document / Secretary of State Filing',
    registryName: 'Secretary of State / IRS',
    taxIdLabel: 'Employer Identification Number (EIN)',
    taxIdPattern: /^\d{2}-\d{7}$/,
    additionalDocuments: [
      {
        type: 'beneficial_ownership',
        label: 'Beneficial Ownership Information',
        description: 'BOI filing or equivalent beneficial ownership declaration',
        required: true,
      },
    ],
  },
  GB: {
    registrationDocumentType: 'Companies House Certificate',
    registryName: 'Companies House',
    taxIdLabel: 'Company Number / UTR',
    additionalDocuments: [
      {
        type: 'ubo_declaration',
        label: 'Ultimate Beneficial Owner Declaration',
        description: 'PSC (People with Significant Control) register',
        required: true,
      },
    ],
  },
  CA: {
    registrationDocumentType: 'Corporations Canada Certificate',
    registryName: 'Corporations Canada',
    taxIdLabel: 'Business Number (BN)',
  },
  AU: {
    registrationDocumentType: 'ASIC Certificate',
    registryName: 'Australian Securities and Investments Commission (ASIC)',
    taxIdLabel: 'Australian Business Number (ABN)',
  },
  DE: {
    registrationDocumentType: 'Handelsregister Certificate',
    registryName: 'Handelsregister (Commercial Register)',
    taxIdLabel: 'Steuernummer (Tax Number)',
  },
  FR: {
    registrationDocumentType: 'Extrait Kbis',
    registryName: 'Registre du Commerce et des Sociétés (RCS)',
    taxIdLabel: 'Numéro SIRET / TVA Intracommunautaire',
  },
  IT: {
    registrationDocumentType: 'Visura Camerale',
    registryName: 'Camera di Commercio',
    taxIdLabel: 'Codice Fiscale / Partita IVA',
  },
  ES: {
    registrationDocumentType: 'Certificado de Inscripción',
    registryName: 'Registro Mercantil',
    taxIdLabel: 'Número de Identificación Fiscal (NIF)',
  },
  NL: {
    registrationDocumentType: 'Uittreksel Kamer van Koophandel',
    registryName: 'Kamer van Koophandel (KVK)',
    taxIdLabel: 'BTW-nummer (VAT Number)',
  },
  BE: {
    registrationDocumentType: 'Extrait de la Banque-Carrefour des Entreprises',
    registryName: 'Banque-Carrefour des Entreprises',
    taxIdLabel: 'Numéro de TVA / Numéro BCE',
  },
  PT: {
    registrationDocumentType: 'Certidão Permanente',
    registryName: 'Conservatória do Registo Comercial',
    taxIdLabel: 'Número de Identificação Fiscal (NIF)',
  },
  IE: {
    registrationDocumentType: 'Certificate of Incorporation',
    registryName: 'Companies Registration Office (CRO)',
    taxIdLabel: 'Tax Registration Number / VAT Number',
  },
  AT: {
    registrationDocumentType: 'Firmenbuchauszug',
    registryName: 'Firmenbuch (Commercial Register)',
    taxIdLabel: 'UID-Nummer (VAT Number)',
  },
  CH: {
    registrationDocumentType: 'Handelsregisterauszug',
    registryName: 'Handelsregisteramt',
    taxIdLabel: 'UID-Nummer (VAT Number)',
  },
  SE: {
    registrationDocumentType: 'Registreringsbevis',
    registryName: 'Bolagsverket (Swedish Companies Registration Office)',
    taxIdLabel: 'Organisationsnummer',
  },
  NO: {
    registrationDocumentType: 'Foretaksregisterutskrift',
    registryName: 'Foretaksregisteret',
    taxIdLabel: 'Organisasjonsnummer',
  },
  DK: {
    registrationDocumentType: 'CVR-Uddrag',
    registryName: 'Erhvervsstyrelsen (Danish Business Authority)',
    taxIdLabel: 'CVR-nummer',
  },
  FI: {
    registrationDocumentType: 'Yritystieto',
    registryName: 'Yritys- ja yhteisötietojärjestelmä (YTJ)',
    taxIdLabel: 'Y-tunnus',
  },
  PL: {
    registrationDocumentType: 'Wypis z KRS',
    registryName: 'Krajowy Rejestr Sądowy (KRS)',
    taxIdLabel: 'NIP (Tax Identification Number)',
  },
  CZ: {
    registrationDocumentType: 'Výpis z obchodního rejstříku',
    registryName: 'Obchodní rejstřík',
    taxIdLabel: 'IČO (Identification Number) / DIČ (VAT Number)',
  },
  GR: {
    registrationDocumentType: 'Απόδειξη Εγγραφής',
    registryName: 'Γενικό Εμπορικό Μητρώο (GEMI)',
    taxIdLabel: 'ΑΦΜ (Tax Identification Number)',
  },
  RO: {
    registrationDocumentType: 'Extras din Registrul Comerțului',
    registryName: 'Oficiul Național al Registrului Comerțului',
    taxIdLabel: 'CUI (Cod Unic de Înregistrare)',
  },
  HU: {
    registrationDocumentType: 'Cégkivonat',
    registryName: 'Cégközlöny',
    taxIdLabel: 'Adószám (Tax Number)',
  },
  BG: {
    registrationDocumentType: 'Удостоверение за регистрация',
    registryName: 'Търговски регистър',
    taxIdLabel: 'ЕИК (Единен идентификационен код)',
  },
  HR: {
    registrationDocumentType: 'Izvadak iz sudskog registra',
    registryName: 'Sudski registar',
    taxIdLabel: 'OIB (Osobni identifikacijski broj)',
  },
  SK: {
    registrationDocumentType: 'Výpis z obchodného registra',
    registryName: 'Obchodný register',
    taxIdLabel: 'IČO / DIČ',
  },
  SI: {
    registrationDocumentType: 'Izvitek iz registra',
    registryName: 'AJPES (Agencija za javnopravne evidence in storitve)',
    taxIdLabel: 'Davčna številka',
  },
  LT: {
    registrationDocumentType: 'Įmonės pažymėjimas',
    registryName: 'Juridinių asmenų registras',
    taxIdLabel: 'Įmonės kodas / PVM mokėtojo kodas',
  },
  LV: {
    registrationDocumentType: 'Izziņa no Uzņēmumu reģistra',
    registryName: 'Uzņēmumu reģistrs',
    taxIdLabel: 'Reģistrācijas numurs / PVN maksātāja numurs',
  },
  EE: {
    registrationDocumentType: 'Äriregistri väljavõte',
    registryName: 'Äriregister',
    taxIdLabel: 'Registrikood / KMKR number',
  },
  LU: {
    registrationDocumentType: 'Extrait du Registre de Commerce',
    registryName: 'Registre de Commerce et des Sociétés',
    taxIdLabel: 'Numéro TVA',
  },
  MT: {
    registrationDocumentType: 'Certificate of Incorporation',
    registryName: 'Malta Business Registry',
    taxIdLabel: 'VAT Number',
  },
  CY: {
    registrationDocumentType: 'Certificate of Incorporation',
    registryName: 'Department of Registrar of Companies',
    taxIdLabel: 'VAT Number',
  },
};

/**
 * Get business tier configuration
 */
export function getBusinessTierConfig(tier: BusinessTierKey, country?: string): BusinessTierConfig {
  const baseConfig = BASE_BUSINESS_TIERS[tier];
  
  if (!country || tier !== 'tier2') {
    return baseConfig;
  }

  // Enhance tier2 config with country-specific requirements
  const countryReq = COUNTRY_BUSINESS_REQUIREMENTS[country];
  if (!countryReq) {
    return baseConfig;
  }

  const enhancedDocuments = baseConfig.documents?.map(doc => {
    if (doc.type === 'certificate_of_incorporation') {
      return {
        ...doc,
        label: `${countryReq.registrationDocumentType} (${countryReq.registryName})`,
        description: `${doc.description} - Required from ${countryReq.registryName}`,
      };
    }
    if (doc.type === 'tax_id') {
      return {
        ...doc,
        label: countryReq.taxIdLabel,
        description: `${doc.description} - Format required by ${countryReq.registryName}`,
      };
    }
    return doc;
  }) || [];

  // Add country-specific documents
  if (countryReq.additionalDocuments) {
    enhancedDocuments.push(...countryReq.additionalDocuments);
  }

  return {
    ...baseConfig,
    documents: enhancedDocuments,
  };
}

/**
 * Create full business KYC config for a country
 */
export function createBusinessKycConfig(country?: string): BusinessTierConfigs {
  return {
    tier1: getBusinessTierConfig('tier1', country),
    tier2: getBusinessTierConfig('tier2', country),
    tier3: getBusinessTierConfig('tier3', country),
  };
}

/**
 * Export default config
 */
export const DEFAULT_BUSINESS_KYC_CONFIG = createBusinessKycConfig();

/**
 * Business document requirement interface for verification
 */
export interface BusinessDocumentRequirement {
  key: string;
  label: string;
  description?: string;
  required: boolean;
  acceptedFormats?: string[];
  maxSizeMB?: number;
}

/**
 * Get business document requirements for a specific tier and country
 */
export function getBusinessDocumentRequirements(
  tier: BusinessTierKey,
  countryCode?: string,
  businessType?: string
): BusinessDocumentRequirement[] {
  const config = getBusinessTierConfig(tier, countryCode);
  const countryReq = countryCode ? COUNTRY_BUSINESS_REQUIREMENTS[countryCode] : null;

  if (!config.documents) {
    return [];
  }

  const requirements: BusinessDocumentRequirement[] = config.documents.map(doc => {
    // Customize labels based on country
    let label = doc.label;
    let description = doc.description;

    if (countryReq) {
      if (doc.type === 'certificate_of_incorporation') {
        label = countryReq.registrationDocumentType;
        description = `Official business registration document from ${countryReq.registryName}`;
      } else if (doc.type === 'tax_id') {
        label = countryReq.taxIdLabel;
        description = `Tax identification number as required by ${countryReq.registryName}`;
      }
    }

    // Business type specific requirements
    if (businessType === 'sole_proprietor' && doc.type === 'certificate_of_incorporation') {
      label = 'Business Name Registration Certificate';
      description = 'Government-issued business name registration certificate';
    }

    return {
      key: doc.type,
      label,
      description,
      required: doc.required,
      acceptedFormats: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      maxSizeMB: 10,
    };
  });

  // Add country-specific additional documents
  if (countryReq?.additionalDocuments) {
    countryReq.additionalDocuments.forEach(doc => {
      requirements.push({
        key: doc.type,
        label: doc.label,
        description: doc.description,
        required: doc.required,
        acceptedFormats: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        maxSizeMB: 10,
      });
    });
  }

  return requirements;
}

