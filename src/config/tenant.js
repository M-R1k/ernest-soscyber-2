const TENANT_CONFIGS = {
  demo: {
    id: 'demo',
    label: 'Demo',
    appShellClassName: 'bg-blue-50 text-blue-900 dark:bg-[#0f172a] dark:text-blue-100',
    cardClassName: 'rounded-none bg-white shadow-lg ring-0 md:ring-2 md:ring-blue-200/70 dark:bg-gray-950 dark:ring-0 md:dark:ring-blue-500/30',
    badgeClassName: 'text-blue-600 dark:text-blue-300',
    webhookUrl: 'https://clic-et-moi.app.n8n.cloud/webhook/test/dev-soscyber',
  },
  klesia: {
    id: 'klesia',
    label: 'Klesia',
    appShellClassName: 'bg-[#798AC8]/10 text-[#213067] dark:bg-[#213067] dark:text-[#EAF2FF]',
    cardClassName:
      'rounded-none bg-white shadow-lg ring-0 md:ring-2 md:ring-[#798AC8]/45 dark:bg-[#2A3D80] dark:ring-0 md:dark:ring-[#D57A36]/40',
    badgeClassName: 'text-[#D57A36] dark:text-[#FFD2AE]',
    webhookUrl: 'https://clic-et-moi.app.n8n.cloud/webhook/test/dev-soscyber',
  },
  mh: {
    id: 'mh',
    label: 'MH',
    appShellClassName: 'bg-[#FFF2F0] text-[#7A2015] dark:bg-[#2A1512] dark:text-[#FFE8E4]',
    cardClassName:
      'rounded-none bg-white shadow-lg ring-0 md:ring-2 md:ring-[#E2250C]/25 dark:bg-[#3A201C] dark:ring-0 md:dark:ring-[#E2250C]/40',
    badgeClassName: 'text-[#E2250C] dark:text-[#FFB0A4]',
    webhookUrl: 'https://clic-et-moi.app.n8n.cloud/webhook/test/dev-soscyber',
  },
}

const DEFAULT_TENANT = 'demo'

const normalizeTenant = (value) => {
  if (!value) return null
  const normalized = String(value).trim().toLowerCase()
  return normalized in TENANT_CONFIGS ? normalized : null
}

export const resolveTenantId = () => {
  if (typeof window !== 'undefined') {
    const tenantFromUrl = normalizeTenant(
      new URLSearchParams(window.location.search).get('tenant')
    )
    if (tenantFromUrl) return tenantFromUrl
  }

  const tenantFromEnv = normalizeTenant(import.meta.env.VITE_TENANT)
  if (tenantFromEnv) return tenantFromEnv

  return DEFAULT_TENANT
}

export const getTenantConfig = (tenantId) =>
  TENANT_CONFIGS[tenantId] || TENANT_CONFIGS[DEFAULT_TENANT]

export { TENANT_CONFIGS, DEFAULT_TENANT }
