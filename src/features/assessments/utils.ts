import { Assessment, AssessmentAnswerValue, AssessmentDraft, AssessmentField } from './types';

export function getStatusLabel(status: Assessment['status']) {
  const labels: Record<Assessment['status'], string> = {
    pending: 'Pendente',
    sent: 'Disponível',
    received: 'Recebido',
    analysis: 'Em análise',
    answered: 'Em análise',
    overdue: 'Atrasada',
    scheduled: 'Agendada',
    done: 'Concluída'
  };

  return labels[status];
}

export function getStatusTone(status: Assessment['status']) {
  if (status === 'done') return { text: 'text-emerald-300', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', color: '#34D399' };
  if (status === 'overdue') return { text: 'text-red-200', bg: 'bg-red-500/10', border: 'border-red-500/20', color: '#FCA5A5' };
  if (status === 'sent' || status === 'scheduled' || status === 'pending' || status === 'answered' || status === 'analysis') return { text: 'text-amber-200', bg: 'bg-amber-300/10', border: 'border-amber-300/20', color: '#FCD34D' };
  return { text: 'text-brand-secondary', bg: 'bg-brand-primary/10', border: 'border-brand-primary/25', color: '#A78BFA' };
}

export function isAnswerFilled(value: AssessmentAnswerValue | undefined) {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value?.trim());
}

export function getRequiredMissing(assessment: Assessment, draft: AssessmentDraft) {
  const missingQuestions = assessment.questionnaire.questions.filter((field) => field.required && !isAnswerFilled(draft.answers[field.id || (field as any)._id]));
  return missingQuestions;
}

export function getQuestionnaireProgress(assessment: Assessment, draft: AssessmentDraft) {
  const fields = assessment.questionnaire.questions;
  const answered = fields.filter((field) => isAnswerFilled(draft.answers[field.id || (field as any)._id])).length;

  return {
    answered,
    total: fields.length,
    percent: fields.length ? Math.round((answered / fields.length) * 100) : 100,
  };
}

export function getPhotoProgress(assessment: Assessment, draft: AssessmentDraft) {
  const fields = assessment.questionnaire.image_questions;
  const done = fields.filter((pose: any) => draft.photos[pose.id || pose._id]).length;

  return {
    done,
    total: fields.length,
    percent: fields.length ? Math.round((done / fields.length) * 100) : 100,
  };
}

export function getExamProgress(assessment: Assessment, draft: AssessmentDraft) {
  const fields = assessment.questionnaire.attachment_questions;
  const done = fields.filter((exam: any) => draft.exams[exam.id || exam._id]).length;

  return {
    done,
    total: fields.length,
    percent: fields.length ? Math.round((done / fields.length) * 100) : 100,
  };
}

export function canSubmitAssessment(assessment: Assessment, draft: AssessmentDraft) {
  const questionsMissing = getRequiredMissing(assessment, draft).length === 0;
  
  const requiredPhotos = assessment.questionnaire.image_questions.filter(p => p.required);
  const photosDone = requiredPhotos.every(p => draft.photos[p.id || (p as any)._id]);

  const requiredExams = assessment.questionnaire.attachment_questions.filter(e => e.required);
  const examsDone = requiredExams.every(e => draft.exams[e.id || (e as any)._id]);

  return questionsMissing && photosDone && examsDone;
}

export function getAssessmentProgress(assessment: Assessment, draft: AssessmentDraft) {
  const questionnaire = getQuestionnaireProgress(assessment, draft).percent;
  const photos = getPhotoProgress(assessment, draft).percent;
  const exams = getExamProgress(assessment, draft).percent;
  return Math.round((questionnaire + photos + exams) / 3);
}

export function getFieldKeyboardType(field: AssessmentField) {
  return field.type === 'number' ? 'numeric' : 'default';
}

export function cleanText(text: string) {
  if (!text) return '';
  // Remove tudo que vem depois de * ou # (IDs técnicos)
  return text.split(/[#*]/)[0].trim();
}

export function formatAssessmentDate(dateValue?: string) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  });
}

export function formatAssessmentDateTime(dateValue?: string) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  const dateLabel = date.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  });
  const timeLabel = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
  return `${dateLabel} · ${timeLabel}`;
}

export function getResponsibleProfessionals(assessment: {
  professional?: { name?: string } | null;
  workout_professional?: { name?: string } | null;
  diet_professional?: { name?: string } | null;
}) {
  return [
    assessment.workout_professional?.name,
    assessment.diet_professional?.name,
    assessment.professional?.name,
  ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);
}
