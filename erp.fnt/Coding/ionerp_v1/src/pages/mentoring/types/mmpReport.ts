export interface CurriculumItem {
    curriculum_id: number;
    curriculum_code: string;
    curriculum_desc: string;
}

export interface SemesterItem {
    semester_id: number;
    semester: number;
    semester_desc: string;
}

export interface GroupItem {
    mentors_group_id: number;
    mentors_pgm_title: string;
    questionnaire_id: number;
    mentors: any[];
}

export interface MenteeItem {
    student_id: number;
    student_name: string;
    student_usn?: string;
    student_email?: string;
}

export interface SessionData {
    schedule_id: number;
    curriculum_id: number;
    group_name: string;
    semester_id: number;
    questionnaire_id: number;
    session_agenda: string;
    sub_groups: {
        sub_group_name: string;
        location: string;
        dates?: {
        start_date: string;
        end_date: string;
        start_time: string;
        end_time: string;
        }[];
    }[];
}

export interface QuestionnaireAnswer {
    questionnaire_que_id: number;
    question_text: string;
    text_answer: string;
    selected_options: {
        questionnaire_options_id: number;
        option_text?: string;
        specification: string;
    }[];
}

export interface StudentSessionReport {
    session: SessionData;
    response: {
        submitted_at: string;
        answers: QuestionnaireAnswer[];
    } | null;
    comments: {
        sender_name: string;
        comment: string;
        created_date: string;
        scope?: "common" | "individual";
        attachment?: string | null;
    }[];
}

export interface MmpReportResponse {
    student: MenteeItem;
    curriculum: {
        academic_batch_id: number;
        academic_batch_code?: string;
        academic_batch_desc?: string;
    };
    group: {
        mentors_group_id: number;
        mentors_pgm_title: string;
    };
    term: {
        semester_id: number;
        semester_desc?: string;
        term_name?: string;
    };
    mentors: { mentor_id: number; mentor_name: string }[];
    sessions: (SessionData & {
        response: StudentSessionReport["response"];
        comments: StudentSessionReport["comments"];
    })[];
    questionnaire_responses: (QuestionnaireAnswer & {
        schedule_id: number;
        submitted_at?: string;
    })[];
    suggestions: (StudentSessionReport["comments"][number] & {
        schedule_id: number;
    })[];
}
