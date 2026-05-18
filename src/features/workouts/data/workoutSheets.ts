export type WorkoutSet = {
  id: string;
  label?: string;
  type?: string;
  reps: string;
  weight?: string;
  restSeconds?: number;
  duration?: string;
};

export type WorkoutExerciseVideo = {
  id: string;
  title: string;
  provider: 'own' | 'youtube' | 'reels' | 'tiktok';
  url: string;
  embedUrl?: string;
};

export type WorkoutExercise = {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  restSeconds: number;
  cue: string;
  description?: string;
  executionTips?: string[];
  videos?: WorkoutExerciseVideo[];
  coverUrl?: string | null;
  previous: string;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: string;
  title: string;
  type: string;
  days: string;
  estimatedMinutes: number;
  muscles: string[];
  exercises: WorkoutExercise[];
};

export type WorkoutSheet = {
  id: string;
  level: string;
  title: string;
  goal: string;
  coach: string;
  updatedAt: string;
  sessions: WorkoutSession[];
};

const upperLowerOneExercises: WorkoutExercise[] = [
  {
    id: 'abdominal-pernas-elevadas',
    name: 'Abdominal com Pernas Elevadas',
    muscle: 'Abdomen',
    equipment: 'Peso corporal',
    restSeconds: 45,
    cue: 'Suba o tronco sem puxar o pescoço e mantenha o abdomen travado.',
    previous: '3 series, 15 reps',
    sets: [
      { id: 'set-1', reps: '15' },
      { id: 'set-2', reps: '15' },
      { id: 'set-3', reps: '15' },
    ],
  },
  {
    id: 'cadeira-extensora',
    name: 'Cadeira Extensora',
    muscle: 'Quadriceps',
    equipment: 'Maquina',
    restSeconds: 60,
    cue: 'Segure um segundo no topo e desca controlando o movimento.',
    description: 'Exercicio isolado para quadriceps. Ideal para controlar amplitude, cadencia e progressao de carga sem roubar com o quadril.',
    executionTips: [
      'Ajuste o banco para alinhar o eixo da maquina ao joelho.',
      'Suba forte, segure um segundo no topo e desca em dois segundos.',
      'Evite tirar o quadril do encosto nas ultimas repeticoes.',
    ],
    videos: [
      {
        id: 'cadeira-extensora-youtube',
        title: 'Execucao guiada',
        provider: 'youtube',
        url: 'https://www.youtube.com/watch?v=YyvSfVjQeL0',
        embedUrl: 'https://www.youtube.com/embed/YyvSfVjQeL0',
      },
      {
        id: 'cadeira-extensora-reels',
        title: 'Reels do coach',
        provider: 'reels',
        url: 'https://www.instagram.com/reels/',
      },
    ],
    previous: '2 series, 15 reps, 35kg',
    sets: [
      { id: 'set-1', reps: '15', weight: '35kg' },
      { id: 'set-2', reps: '15', weight: '35kg' },
      { id: 'set-3', reps: '15', weight: '35kg' },
    ],
  },
  {
    id: 'abdominal-bola',
    name: 'Abdominal na Bola',
    muscle: 'Core',
    equipment: 'Bola suica',
    restSeconds: 45,
    cue: 'Use a bola para ampliar a amplitude, sem perder controle lombar.',
    previous: '3 series, 15 reps',
    sets: [
      { id: 'set-1', reps: '15' },
      { id: 'set-2', reps: '15' },
      { id: 'set-3', reps: '15' },
    ],
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    muscle: 'Pernas',
    equipment: 'Leg press 45',
    restSeconds: 75,
    cue: 'Pés firmes, joelhos acompanhando a ponta dos pés.',
    description: 'Movimento principal de pernas da ficha. Use como referencia para evolucao de carga, mantendo amplitude consistente.',
    executionTips: [
      'Mantenha lombar e quadril apoiados durante toda a repeticao.',
      'Nao trave os joelhos no topo.',
      'Anote a carga real se a maquina estiver diferente da ficha.',
    ],
    videos: [
      {
        id: 'leg-press-own',
        title: 'Video proprio Science',
        provider: 'own',
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        embedUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      },
    ],
    previous: '3 series, 15 reps, 120kg',
    sets: [
      { id: 'set-1', reps: '15', weight: '120kg' },
      { id: 'set-2', reps: '15', weight: '120kg' },
      { id: 'set-3', reps: '15', weight: '120kg' },
    ],
  },
  {
    id: 'puxada-frente',
    name: 'Puxada Frente no Pulley',
    muscle: 'Dorsais',
    equipment: 'Polia alta',
    restSeconds: 75,
    cue: 'Puxe pelo cotovelo e evite jogar o tronco para tras.',
    description: 'Puxada vertical para dorsais. O objetivo e sentir a escapula descer antes da puxada com os bracos.',
    executionTips: [
      'Comece o movimento deprimindo as escapulas.',
      'Puxe a barra ate a parte alta do peito.',
      'Mantenha tronco estavel, sem transformar em remada.',
    ],
    videos: [
      {
        id: 'puxada-tiktok',
        title: 'Referencia rapida',
        provider: 'tiktok',
        url: 'https://www.tiktok.com/',
      },
    ],
    previous: '3 series, 15 reps, 45kg',
    sets: [
      { id: 'set-1', reps: '15', weight: '45kg' },
      { id: 'set-2', reps: '15', weight: '45kg' },
      { id: 'set-3', reps: '15', weight: '45kg' },
    ],
  },
  {
    id: 'prancha',
    name: 'Prancha',
    muscle: 'Core',
    equipment: 'Peso corporal',
    restSeconds: 45,
    cue: 'Quadril alinhado e respiracao curta, sem relaxar o abdomen.',
    previous: '3 series, 20 seg',
    sets: [
      { id: 'set-1', reps: '20', duration: '20s' },
      { id: 'set-2', reps: '20', duration: '20s' },
      { id: 'set-3', reps: '20', duration: '20s' },
    ],
  },
  {
    id: 'remada-baixa',
    name: 'Remada Baixa na Polia',
    muscle: 'Dorsais',
    equipment: 'Polia baixa',
    restSeconds: 75,
    cue: 'Traga a alca para a linha do umbigo e mantenha o peito aberto.',
    previous: '3 series, 12 reps, 50kg',
    sets: [
      { id: 'set-1', reps: '12', weight: '50kg' },
      { id: 'set-2', reps: '12', weight: '50kg' },
      { id: 'set-3', reps: '12', weight: '50kg' },
    ],
  },
  {
    id: 'rosca-direta',
    name: 'Rosca Direta',
    muscle: 'Biceps',
    equipment: 'Barra W',
    restSeconds: 60,
    cue: 'Cotovelos fixos e subida sem impulso.',
    previous: '3 series, 12 reps, 20kg',
    sets: [
      { id: 'set-1', reps: '12', weight: '20kg' },
      { id: 'set-2', reps: '12', weight: '20kg' },
      { id: 'set-3', reps: '12', weight: '20kg' },
    ],
  },
  {
    id: 'triceps-corda',
    name: 'Triceps Corda',
    muscle: 'Triceps',
    equipment: 'Polia alta',
    restSeconds: 60,
    cue: 'Mantenha os cotovelos fixos e finalize abrindo a corda.',
    previous: '3 series, 12 reps, 30kg',
    sets: [
      { id: 'set-1', reps: '12', weight: '30kg' },
      { id: 'set-2', reps: '12', weight: '30kg' },
      { id: 'set-3', reps: '12', weight: '30kg' },
    ],
  },
  {
    id: 'desenvolvimento-halteres',
    name: 'Desenvolvimento com Halteres',
    muscle: 'Ombros',
    equipment: 'Halteres',
    restSeconds: 75,
    cue: 'Suba os halteres sem bater no topo e controle a descida.',
    previous: '3 series, 10 reps, 18kg',
    sets: [
      { id: 'set-1', reps: '10', weight: '18kg' },
      { id: 'set-2', reps: '10', weight: '18kg' },
      { id: 'set-3', reps: '10', weight: '18kg' },
    ],
  },
  {
    id: 'mesa-flexora',
    name: 'Mesa Flexora',
    muscle: 'Posterior',
    equipment: 'Maquina',
    restSeconds: 60,
    cue: 'Controle a volta e nao tire o quadril do apoio.',
    previous: '3 series, 15 reps, 40kg',
    sets: [
      { id: 'set-1', reps: '15', weight: '40kg' },
      { id: 'set-2', reps: '15', weight: '40kg' },
      { id: 'set-3', reps: '15', weight: '40kg' },
    ],
  },
  {
    id: 'panturrilha-leg',
    name: 'Panturrilha no Leg Press',
    muscle: 'Panturrilhas',
    equipment: 'Leg press',
    restSeconds: 45,
    cue: 'Use amplitude total e segure um segundo no pico.',
    previous: '4 series, 15 reps, 120kg',
    sets: [
      { id: 'set-1', reps: '15', weight: '120kg' },
      { id: 'set-2', reps: '15', weight: '120kg' },
      { id: 'set-3', reps: '15', weight: '120kg' },
      { id: 'set-4', reps: '15', weight: '120kg' },
    ],
  },
];

