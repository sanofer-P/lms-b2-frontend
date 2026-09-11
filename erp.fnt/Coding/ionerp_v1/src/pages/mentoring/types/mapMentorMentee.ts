// File: src/pages/mentoring/types/mapMentorMentee.ts

export interface MentoringGroup {
    mentors_group_id: number;
    academic_batch_id: number;
    config_type_id: number | null;
    questionnaire_id: number | null;
    group_title: string;          // Mapped from mentors_pgm_title
    term_count?: number;          // Added from your JSON
    mentors: {
        user_id?: number;
        name: string;
    }[];
    mentees: {
        user_id?: number;
        name: string;
    }[];
    session_status?: string;
    session_date?: string | null;

    // UI specific fields (make them optional to fix the TS error)
    id?: number;
    curriculum?: string;
    applicable_terms?: string;
    config_type?: string;
    questionnaire_title?: string;
}
