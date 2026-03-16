import ErnestWidget from './index'

export default function App() {
  return (
    <div className="h-dvh w-screen bg-sky-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 antialiased">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:m-4 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:bg-gray-800"
      >
        Aller au contenu
      </a>

      <main id="contenu" className="flex h-full w-full flex-col">
        <div className="rounded-2xl bg-white shadow-lg dark:bg-gray-950">
          {/* <ErnestWidget webhookUrl="https://clic-et-moi.app.n8n.cloud/webhook/ernest/voice" /> */}
          {/* <ErnestWidget webhookUrl="https://clic-et-moi.app.n8n.cloud/webhook-test/dev-soscyber" /> */}
          <ErnestWidget webhookUrl="https://clic-et-moi.app.n8n.cloud/webhook/dev-soscyber" />
        </div>
      </main>
    </div>
  )
}