const upperLowerTwoExercises: WorkoutExercise[] = [
  {
    id: 'supino-reto',
    name: 'Supino Reto',
    muscle: 'Peitoral',
    equipment: 'Barra',
    restSeconds: 90,
    cue: 'Escapulas presas no banco e barra descendo controlada.',
    description: 'Movimento base de peitoral. Priorize estabilidade, toque consistente no peito e progressao pequena de carga.',
    executionTips: [
      'Pese a barra como parte da carga total.',
      'Pes firmes no chao e escapulas encaixadas.',
      'Pare a serie se perder o caminho da barra.',
    ],
    videos: [
      {
        id: 'supino-youtube',
        title: 'Tecnica de supino',
        provider: 'youtube',
        url: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
        embedUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg',
      },
    ],
    previous: '4 series, 8 reps, 70kg',
    sets: [
      { id: 'set-1', reps: '8', weight: '70kg' },
      { id: 'set-2', reps: '8', weight: '70kg' },
      { id: 'set-3', reps: '8', weight: '70kg' },
      { id: 'set-4', reps: '8', weight: '70kg' },
    ],
  },
  {
    id: 'stiff',
    name: 'Stiff com Barra',
    muscle: 'Posterior',
    equipment: 'Barra',
    restSeconds: 75,
    cue: 'Quadril para tras, coluna neutra e alongamento no posterior.',
    previous: '3 series, 10 reps, 60kg',
    sets: [
      { id: 'set-1', reps: '10', weight: '60kg' },
      { id: 'set-2', reps: '10', weight: '60kg' },
      { id: 'set-3', reps: '10', weight: '60kg' },
    ],
  },
  {
    id: 'elevacao-lateral',
    name: 'Elevacao Lateral',
    muscle: 'Ombros',
    equipment: 'Halteres',
    restSeconds: 60,
    cue: 'Suba ate a linha dos ombros sem encolher o trapezio.',
    previous: '3 series, 15 reps, 8kg',
    sets: [
      { id: 'set-1', reps: '15', weight: '8kg' },
      { id: 'set-2', reps: '15', weight: '8kg' },
      { id: 'set-3', reps: '15', weight: '8kg' },
    ],
  },
  {
    id: 'supino-inclinado-halteres',
    name: 'Supino Inclinado com Halteres',
    muscle: 'Peitoral',
    equipment: 'Halteres',
    restSeconds: 75,
    cue: 'Desca com controle e mantenha punhos alinhados.',
    previous: '3 series, 10 reps, 26kg',
    sets: [
      { id: 'set-1', reps: '10', weight: '26kg' },
      { id: 'set-2', reps: '10', weight: '26kg' },
      { id: 'set-3', reps: '10', weight: '26kg' },
    ],
  },
  {
    id: 'agachamento-goblet',
    name: 'Agachamento Goblet',
    muscle: 'Pernas',
    equipment: 'Kettlebell',
    restSeconds: 75,
    cue: 'Cotovelos apontando para baixo e tronco alto.',
    previous: '3 series, 12 reps, 28kg',
    sets: [
      { id: 'set-1', reps: '12', weight: '28kg' },
      { id: 'set-2', reps: '12', weight: '28kg' },
      { id: 'set-3', reps: '12', weight: '28kg' },
    ],
  },
  {
    id: 'remada-unilateral',
    name: 'Remada Unilateral',
    muscle: 'Dorsais',
    equipment: 'Haltere',
    restSeconds: 60,
    cue: 'Apoie bem o tronco e puxe o halter para a linha do quadril.',
    previous: '3 series, 12 reps, 28kg',
    sets: [
      { id: 'set-1', reps: '12', weight: '28kg' },
      { id: 'set-2', reps: '12', weight: '28kg' },
      { id: 'set-3', reps: '12', weight: '28kg' },
    ],
  },
  {
    id: 'afundo-bulgaro',
    name: 'Afundo Bulgaro',
    muscle: 'Pernas',
    equipment: 'Halteres',
    restSeconds: 75,
    cue: 'Desca verticalmente e mantenha o joelho estavel.',
    previous: '3 series, 10 reps, 16kg',
    sets: [
      { id: 'set-1', reps: '10', weight: '16kg' },
      { id: 'set-2', reps: '10', weight: '16kg' },
      { id: 'set-3', reps: '10', weight: '16kg' },
    ],
  },
  {
    id: 'crucifixo-maquina',
    name: 'Crucifixo na Maquina',
    muscle: 'Peitoral',
    equipment: 'Peck deck',
    restSeconds: 60,
    cue: 'Feche sem bater os pesos e alongue mantendo controle.',
    previous: '3 series, 15 reps, 45kg',
    sets: [
      { id: 'set-1', reps: '15', weight: '45kg' },
      { id: 'set-2', reps: '15', weight: '45kg' },
      { id: 'set-3', reps: '15', weight: '45kg' },
    ],
  },
  {
    id: 'elevacao-pelvica',
    name: 'Elevacao Pelvica',
    muscle: 'Gluteos',
    equipment: 'Barra',
    restSeconds: 75,
    cue: 'Trave no topo sem hiperestender a lombar.',
    previous: '4 series, 10 reps, 100kg',
    sets: [
      { id: 'set-1', reps: '10', weight: '100kg' },
      { id: 'set-2', reps: '10', weight: '100kg' },
      { id: 'set-3', reps: '10', weight: '100kg' },
      { id: 'set-4', reps: '10', weight: '100kg' },
    ],
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    muscle: 'Ombros',
    equipment: 'Polia alta',
    restSeconds: 60,
    cue: 'Puxe a corda na direcao do rosto e finalize com cotovelos altos.',
    previous: '3 series, 15 reps, 25kg',
    sets: [
      { id: 'set-1', reps: '15', weight: '25kg' },
      { id: 'set-2', reps: '15', weight: '25kg' },
      { id: 'set-3', reps: '15', weight: '25kg' },
    ],
  },
  {
    id: 'abdominal-infra-banco',
    name: 'Abdominal Infra no Banco',
    muscle: 'Abdomen',
    equipment: 'Banco',
    restSeconds: 45,
    cue: 'Eleve o quadril no final do movimento sem balancar as pernas.',
    previous: '3 series, 12 reps',
    sets: [
      { id: 'set-1', reps: '12' },
      { id: 'set-2', reps: '12' },
      { id: 'set-3', reps: '12' },
    ],
  },
  {
    id: 'passada-caminhando',
    name: 'Passada Caminhando',
    muscle: 'Pernas',
    equipment: 'Halteres',
    restSeconds: 75,
    cue: 'Passo longo, tronco alto e joelho da frente firme.',
    previous: '3 series, 12 reps, 18kg',
    sets: [
      { id: 'set-1', reps: '12', weight: '18kg' },
      { id: 'set-2', reps: '12', weight: '18kg' },
      { id: 'set-3', reps: '12', weight: '18kg' },
    ],
  },
];

