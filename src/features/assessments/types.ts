export type AssessmentStatus = 'pending' | 'sent' | 'received' | 'analysis' | 'answered' | 'overdue' | 'scheduled' | 'done';

export type AssessmentFieldType = 'text' | 'long_text' | 'number' | 'select' | 'radio' | 'checkbox' | 'paragraph';

export type AssessmentFilter = 'pending' | 'analysis' | 'done' | 'all';

export type AssessmentField = {
  id: string;
  label: string;
  description?: string;
  type: AssessmentFieldType;
  required: boolean;
  options?: string[];
};

export type AssessmentQuestionnaire = {
  id: string;
  title: string;
  description: string;
  questions: AssessmentField[];
  image_questions: AssessmentPhotoPose[];
  attachment_questions: AssessmentExam[];
};

export type AssessmentPhotoPose = {
  id: string;
  label: string;
  description: string;
  instruction?: string;
  position?: string;
  required: boolean;
};

export type AssessmentExam = {
  id: string;
  label: string;
  description: string;
  required: boolean;
};

export type AssessmentResult = {
  deliveredAt: string;
  coachMessage: string;
  trainingDecision: string;
  dietDecision: string;
  nextSteps: string[];
  nextAssessmentAt: string;
};

export type Assessment = {
  id: string;
  title: string;
  category: string;
  type?: string;
  status: AssessmentStatus;
  plan?: string;
  mesocycle?: string;
  professional?: { id?: string; _id?: string; name: string };
  due_date: string;
  submittedAt?: string;
  lastEvaluation?: string;
  nextEvaluation?: string;
  linkedDemand?: string;
  questionnaire: AssessmentQuestionnaire;
  result?: AssessmentResult;
};

export type AssessmentAnswerValue = string | string[];

export type AssessmentUploadAsset = {
  uri: string;
  name?: string;
  mimeType?: string;
};

export type AssessmentDraft = {
  answers: Record<string, AssessmentAnswerValue>;
  photos: Record<string, string | null>;
  exams: Record<string, AssessmentUploadAsset | string | null>;
  submitted: boolean;
};
