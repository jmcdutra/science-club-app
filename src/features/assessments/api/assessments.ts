import { apiClient } from '@/src/shared/api/apiClient';

export type QuestionnaireDTO = {
  id: string;
  title: string;
  type: string;
  description: string;
  questions: any[];
  image_questions: any[];
  attachment_questions: any[];
};

export type EvaluationDTO = {
  id: string;
  student: string;
  professional: { id?: string; _id?: string; name: string };
  workout_professional?: { id?: string; _id?: string; name: string };
  diet_professional?: { id?: string; _id?: string; name: string };
  questionnaire: QuestionnaireDTO;
  title: string;
  category: string;
  due_date: string;
  release_at?: string | null;
  status: 'scheduled' | 'pending' | 'answered' | 'analysis' | 'done' | 'overdue';
  answers: { question: string; answer: string }[];
  photos: { url: string; position: string; label: string }[];
  exams: { url: string; label: string }[];
  plan?: string;
  mesocycle?: string;
  result?: {
    deliveredAt: string;
    coachMessage: string;
    trainingDecision: string;
    dietDecision: string;
    nextSteps: string[];
    nextAssessmentAt: string;
  };
};

export async function getStudentEvaluations(token: string) {
  return apiClient<EvaluationDTO[]>('/api/evaluations/student', { token });
}

export async function getEvaluationById(token: string, id: string) {
  return apiClient<EvaluationDTO>(`/api/evaluations/${id}`, { token });
}

export async function createEvaluation(token: string, questionnaireId: string) {
  return apiClient<EvaluationDTO>('/api/evaluations', {
    method: 'POST',
    token,
    body: JSON.stringify({ questionnaireId }),
  });
}

export async function submitEvaluation(token: string, id: string, data: Partial<EvaluationDTO>) {
  return apiClient<EvaluationDTO>(`/api/evaluations/${id}/submit`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });
}

export async function uploadFile(token: string, uri: string, folder: string = 'general') {
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'upload.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image';

  formData.append('file', {
    uri,
    name: filename,
    type,
  } as any);
  formData.append('folder', folder);

  return apiClient<{ url: string }>('/api/upload', {
    method: 'POST',
    token,
    body: formData,
  });
}
