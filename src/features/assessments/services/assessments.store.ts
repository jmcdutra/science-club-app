import { create } from 'zustand';

import { mockAssessments } from '../data/assessments';
import { Assessment, AssessmentAnswerValue, AssessmentDraft, AssessmentUploadAsset } from '../types';

type AssessmentsStore = {
  assessments: Assessment[];
  drafts: Record<string, AssessmentDraft>;
  setAnswer: (assessmentId: string, fieldId: string, value: AssessmentAnswerValue) => void;
  toggleCheckboxAnswer: (assessmentId: string, fieldId: string, option: string) => void;
  setPhoto: (assessmentId: string, poseId: string, uri: string | null) => void;
  setExam: (assessmentId: string, examId: string, asset: AssessmentUploadAsset | string | null) => void;
  initializeDraft: (assessment: Assessment) => void;
  submitAssessment: (assessmentId: string) => void;
};

export function createAssessmentDraft(assessment: Assessment): AssessmentDraft {
  const submitted = assessment.status === 'received' || assessment.status === 'analysis' || assessment.status === 'answered';
  
  const photos = Object.fromEntries(
    (assessment.questionnaire?.image_questions || []).map((pose) => [
      pose.id, 
      submitted ? 'mock-photo-uri' : null
    ])
  );

  const exams = Object.fromEntries(
    (assessment.questionnaire?.attachment_questions || []).map((exam) => [
      exam.id, 
      submitted ? 'mock-exam-uri' : null
    ])
  );

  const questions = assessment.questionnaire?.questions || [];
  
  const answers = Object.fromEntries(
    questions.map((field) => {
      if (!submitted) return [field.id, field.type === 'checkbox' ? [] : ''];
      if (field.type === 'checkbox') return [field.id, field.options?.slice(0, 2) ?? []];
      if (field.type === 'number') return [field.id, '4'];
      if (field.type === 'select' || field.type === 'radio') return [field.id, field.options?.[0] ?? 'Respondido'];
      return [field.id, 'Respondido no envio anterior.'];
    })
  );

  return {
    answers,
    photos,
    exams,
    submitted,
  };
}

function ensureDraft(drafts: Record<string, AssessmentDraft>, assessment: Assessment) {
  return drafts[assessment.id] ?? createAssessmentDraft(assessment);
}

export const useAssessmentsStore = create<AssessmentsStore>((set, get) => ({
  assessments: mockAssessments,
  drafts: Object.fromEntries(mockAssessments.map((assessment) => [assessment.id, createAssessmentDraft(assessment)])),
  setAnswer: (assessmentId, fieldId, value) =>
    set((state) => {
      const draft = state.drafts[assessmentId];
      if (!draft || draft.submitted) return state;

      return {
        drafts: {
          ...state.drafts,
          [assessmentId]: {
            ...draft,
            answers: {
              ...draft.answers,
              [fieldId]: value,
            },
          },
        },
      };
    }),
  toggleCheckboxAnswer: (assessmentId, fieldId, option) =>
    set((state) => {
      const draft = state.drafts[assessmentId];
      if (!draft || draft.submitted) return state;
      const current = draft.answers[fieldId];
      const values = Array.isArray(current) ? current : [];
      const nextValues = values.includes(option) ? values.filter((item) => item !== option) : [...values, option];

      return {
        drafts: {
          ...state.drafts,
          [assessmentId]: {
            ...draft,
            answers: {
              ...draft.answers,
              [fieldId]: nextValues,
            },
          },
        },
      };
    }),
  setPhoto: (assessmentId, poseId, uri) =>
    set((state) => {
      const draft = state.drafts[assessmentId];
      if (!draft || draft.submitted) return state;

      return {
        drafts: {
          ...state.drafts,
          [assessmentId]: {
            ...draft,
            photos: {
              ...draft.photos,
              [poseId]: uri,
            },
          },
        },
      };
    }),
  setExam: (assessmentId, examId, asset) =>
    set((state) => {
      const draft = state.drafts[assessmentId];
      if (!draft || draft.submitted) return state;

      return {
        drafts: {
          ...state.drafts,
          [assessmentId]: {
            ...draft,
            exams: {
              ...draft.exams,
              [examId]: asset,
            },
          },
        },
      };
    }),
  initializeDraft: (assessment) =>
    set((state) => {
      if (state.drafts[assessment.id]) return state;
      return {
        drafts: {
          ...state.drafts,
          [assessment.id]: createAssessmentDraft(assessment),
        },
      };
    }),
  submitAssessment: (assessmentId) =>
    set((state) => {
      const draft = state.drafts[assessmentId];
      if (!draft) return state;

      return {
        drafts: {
          ...state.drafts,
          [assessmentId]: {
            ...draft,
            submitted: true,
          },
        },
      };
    }),
}));

export function getAssessmentSnapshot(id: string) {
  const state = useAssessmentsStore.getState();
  const assessment = state.assessments.find((item) => item.id === id) ?? state.assessments[0];
  return {
    assessment,
    draft: state.drafts[assessment.id] ?? createAssessmentDraft(assessment),
  };
}
