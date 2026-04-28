import { useEffect, useRef, useState } from 'react'
import ErnestThinkingIndicator from './components/ErnestThinkingIndicator'
import { highContrastClasses } from './theme/highContrastPalette'
import { SendHorizontal, Keyboard as KeyboardIcon } from 'lucide-react'

const DEFAULT_N8N_WEBHOOK = 'https://clic-et-moi.app.n8n.cloud/webhook-test/ernest/voice'
const N8N_WEBHOOK = import.meta.env.VITE_N8N_WEBHOOK || DEFAULT_N8N_WEBHOOK
const MESSAGE_SEPARATOR_REGEX = /🟪\s*\*\*De(?:ux|xui)ième\s+Message\*\*/i
const MESSAGE_SPLIT_DELAY = 2000

export default function ErnestVoiceChat() {
  const [sessionId] = useState(() => {
    const k = "ernest_session";
    let v = localStorage.getItem(k);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(k, v);
    }
    return v;
  });

  const [recording, setRecording] = useState(false)
  const [status, setStatus] = useState('Prêt')
  const [answer, setAnswer] = useState('')
  const [sending, setSending] = useState(false)
  const mrRef = useRef(null)
  const chunksRef = useRef([])
  const bottomRef = useRef(null)
  const composerTextareaRef = useRef(null)

  const [text, setText] = useState('')
  const [fontStep, setFontStep] = useState(1)
  const fontSizeClass = fontStep === 0 ? 'text-[18px]' : fontStep === 1 ? 'text-[20px]' : 'text-[22px]'
  const [isFontLarge, setIsFontLarge] = useState(false)
  const [highContrastMode, setHighContrastMode] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [composerFocused, setComposerFocused] = useState(false)

  const [messages, setMessages] = useState([
    { id: 'welcome', from: 'bot', text: 'Bonjour, je suis Ernest. Appuyez sur le micro pour parler ou écrivez votre message.' },
  ])
  const [isThinking, setIsThinking] = useState(false)

  const [files, setFiles] = useState([])
  const fileInputRef = useRef(null)

  const hasTextInput = text.trim().length > 0
  const hasAttachments = files.length > 0
  const isVoiceActive = recording
  const interactionLocked = sending || isThinking
  const showMicButton = (!hasTextInput && !hasAttachments && !interactionLocked) || isVoiceActive
  const showAttachButton = !isVoiceActive && !interactionLocked && !hasTextInput
  const showTextComposer = !isVoiceActive && !hasAttachments
  const showSendTextButton = !isVoiceActive && !hasAttachments
  const quickActions = [
    { key: 'record', label: 'Parler', icon: '🎙️' },
    { key: 'write', label: 'Écrire', icon: '✍️' },
    { key: 'attach', label: 'Joindre', icon: '📎' },
    { key: 'help', label: 'Aide', icon: '🆘' },
  ]
  const combinedTextSizeClass = isFontLarge ? 'text-[22px]' : fontSizeClass
  const highContrastTokens = {
    root: highContrastClasses.background,
    panel: `${highContrastClasses.panel} ring-[#2A313D]`,
    header: 'border-b border-[#2A313D] bg-[#1B2027]',
    headerMuted: 'text-[#A9B4C6]',
    toolbar: 'border-b border-[#2A313D] bg-[#1B2027]/95',
    controlIdle: `${highContrastClasses.buttonIdle} ring-1 ring-[#2A313D]`,
    controlActive: `${highContrastClasses.buttonActive} ring-1 ring-[#2EC1B2]/70`,
    quickAction: `${highContrastClasses.elevated} ring-1 ring-inset ring-[#2A313D]`,
    logBackground: 'bg-[#111418]',
    composerShell: 'border-t border-[#2A313D] bg-[#1B2027]/95',
    attachmentPill: `${highContrastClasses.elevated} ring-1 ring-inset ring-[#2A313D]`,
    attachmentRemove: 'text-[#A9B4C6] hover:bg-[#2A313D] hover:text-[#F6F8FB]',
    textarea: 'border-[#2A313D] bg-[#1B2027] text-[#E8ECF2] placeholder:text-[#A9B4C6]',
    inlineAttachButton: 'text-[#A9B4C6] hover:bg-[#2A313D] hover:text-[#F6F8FB]',
    desktopMicIdle: `${highContrastClasses.buttonIdle} hover:bg-[#2A313D]`,
    desktopSend: `${highContrastClasses.buttonActive} text-[#071014] hover:bg-[#28B5A6]`,
    mobileSecondary: `${highContrastClasses.buttonIdle}`,
    mobilePrimary: `${highContrastClasses.buttonActive} text-[#071014]`,
    floating: `${highContrastClasses.elevated} border border-[#2A313D] text-[#E8ECF2]`,
  }
  const rootThemeClass = highContrastMode ? highContrastTokens.root : 'bg-slate-50 text-gray-900'
  const panelThemeClass = highContrastMode ? highContrastTokens.panel : 'bg-white text-gray-900 ring-gray-100'
  const bubbleUserClass = highContrastMode ? highContrastClasses.userBubble : 'bg-blue-600 text-white ring-1 ring-blue-500'
  const bubbleBotClass = highContrastMode ? highContrastClasses.botBubble : 'bg-gray-100 text-gray-900 ring-1 ring-gray-200'
  const handleQuickAction = (key) => {
    if (key === 'record') {
      handleToggleRecord()
      return
    }
    if (key === 'write') {
      composerTextareaRef.current?.focus()
      setComposerFocused(true)
      return
    }
    if (key === 'attach') {
      handleFileButtonClick()
      return
    }
    if (key === 'help' && typeof window !== 'undefined') {
      window.open('tel:3018', '_self')
    }
  }
  const handleHideKeyboard = () => {
    composerTextareaRef.current?.blur()
    setComposerFocused(false)
  }
  useEffect(() => {
    const updateMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768)
      }
    }
    updateMobile()
    window.addEventListener('resize', updateMobile)
    return () => window.removeEventListener('resize', updateMobile)
  }, [])
  
  useEffect(() => {
    if (!answer) return

    let parsedAnswer = answer
    if (typeof answer === 'string' && answer.trim().startsWith('[') && answer.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(answer)
        if (Array.isArray(parsed)) {
          parsedAnswer = parsed
        }
      } catch (e) {
        console.warn("Impossible de parser answer comme JSON:", e)
      }
    }

    const appendBotMessage = (rawText, delay = 0) => {
      const trimmedText = String(rawText).trim()
      if (!trimmedText) return false

      const pushMessage = () => {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), from: 'bot', text: trimmedText },
        ])
      }

      if (delay > 0) {
        setTimeout(pushMessage, delay)
      } else {
        pushMessage()
      }

      return true
    }

    const finalizeThinking = (delay = 0) => {
      if (delay > 0) {
        setTimeout(() => setIsThinking(false), delay)
      } else {
        setIsThinking(false)
      }
      setAnswer('')
    }

    if (Array.isArray(parsedAnswer)) {
      let lastDelay = 0
      parsedAnswer.forEach((msg, index) => {
        const delay = index * MESSAGE_SPLIT_DELAY
        if (appendBotMessage(msg, delay)) {
          lastDelay = delay
        }
      })
      finalizeThinking(lastDelay)
      return
    }

    const trimmedAnswer = String(parsedAnswer).trim()
    if (!trimmedAnswer) {
      finalizeThinking()
      return
    }

    const match = trimmedAnswer.match(MESSAGE_SEPARATOR_REGEX)
    if (match) {
      const separatorIndex = match.index ?? 0
      const firstPart = trimmedAnswer.substring(0, separatorIndex).trim()
      const secondPart = trimmedAnswer.substring(separatorIndex + match[0].length).trim()

      let finalDelay = 0
      if (appendBotMessage(firstPart)) {
        finalDelay = 0
      }
      if (appendBotMessage(secondPart, MESSAGE_SPLIT_DELAY)) {
        finalDelay = MESSAGE_SPLIT_DELAY
      }

      finalizeThinking(finalDelay)
      return
    }

    appendBotMessage(trimmedAnswer)
    finalizeThinking()
  }, [answer])

  function extractBotPayload(data) {
    return data?.answer ?? data?.output ?? data?.transcript ?? null
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
   async function postToN8n(fd) {
    if (!N8N_WEBHOOK) {
      console.warn("VITE_N8N_WEBHOOK manquant dans .env");
      return { answer: "Webhook non configuré." };
    }
    const res = await fetch(N8N_WEBHOOK, { method: "POST", body: fd });
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { answer: raw };
    }
    if (!res.ok) {
      console.error("Webhook error", res.status, raw);
      throw new Error(`HTTP ${res.status}`);
    }
    return data;
  }

  function pickMime() {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ]
    for (const t of candidates) {
      if (window.MediaRecorder?.isTypeSupported?.(t)) return t
    }
    return 'audio/webm'
  }

  async function startRec() {
    try {
      // Vérifier si l'API est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Votre navigateur ne supporte pas l\'enregistrement audio. Veuillez utiliser un navigateur moderne.');
      }

      // Demander l'accès au microphone avec gestion d'erreurs améliorée
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const mimeType = pickMime();
      chunksRef.current = [];

      const mr = new MediaRecorder(stream, { mimeType });
      mrRef.current = mr;
      setRecording(true);
      setStatus("Enregistrement…");

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          chunksRef.current = [];
          await sendAudio(blob);
        } catch (e) {
          console.error(e);
          setStatus("Erreur d\'envoi");
        } finally {
          stream.getTracks().forEach((t) => t.stop());
          setRecording(false);
        }
      };

      mr.start(250);
    } catch (error) {
      // Gestion améliorée des erreurs de permission
      let errorMessage = 'Erreur d\'accès au microphone';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Permission refusée. Veuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'Aucun microphone trouvé. Vérifiez que votre appareil possède un microphone.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Le microphone est déjà utilisé par une autre application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Les paramètres audio demandés ne sont pas supportés.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setStatus(errorMessage);
      setRecording(false);
      throw error;
    }
  }

  function stopRec() {
    const mr = mrRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
  }

  async function sendAudio(blob) {
    if (!blob || sending) return
    try {
      setSending(true)
      setStatus('Envoi audio…')

      setMessages(prev => [...prev, { id: crypto.randomUUID(), from: 'user', text: '🎤 Message vocal envoyé' }])
      setIsThinking(true)

      const fd = new FormData()
      const filename =
        blob.type.includes('ogg') ? 'voice.ogg' :
        blob.type.includes('mp4') ? 'voice.m4a' :
        'voice.webm'
      fd.append('audio', blob, filename)
      fd.append('sessionId', sessionId)

      const data = await postToN8n(fd);
      const botPayload = extractBotPayload(data)
      if (botPayload != null) {
        setAnswer(botPayload); // Peut être string ou string[]
      }
      setStatus("Prêt");
    } catch (e) {
      console.error(e);
      setStatus("Erreur d\'envoi");
      setIsThinking(false);
    } finally {
      setSending(false);
    }
  }

  async function sendText(message) {
    const fd = new FormData();
    fd.append("text", message);
    fd.append("sessionId", sessionId);
    setIsThinking(true);
    const data = await postToN8n(fd);
    const botPayload = extractBotPayload(data)
    if (botPayload != null) {
      setAnswer(botPayload);
    }
  }

  const handleFileButtonClick = () => fileInputRef.current?.click()
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length) setFiles(prev => [...prev, ...selected])
    e.target.value = ''
  }
  const removeFileAt = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }
  const sendFiles = async () => {
    if (!files.length || sending) return
    try {
      setSending(true)
      setStatus('Envoi des fichiers…')
      const form = new FormData()
      form.append('sessionId', sessionId)
      files.forEach((f) => form.append('files', f, f.name))
      const res = await fetch(N8N_WEBHOOK, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) throw new Error('Upload échoué')
      const data = await res.json().catch(() => ({}))
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), from: 'user', text: `📎 ${files.length} fichier(s) envoyé(s)` },
      ])
      setIsThinking(true)
      const botPayload = extractBotPayload(data)
      if (botPayload != null) setAnswer(botPayload)
      setFiles([])
      setStatus('Prêt')
    } catch (e) {
      console.error(e)
      setStatus('Erreur d\'envoi')
      setIsThinking(false)
    } finally {
      setSending(false)
    }
  }

  const handleToggleRecord = async () => {
    try {
      if (recording) {
        setStatus('Arrêt de l\'enregistrement…')
        stopRec()
        setRecording(false)
        setStatus('Prêt')
      } else {
        setStatus('Enregistrement…')
        await startRec()
        setRecording(true)
      }
    } catch (e) {
      console.error(e)
      // Le message d'erreur est déjà défini dans startRec()
      setRecording(false)
    }
  }

  const handleSendText = async () => {
    const msg = text.trim()
    if (!msg || sending) return
    setMessages(prev => [...prev, { id: crypto.randomUUID(), from: 'user', text: msg }])
    setText('')
    try {
      setSending(true)
      await sendText(msg)
    } catch (e) {
      console.error(e)
      setStatus('Erreur d\'envoi')
    } finally {
      setSending(false)
    }
  }

 const handleClear = () => {
    const newId = crypto.randomUUID();
    localStorage.setItem("ernest_session", newId);
    setMessages([
      { id: crypto.randomUUID(), from: "bot", text: "Nouvelle conversation démarrée." },
    ]);
    setStatus("Prêt");
  };

  const currentStatus = recording
    ? { label: 'Enregistrement…', desc: 'Parlez puis appuyez pour arrêter' }
    : isThinking
      ? { label: 'Réfléchit…', desc: 'Ernest prépare sa réponse' }
      : sending
        ? { label: 'Envoi…', desc: 'Transmission au centre d’assistance' }
        : { label: status, desc: 'Vous pouvez écrire ou parler' }

  return (
    <section className={`flex min-h-screen w-full justify-center ${rootThemeClass} ${combinedTextSizeClass} px-3 sm:px-6 lg:px-10`}>
      <div className={`mx-auto flex w-full max-w-5xl flex-1 flex-col rounded-3xl shadow-2xl ring-1 overflow-hidden ${panelThemeClass}`}>
        <div className={`flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 ${
          highContrastMode ? highContrastTokens.header : 'border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950'
        }`}>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ernest</h1>
          <span
            className={`inline-flex flex-col gap-1 rounded-2xl px-3 py-2 text-sm font-medium ring-1 ring-inset
              ${recording
                ? 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900'
                : isThinking
                  ? 'bg-yellow-50 text-yellow-800 ring-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-200 dark:ring-yellow-900'
                  : sending
                    ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900'}`}
            role="status"
            aria-live="polite"
          >
            <span className="inline-flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  recording
                    ? 'bg-red-600'
                    : isThinking
                      ? 'bg-yellow-500'
                      : sending
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                }`}
              />
              {currentStatus.label}
            </span>
            <span className={`text-[11px] font-normal ${highContrastMode ? highContrastTokens.headerMuted : 'text-gray-600 dark:text-gray-300'}`}>
              {currentStatus.desc}
            </span>
          </span>
        </div>

        <div className="inline-flex items-center gap-2">
          <span className={`text-sm ${highContrastMode ? highContrastTokens.headerMuted : 'text-gray-600 dark:text-gray-300'}`}>Taille du texte</span>
          <div className={`inline-flex overflow-hidden rounded-lg border ${
            highContrastMode ? 'border-[#2A313D] bg-[#1B2027]' : 'border-gray-300 dark:border-gray-700'
          }`}>
            <button
              type="button"
              onClick={() => setFontStep(0)}
              className={`px-3 py-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
                fontStep === 0
                  ? (highContrastMode ? highContrastTokens.controlActive : 'bg-gray-200 dark:bg-gray-700')
                  : (highContrastMode ? highContrastTokens.controlIdle : 'bg-white dark:bg-gray-900')
              }`}
              aria-pressed={fontStep === 0}
              aria-label="Texte grand"
            >
              A–
            </button>
            <button
              type="button"
              onClick={() => setFontStep(1)}
              className={`px-3 py-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
                fontStep === 1
                  ? (highContrastMode ? highContrastTokens.controlActive : 'bg-gray-200 dark:bg-gray-700')
                  : (highContrastMode ? highContrastTokens.controlIdle : 'bg-white dark:bg-gray-900')
              }`}
              aria-pressed={fontStep === 1}
              aria-label="Texte très grand"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontStep(2)}
              className={`px-3 py-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
                fontStep === 2
                  ? (highContrastMode ? highContrastTokens.controlActive : 'bg-gray-200 dark:bg-gray-700')
                  : (highContrastMode ? highContrastTokens.controlIdle : 'bg-white dark:bg-gray-900')
              }`}
              aria-pressed={fontStep === 2}
              aria-label="Texte énorme"
            >
              A+
            </button>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className={`ml-2 rounded-lg px-3 py-2 shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
              highContrastMode
                ? 'bg-[#232834] text-[#E8ECF2] ring-1 ring-[#2A313D] hover:bg-[#2A313D]'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-label="Effacer la conversation"
          >
            Effacer
          </button>
        </div>
        </div>
        <div className={`px-4 py-3 flex flex-wrap items-center gap-3 md:gap-4 ${
          highContrastMode ? highContrastTokens.toolbar : 'border-b border-gray-200 bg-white/90 dark:border-gray-700 dark:bg-gray-900/80'
        }`}>
          <button
            type="button"
            onClick={() => setIsFontLarge((prev) => !prev)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              highContrastMode
                ? (isFontLarge ? highContrastTokens.controlActive : highContrastTokens.controlIdle)
                : (isFontLarge ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900')
            }`}
          >
            {isFontLarge ? 'Texte agrandi' : 'Agrandir le texte'}
          </button>
          <button
            type="button"
            onClick={() => setHighContrastMode((prev) => !prev)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              highContrastMode ? highContrastTokens.controlActive : 'bg-yellow-100 text-yellow-900'
            }`}
          >
            {highContrastMode ? 'Contraste élevé' : 'Activer contraste'}
          </button>
        </div>
        {isMobile && (
          <div className="px-4 pt-4 md:hidden">
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => handleQuickAction(action.key)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-4 py-4 text-base font-semibold ${
                    highContrastMode ? highContrastTokens.quickAction : 'bg-white text-gray-900 ring-1 ring-slate-200'
                  }`}
                >
                  <span className="text-2xl" aria-hidden>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
        className="flex-1 w-full overflow-y-auto scroll-smooth px-4 sm:px-6 lg:px-8 py-4 bg-white dark:bg-gray-950"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <ul className="mx-auto flex max-w-screen-lg flex-col gap-4 sm:gap-5">
          {messages.map(m => (
            <li key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap leading-8 sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                  m.from === 'user' ? bubbleUserClass : bubbleBotClass
                }`}
              >
                {m.text}
              </div>
            </li>
          ))}
          {isThinking && (
            <li>
              <ErnestThinkingIndicator
                isThinking={isThinking}
                tone="light"
                className="justify-start"
                borderClassName="ring-1 ring-inset ring-gray-200 dark:ring-gray-700"
              />
            </li>
          )}
          <div ref={bottomRef} />
        </ul>
        </div>

        <div className="w-full border-t border-gray-200 bg-white/95 px-4 sm:px-6 lg:px-8 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
        {/* Zone de fichiers joints */}
        {files.length > 0 && (
          <div className="mx-auto mb-3 flex w-full max-w-screen-lg flex-wrap gap-2">
            {files.map((f, i) => (
              <span
                key={`${f.name}-${i}`}
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800 ring-1 ring-inset ring-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700"
              >
                {f.name}
                <button
                  type="button"
                  onClick={() => removeFileAt(i)}
                  className="rounded-full px-3 py-1 text-gray-500 hover:bg-gray-200 hover:text-gray-800 dark:hover:bg-gray-700 min-w-[32px] min-h-[32px] flex items-center justify-center"
                  aria-label={`Retirer ${f.name}`}
                  title="Retirer"
                >
                  <span className="text-lg">✕</span>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Barre de saisie principale - style chatbot */}
        <form
          className="mx-auto flex w-full max-w-screen-lg items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            handleSendText()
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            aria-hidden="true"
          />
          
          <div className={`flex flex-1 ${isMobile ? 'flex-col gap-3' : 'items-end gap-3'}`}>
            {showTextComposer && (
              <div className="flex-1 relative">
                <label htmlFor="message" className="sr-only">Votre message</label>
                <textarea
                  id="message"
                  ref={composerTextareaRef}
                  rows={isMobile ? 4 : 1}
                  value={text}
                  onFocus={() => setComposerFocused(true)}
                  onBlur={() => setComposerFocused(false)}
                  onChange={(e) => {
                    setText(e.target.value)
                    if (!isMobile) {
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                    }
                  }}
                  placeholder="Écrivez votre message..."
                  className={`w-full resize-none rounded-2xl border-2 border-gray-300 bg-white p-4 pr-16 leading-7 text-gray-900 shadow-sm outline-none ring-0 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 ${isMobile ? '' : ''}`}
                  style={isMobile ? undefined : { minHeight: '56px', maxHeight: '120px' }}
                />
                {showAttachButton && !isMobile && (
                  <button
                    type="button"
                    onClick={handleFileButtonClick}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 dark:hover:bg-gray-700 dark:hover:text-gray-300 min-w-[40px] min-h-[40px]"
                    aria-label="Joindre des fichiers"
                    title="Joindre des fichiers"
                  >
                    <span className="text-xl">📎</span>
                  </button>
                )}
              </div>
            )}
            {!isMobile && (
              <>
                {showMicButton && (
                  <button
                    type="button"
                    onClick={handleToggleRecord}
                    className={`flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-full p-4 text-lg font-semibold shadow-lg transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 min-w-[60px] min-h-[60px]
                      ${recording 
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                    aria-pressed={recording}
                    aria-label={recording ? 'Arrêter l\'enregistrement' : 'Commencer l\'enregistrement'}
                    title={recording ? 'Arrêter l\'enregistrement' : 'Parler'}
                  >
                    <span className="text-2xl">{recording ? '⏹️' : '🎤'}</span>
                  </button>
                )}
                {showSendTextButton && (
                  <button
                    type="submit"
                    disabled={!text.trim() || sending}
                    aria-busy={sending}
                    className={`flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-full p-4 min-w-[60px] min-h-[60px] shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
                      text.trim() && !sending
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-500 hover:to-emerald-500'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    aria-label="Envoyer le message"
                    title="Envoyer"
                  >
                    {sending ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <SendHorizontal className="h-6 w-6" aria-hidden />
                        Envoyer
                      </>
                    )}
                  </button>
                )}
              </>
            )}
            {isMobile && (
              <>
                {composerFocused && (
                  <button
                    type="button"
                    onClick={handleHideKeyboard}
                    className="inline-flex items-center gap-2 rounded-full bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm"
                  >
                    <KeyboardIcon className="h-4 w-4" aria-hidden />
                    Masquer le clavier
                  </button>
                )}
                <div className="grid grid-cols-3 gap-2 w-full">
                  <button
                    type="button"
                    onClick={handleFileButtonClick}
                    className="rounded-2xl bg-gray-100 px-3 py-3 text-sm font-semibold text-gray-800 shadow-sm"
                  >
                    📎 Joindre
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleRecord}
                    className={`rounded-2xl px-3 py-3 text-sm font-semibold text-white shadow-sm ${recording ? 'bg-red-500' : 'bg-blue-500'}`}
                  >
                    {recording ? 'Arrêter' : 'Parler'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendText}
                    disabled={!text.trim() || sending}
                    className={`rounded-2xl px-3 py-3 text-sm font-semibold shadow-md inline-flex items-center justify-center gap-2 ${
                      text.trim() && !sending
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-500 hover:to-emerald-500'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {sending ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <SendHorizontal className="h-5 w-5" aria-hidden />
                        Envoyer
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>

        {/* Bouton d'envoi des fichiers - seulement visible si des fichiers sont sélectionnés */}
        {files.length > 0 && (
          <div className="mx-auto mt-2 flex w-full max-w-screen-lg justify-center">
            <button
              type="button"
              onClick={sendFiles}
              disabled={sending}
              className="inline-flex items-center gap-3 rounded-lg bg-indigo-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 min-h-[56px]"
            >
              <span className="text-xl">⬆️</span> Envoyer {files.length} fichier{files.length > 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
      </div>
      <button
        type="button"
        onClick={() => {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back()
          } else {
            handleClear()
          }
        }}
        className={`fixed bottom-4 left-4 z-30 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg border ${
          highContrastMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white/95 text-gray-900 border-slate-200'
        }`}
      >
        <span aria-hidden>←</span>
        Retour
      </button>
    </section>
  )
}