/** Bump this version whenever an accepted document changes materially. */
export const LEGAL_VERSION = '2026-10-12-mobile-1'
export const LEGAL_UPDATED_AT = 'October 12, 2026'

export const LEGAL_LINKS = {
  terms: '/termos',
  privacy: '/privacidade',
  health: '/termos#saude',
  deletion: '/delete-account',
} as const

export type LegalConsentRecord = {
  usageTermsVersion: string
  privacyVersion: string
  healthVersion: string
  adultConfirmed: boolean
  acceptedAt: unknown
}

/** Privacy acknowledgement does not grant permission for unrelated processing. */
export function hasCurrentLegalAcceptance(value: unknown): value is LegalConsentRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Partial<LegalConsentRecord>
  return record.usageTermsVersion === LEGAL_VERSION
    && record.privacyVersion === LEGAL_VERSION
    && record.healthVersion === LEGAL_VERSION
    && record.adultConfirmed === true
    && record.acceptedAt != null
}

export function getConsentCopy(locale: string) {
  if (locale !== 'pt-BR') return {
    adult: 'I confirm that I am 18 or older.',
    terms: 'I have read and agree to the Terms of Use.',
    health: 'I understand the health notice: Anew is educational self-care. It does not provide diagnosis, treatment, therapy, or emergency monitoring.',
    privacy: 'I have read the Privacy Notice, including local device storage, account services, and my data choices.',
    explanation: 'These confirmations apply to your account. AI sharing and spiritual content remain separate, optional choices. Reading the Privacy Notice does not grant blanket consent.',
  }
  return {
    adult: 'Confirmo que tenho 18 anos ou mais.',
    terms: 'Li e concordo com os Termos de Uso.',
    health: 'Compreendo o aviso de saúde: este é um app educativo de autocuidado, não um serviço de diagnóstico, terapia ou emergência.',
    privacy: 'Li o Aviso de Privacidade e compreendo como os dados da conta e meus registros são tratados.',
    explanation: 'Estas confirmações se aplicam à conta. O envio à IA e o conteúdo espiritual continuam sendo escolhas separadas e opcionais. A ciência de privacidade não é uma autorização geral para usar seus dados.',
  }
}
