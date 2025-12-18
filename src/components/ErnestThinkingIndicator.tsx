import { useEffect, useMemo, useState } from "react";
import { BookOpen, Brain, PenSquare, Shield, Search, AlertTriangle, CheckCircle, FileText, Lock, Sparkles } from "lucide-react";

export const THINKING_STEPS = [
  { 
    label: "Lecture du message en cours…", 
    icon: <BookOpen className="h-5 w-5" />,
    description: "Je lis attentivement votre question pour bien la comprendre.",
    duration: 900 // Rapide - lecture simple
  },
  { 
    label: "Recherche d'informations…", 
    icon: <Search className="h-5 w-5" />,
    description: "Je consulte ma base de connaissances en cybersécurité.",
    duration: 1800 // Plus long - consultation de base de données
  },
  { 
    label: "Analyse de votre situation…", 
    icon: <Brain className="h-5 w-5" />,
    description: "J'analyse votre situation pour identifier les risques potentiels.",
    duration: 1400 // Moyen - traitement analytique
  },
  { 
    label: "Vérification des bonnes pratiques…", 
    icon: <CheckCircle className="h-5 w-5" />,
    description: "Je vérifie les recommandations officielles de sécurité.",
    duration: 1600 // Moyen-long - consultation de références
  },
  { 
    label: "Évaluation des risques…", 
    icon: <AlertTriangle className="h-5 w-5" />,
    description: "J'évalue les risques spécifiques à votre cas.",
    duration: 1300 // Moyen - évaluation
  },
  { 
    label: "Consultation des ressources…", 
    icon: <FileText className="h-5 w-5" />,
    description: "Je consulte les guides et ressources officiels disponibles.",
    duration: 2000 // Long - recherche approfondie
  },
  { 
    label: "Vérification de la sécurité…", 
    icon: <Shield className="h-5 w-5" />,
    description: "Je vérifie que les conseils sont sûrs et adaptés à votre situation.",
    duration: 1200 // Moyen - validation
  },
  { 
    label: "Protection des données…", 
    icon: <Lock className="h-5 w-5" />,
    description: "Je m'assure que les solutions respectent votre vie privée.",
    duration: 1000 // Rapide - vérification rapide
  },
  { 
    label: "Préparation de la réponse…", 
    icon: <PenSquare className="h-5 w-5" />,
    description: "Je prépare une réponse claire et adaptée à votre besoin.",
    duration: 1500 // Moyen - rédaction
  },
  { 
    label: "Finalisation…", 
    icon: <Sparkles className="h-5 w-5" />,
    description: "Je finalise ma réponse pour qu'elle soit simple et compréhensible.",
    duration: 800 // Rapide - dernière étape
  },
] as const;

export function useThinkingSteps(isThinking: boolean, intervalMs?: number) {
  const [step, setStep] = useState(0);
  const [randomizedOrder, setRandomizedOrder] = useState<number[]>([]);

  useEffect(() => {
    if (!isThinking) {
      setStep(0);
      setRandomizedOrder([]);
      return;
    }

    // Randomiser l'ordre des étapes au début de chaque session de thinking
    // Mais toujours finir par "Préparation de la réponse" (index 8) puis "Finalisation" (index 9)
    if (randomizedOrder.length === 0) {
      const preparationIndex = 8; // "Préparation de la réponse"
      const finalizationIndex = 9; // "Finalisation"
      
      // Randomiser seulement les étapes 0-7
      const middleSteps: number[] = Array.from({ length: THINKING_STEPS.length - 2 }, (_, i) => i);
      // Algorithme de Fisher-Yates pour mélanger
      for (let i = middleSteps.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = middleSteps[i]!;
        middleSteps[i] = middleSteps[j]!;
        middleSteps[j] = temp;
      }
      
      // Construire l'ordre final : étapes randomisées + préparation + finalisation
      const order: number[] = [...middleSteps, preparationIndex, finalizationIndex];
      setRandomizedOrder(order);
      // Initialiser avec la première étape randomisée
      if (order[0] !== undefined) {
        setStep(order[0]);
      }
    }
  }, [isThinking, randomizedOrder.length]);

  useEffect(() => {
    if (!isThinking || randomizedOrder.length === 0) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    let currentOrderIndex = 0;

    const advanceStep = () => {
      if (!isThinking || randomizedOrder.length === 0) return;
      
      currentOrderIndex = (currentOrderIndex + 1) % randomizedOrder.length;
      const actualStepIndex = randomizedOrder[currentOrderIndex];
      if (actualStepIndex !== undefined) {
        setStep(actualStepIndex);
        
        // Utiliser la durée spécifique de l'étape suivante, ou intervalMs si fourni
        const nextStep = THINKING_STEPS[actualStepIndex];
        const duration = intervalMs ?? (nextStep?.duration ?? 1500);
        
        timeoutId = setTimeout(advanceStep, duration);
      }
    };

    // Démarrer avec la durée de la première étape randomisée
    const firstStepIndex = randomizedOrder[0];
    if (firstStepIndex !== undefined) {
      const firstStep = THINKING_STEPS[firstStepIndex];
      const initialDuration = intervalMs ?? (firstStep?.duration ?? 1500);
      timeoutId = setTimeout(advanceStep, initialDuration);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isThinking, intervalMs, randomizedOrder]);

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
  const currentStep = THINKING_STEPS[stepIndex] || THINKING_STEPS[0];

  const styles = useMemo(() => {
    if (tone === "light") {
      return {
        container: "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100",
        spinner: "bg-white text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600",
        dot: "bg-blue-500 dark:bg-blue-400",
        progressBg: "bg-gray-200 dark:bg-gray-700",
        progressFill: "bg-blue-500 dark:bg-blue-400",
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
            {currentStep.description && (
              <span className="text-sm opacity-80 mt-1 leading-relaxed">{currentStep.description}</span>
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