export const workoutSheets: WorkoutSheet[] = [
  {
    id: 'science-base-resistencia',
    level: 'Iniciante',
    title: 'Base Science - Resistencia',
    goal: 'Full Body',
    coach: 'Prof. Marcos',
    updatedAt: 'Hoje, 09:30',
    sessions: [
      {
        id: 'cima-baixo-1',
        title: 'Cima e Baixo 1',
        type: 'Full Body',
        days: 'Segunda-feira, Quinta-feira',
        estimatedMinutes: 55,
        muscles: ['Core', 'Quadriceps', 'Dorsais', 'Biceps'],
        exercises: upperLowerOneExercises,
      },
      {
        id: 'cima-baixo-2',
        title: 'Cima e Baixo 2',
        type: 'Full Body',
        days: 'Terca-feira, Sexta-feira',
        estimatedMinutes: 74,
        muscles: ['Peitoral', 'Posterior', 'Ombros', 'Gluteos'],
        exercises: upperLowerTwoExercises,
      },
    ],
  },
  {
    id: 'hipertrofia-fase-2',
    level: 'Intermediario',
    title: 'Hipertrofia - Fase 2',
    goal: 'ABCD',
    coach: 'Prof. Julia',
    updatedAt: 'Ontem, 14:00',
    sessions: [
      {
        id: 'costas-biceps',
        title: 'Costas e Biceps',
        type: 'Upper',
        days: 'Segunda-feira',
        estimatedMinutes: 58,
        muscles: ['Dorsais', 'Biceps'],
        exercises: upperLowerOneExercises.slice(4, 10),
      },
      {
        id: 'peito-ombro-triceps',
        title: 'Peito, Ombro e Triceps',
        type: 'Push',
        days: 'Terca-feira',
        estimatedMinutes: 64,
        muscles: ['Peitoral', 'Ombros', 'Triceps'],
        exercises: [
          upperLowerTwoExercises[0],
          upperLowerTwoExercises[3],
          upperLowerTwoExercises[7],
          upperLowerTwoExercises[2],
          upperLowerTwoExercises[9],
          upperLowerOneExercises[8],
        ],
      },
      {
        id: 'pernas-completo',
        title: 'Pernas Completo',
        type: 'Lower',
        days: 'Quinta-feira',
        estimatedMinutes: 72,
        muscles: ['Pernas', 'Posterior', 'Gluteos'],
        exercises: [
          upperLowerOneExercises[3],
          upperLowerTwoExercises[4],
          upperLowerTwoExercises[6],
          upperLowerOneExercises[10],
          upperLowerTwoExercises[8],
          upperLowerOneExercises[11],
          upperLowerTwoExercises[11],
        ],
      },
    ],
  },
];

export function getWorkoutSheet(sheetId: string) {
  return workoutSheets.find((sheet) => sheet.id === sheetId) ?? workoutSheets[0];
}

export function getWorkoutSession(sheetId: string, sessionId?: string) {
  const sheet = getWorkoutSheet(sheetId);
  return sheet.sessions.find((session) => session.id === sessionId) ?? sheet.sessions[0];
}

export function getTotalSets(session: WorkoutSession) {
  return session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
}
