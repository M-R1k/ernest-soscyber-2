import { useEffect, useMemo, useState } from "react";
import { BookOpen, Brain, PenSquare, Shield } from "lucide-react";

export const THINKING_STEPS = [
  { label: "Lecture du message…", icon: <BookOpen className="h-5 w-5" /> },
  { label: "Analyse en cours…", icon: <Brain className="h-5 w-5" /> },
  { label: "Préparation de la réponse…", icon: <PenSquare className="h-5 w-5" /> },
  { label: "Vérification de la sécurité…", icon: <Shield className="h-5 w-5" /> },
] as const;

const THINKING_DETAILS: string[][] = [
  [
    "Je vérifie les pièces jointes et les liens éventuels.",
    "Je relis les mots-clés pour comprendre l’urgence.",
    "Je croise les éléments avec les précédents échanges."
  ],
  [
    "Je compare ce cas aux incidents connus.",
    "Je consulte les bonnes pratiques recommandées.",
    "Je identifie les risques prioritaires."
  ],
  [
    "Je structure les étapes d’intervention.",
    "Je rédige des conseils faciles à suivre.",
    "Je choisis les formulations les plus claires."
  ],
  [
    "Je vérifie la conformité aux protocoles internes.",
    "Je m’assure que rien ne compromet votre sécurité.",
    "Je relis les consignes pour éviter toute erreur."
  ]
];

export function useThinkingSteps(isThinking: boolean, intervalMs = 1500) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isThinking) {
      setStep(0);
      return;
    }

    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % THINKING_STEPS.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isThinking, intervalMs]);

  return step;
}

type Tone = "dark" | "light";

type ErnestThinkingIndicatorProps = {
  isThinking: boolean;
  tone?: Tone;
  className?: string;
  borderClassName?: string;
  intervalMs?: number;
};

export function ErnestThinkingIndicator({
  isThinking,
  tone = "dark",
  className = "",
  borderClassName = "",
  intervalMs = 1500,
}: ErnestThinkingIndicatorProps) {
  const stepIndex = useThinkingSteps(isThinking, intervalMs);
  const currentStep = THINKING_STEPS[stepIndex];
  const [detailIndex, setDetailIndex] = useState(0);

  const currentDetails = THINKING_DETAILS[stepIndex] ?? [];
  const detailText = currentDetails[detailIndex] ?? currentDetails[0];

  useEffect(() => {
    if (!isThinking) {
      setDetailIndex(0);
      return;
    }
    setDetailIndex(0);
  }, [stepIndex, isThinking]);

  useEffect(() => {
    if (!isThinking) return;
    const details = THINKING_DETAILS[stepIndex];
    if (!details || details.length < 2) return;

    const delay = 900 + Math.random() * 1800; // intervalle irrégulier
    const timer = window.setTimeout(() => {
      setDetailIndex((prev) => (prev + 1) % details.length);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [detailIndex, isThinking, stepIndex]);

  const styles = useMemo(() => {
    if (tone === "light") {
      return {
        container: "bg-blue-50 text-blue-900 dark:bg-gray-900 dark:text-white",
        spinner: "bg-blue-100 text-blue-900 border border-blue-200 dark:bg-white/10 dark:text-white dark:border-white/10",
        dot: "bg-blue-600 dark:bg-white",
        progressBg: "bg-blue-100 dark:bg-white/10",
        progressFill: "bg-blue-500 dark:bg-white",
        detail: "text-blue-900/80 dark:text-white/80",
      };
    }
    return {
      container: "bg-gray-900 text-white",
      spinner: "bg-white/10 text-white border border-white/10",
      dot: "bg-white",
      progressBg: "bg-white/20",
      progressFill: "bg-white",
      detail: "text-white/70",
    };
  }, [tone]);

  if (!isThinking) return null;

  const progress = ((stepIndex + 1) / THINKING_STEPS.length) * 100;

  return (
    <div className={`flex justify-start ${className}`.trim()}>
      <div
        className={`w-full max-w-md rounded-2xl p-4 shadow-lg transition-colors ${styles.container} ${borderClassName}`.trim()}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              styles.spinner
              }`}
            aria-hidden
          >
            {currentStep.icon}
          </div>
          <div className="flex flex-1 flex-col">
            <span className="text-base font-semibold leading-tight">{currentStep.label}</span>
              {detailText && (
                <p className={`mt-1 text-sm leading-snug ${styles.detail}`}>
                  {detailText}
                </p>
              )}
            <div className={`mt-2 h-2 w-full overflow-hidden rounded-full ${styles.progressBg}`}>
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${styles.progressFill}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex gap-1">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className={`h-2 w-2 rounded-full ${styles.dot} animate-bounce`}
                  style={{ animationDelay: `${dot * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErnestThinkingIndicator;

