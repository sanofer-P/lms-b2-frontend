import React, { useEffect, useState } from "react";
import MentoringPageLayout from "./MentoringPageLayout";
import {
    FaPencilAlt,
    FaTrash,
    FaPlus,
    FaCaretDown,
} from "react-icons/fa";
import { FaFileExport } from "react-icons/fa6";
import { toast } from "react-toastify";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
    MOCK_MMP_QUESTIONS,
    FIELD_SETTING_OPTIONS,
} from "./types/questionnaire";

/* =========================================================
   TYPES
========================================================= */

interface QuestionnaireListItem {
    questionnaire_id: number;
    questionnaire_name: string;
    message_to_mentees: string | null;
    access_level: number;
    parent_id: number | null;
    questions: QuestionState[];
}

interface OptionState {
    questionnaire_options_id: number | null;
    que_option: string;
    specify_flag: boolean;
}

interface QuestionState {
    id: number;

    questionnaire_que_id: number | null;

    que_type_id: number;
    que_no: number;

    question: string;

    questionnaire_type_id: number;

    que_is_mandatory: boolean;

    options: OptionState[];

    typeError: string;
    textError: string;
    optionError: string;
}

interface QuestionBlockProps {
    question: QuestionState;
    index: number;

    updateCreateQuestion: (
        questionId: number,
        field:
            | "question"
            | "que_type_id"
            | "questionnaire_type_id"
            | "que_is_mandatory",
        value: string | number | boolean
    ) => void;

    handleQuestionTypeChange: (
        questionId: number,
        value: number
    ) => void;

    updateOption: (
        questionId: number,
        optionIndex: number,
        value: string
    ) => void;

    addOption: (
        questionId: number
    ) => void;

    removeOption: (
        questionId: number,
        optionIndex: number
    ) => void;

    removeCreateQuestion: (
        questionId: number
    ) => void;

    createQuestionsLength: number;
}

/* =========================================================
   CONSTANTS
========================================================= */

const QUESTION_TYPES = [
    {
        id: 1,
        name: "single select",
    },
    {
        id: 2,
        name: "multiple select",
    },
    {
        id: 3,
        name: "open-ended",
    },
];

const QUESTIONNAIRE_TYPES = [
    {
        id: 1,
        name: "self Assessment/Personal questionaire",
    },
    {
        id: 2,
        name: "Academic and Non Academic skills",
    },
];

/* =========================================================
   CREATE EMPTY OPTION
========================================================= */

const createEmptyOption = (): OptionState => ({
    questionnaire_options_id: null,
    que_option: "",
    specify_flag: false,
});

/* =========================================================
   CREATE EMPTY QUESTION
========================================================= */

const createEmptyQuestion = (
    questionNo: number
): QuestionState => ({
    id: Date.now() + Math.random(),

    questionnaire_que_id: null,

    que_type_id: 0,

    que_no: questionNo,

    question: "",

    questionnaire_type_id: 0,

    que_is_mandatory: true,

    options: [],

    typeError: "",

    textError: "",

    optionError: "",
});

/* =========================================================
   COMPONENT
========================================================= */

const QuestionBlock: React.FC<QuestionBlockProps> = ({
    question,
    index,
    updateCreateQuestion,
    handleQuestionTypeChange,
    updateOption,
    addOption,
    removeOption,
    removeCreateQuestion,
    createQuestionsLength,
}) => {

    return (
        <div
            className="
                border border-gray-300
                dark:border-gray-600
                rounded
                p-4
                flex flex-col
                gap-4
                mt-2
                bg-white
                dark:bg-gray-800/50
                shadow-sm
                max-w-5xl
            "
        >

            {/* QUESTION HEADER */}

            <div
                className="
                    flex
                    flex-wrap
                    gap-4
                    items-start
                "
            >

                {/* QUESTION NUMBER */}

                <input
                    type="text"
                    value={question.que_no}
                    readOnly
                    className="
                        w-12
                        text-center
                        text-gray-700
                        dark:text-gray-300
                        border
                        border-gray-300
                        dark:border-gray-600
                        rounded
                        px-2
                        py-1.5
                        text-[13px]
                        bg-white
                        dark:bg-gray-700
                    "
                />

                {/* QUESTION TYPE */}

                <div className="flex flex-col">

                    <select
                        value={question.que_type_id || ""}
                        onChange={(e) =>
                            handleQuestionTypeChange(
                                question.id,
                                Number(e.target.value)
                            )
                        }
                        className="
                            w-64
                            px-3
                            py-1.5
                            text-[13px]
                            text-gray-700
                            dark:text-gray-300
                            bg-white
                            dark:bg-gray-700
                            border
                            border-blue-400
                            dark:border-blue-500
                            rounded
                            focus:outline-none
                            shadow-sm
                        "
                    >

                        <option value="">
                            Select Question Type
                        </option>

                        {QUESTION_TYPES.map((type) => (
                            <option
                                key={type.id}
                                value={type.id}
                            >
                                {type.name}
                            </option>
                        ))}

                    </select>

                    {question.typeError && (
                        <span
                            className="
                                text-red-500
                                text-[11px]
                                mt-1
                            "
                        >
                            {question.typeError}
                        </span>
                    )}

                </div>

                {/* QUESTIONNAIRE TYPE */}

                <select
                    value={
                        question.questionnaire_type_id || ""
                    }
                    onChange={(e) =>
                        updateCreateQuestion(
                            question.id,
                            "questionnaire_type_id",
                            Number(e.target.value)
                        )
                    }
                    className="
                        w-64
                        border
                        border-gray-300
                        dark:border-gray-600
                        rounded
                        px-3
                        py-1.5
                        text-[13px]
                        text-gray-500
                        dark:text-gray-400
                        bg-white
                        dark:bg-gray-700
                        focus:outline-none
                    "
                >

                    <option value="">
                        Select questionnaire type
                    </option>

                    {QUESTIONNAIRE_TYPES.map((type) => (
                        <option
                            key={type.id}
                            value={type.id}
                        >
                            {type.name}
                        </option>
                    ))}

                </select>

            </div>

            {/* QUESTION TEXT */}

            <div
                className="
                    flex
                    flex-col
                    gap-1
                "
            >

                <textarea
                    rows={3}
                    maxLength={2000}
                    value={question.question}
                    onChange={(e) =>
                        updateCreateQuestion(
                            question.id,
                            "question",
                            e.target.value
                        )
                    }
                    placeholder="Enter Question"
                    className="
                        w-full
                        px-3
                        py-1.5
                        text-[13px]
                        bg-white
                        dark:bg-gray-700
                        text-gray-700
                        dark:text-gray-200
                        border
                        border-gray-300
                        dark:border-gray-600
                        rounded
                        focus:outline-none
                        focus:border-blue-400
                        shadow-sm
                        resize-y
                    "
                />

                <div
                    className="
                        flex
                        justify-between
                        items-start
                        mt-1
                    "
                >

                    <div
                        className="
                            text-red-500
                            text-[11px]
                        "
                    >
                        {question.textError}
                    </div>

                    <div
                        className="
                            text-right
                            text-[11px]
                            text-[#337ab7]
                            dark:text-blue-400
                            font-medium
                        "
                    >
                        {question.question.length} / 2000 characters
                    </div>

                </div>

            </div>

            {/* OPTIONS */}

            {(question.que_type_id === 1 ||
                question.que_type_id === 2) && (

                <div
                    className="
                        border-t
                        border-gray-200
                        dark:border-gray-700
                        pt-3
                    "
                >

                    <label
                        className="
                            text-[13px]
                            font-bold
                            text-gray-800
                            dark:text-gray-200
                            block
                            mb-2
                        "
                    >
                        Options
                    </label>

                    {question.options.map(
                        (option, optionIndex) => (

                            <div
                                key={
                                    option.questionnaire_options_id ??
                                    `${question.id}-${optionIndex}`
                                }
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    mb-2
                                "
                            >

                                <input
                                    type="text"
                                    value={option.que_option}
                                    onChange={(e) =>
                                        updateOption(
                                            question.id,
                                            optionIndex,
                                            e.target.value
                                        )
                                    }
                                    placeholder={`Option ${
                                        optionIndex + 1
                                    }`}
                                    className="
                                        flex-1
                                        border
                                        border-gray-300
                                        dark:border-gray-600
                                        rounded
                                        px-3
                                        py-1.5
                                        text-[13px]
                                        bg-white
                                        dark:bg-gray-700
                                        text-gray-700
                                        dark:text-gray-200
                                        focus:outline-none
                                        focus:border-blue-400
                                    "
                                />

                                {optionIndex === 0 ? (

                                    <button
                                        type="button"
                                        onClick={() =>
                                            addOption(
                                                question.id
                                            )
                                        }
                                        className="
                                            w-8
                                            h-8
                                            rounded-full
                                            text-white
                                            font-bold
                                            text-lg
                                            leading-none
                                            flex
                                            items-center
                                            justify-center
                                            shadow-sm
                                            bg-[#337ab7]
                                            hover:bg-[#286090]
                                        "
                                        title="Add option"
                                    >
                                        +
                                    </button>

                                ) : (

                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeOption(
                                                question.id,
                                                optionIndex
                                            )
                                        }
                                        disabled={
                                            question.options.length <= 2
                                        }
                                        className="
                                            w-8
                                            h-8
                                            rounded-full
                                            text-white
                                            font-bold
                                            text-lg
                                            leading-none
                                            flex
                                            items-center
                                            justify-center
                                            shadow-sm
                                            bg-[#d9534f]
                                            hover:bg-[#c9302c]
                                            disabled:opacity-50
                                        "
                                        title="Remove option"
                                    >
                                        −
                                    </button>

                                )}

                            </div>

                        )
                    )}

                    {question.optionError && (
                        <div
                            className="
                                text-red-500
                                text-[11px]
                                mt-1
                            "
                        >
                            {question.optionError}
                        </div>
                    )}

                </div>
            )}

            {/* MANDATORY + DELETE */}

            <div
                className="
                    flex
                    items-center
                    justify-between
                "
            >

                <div
                    className="
                        flex
                        items-center
                        gap-3
                    "
                >

                    <label
                        className="
                            text-[13px]
                            font-bold
                            text-gray-800
                            dark:text-gray-200
                        "
                    >
                        Mandatory:
                    </label>

                    <input
                        type="checkbox"
                        checked={
                            question.que_is_mandatory
                        }
                        onChange={(e) =>
                            updateCreateQuestion(
                                question.id,
                                "que_is_mandatory",
                                e.target.checked
                            )
                        }
                        className="
                            h-3.5
                            w-3.5
                            text-blue-600
                            rounded
                            border-gray-300
                            focus:ring-blue-500
                        "
                    />

                </div>

                {createQuestionsLength > 1 && (

                    <button
                        type="button"
                        onClick={() =>
                            removeCreateQuestion(
                                question.id
                            )
                        }
                        className="
                            w-8
                            h-8
                            rounded-full
                            text-white
                            flex
                            items-center
                            justify-center
                            bg-[#d9534f]
                            hover:bg-[#c9302c]
                        "
                        title="Remove question"
                    >
                        <FaTrash size={11} />
                    </button>

                )}

            </div>

        </div>
    );
};

const QuestionnairePage: React.FC = () => {

    /* =====================================================
       PAGE STATES
    ===================================================== */

    useEffect(() => {
        fetchQuestionnaires();
    }, []);

    const [questionnaires, setQuestionnaires] = useState<QuestionnaireListItem[]>([]);
    const [isLoadingQuestionnaires, setIsLoadingQuestionnaires] = useState(false);
    const [selectedQuestionnaireId, setSelectedQuestionnaireId] =
    useState<number | null>(null);

    const [selectedTitle, setSelectedTitle] = useState("");

    const [isAddingMore, setIsAddingMore] = useState(false);

    /* =====================================================
       QUESTIONNAIRE DETAILS
    ===================================================== */

    const [createTitle, setCreateTitle] = useState("");

    const [messageToMentees, setMessageToMentees] =
        useState("");

    const [titleError, setTitleError] =
        useState("");

    const [messageError, setMessageError] =
        useState("");

    // Edit Mode
    const [isEditingQuestion, setIsEditingQuestion] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

    /* =====================================================
       QUESTIONS
    ===================================================== */

    const [createQuestions, setCreateQuestions] =
        useState<QuestionState[]>([
            createEmptyQuestion(1),
        ]);

    /* =====================================================
       LOADING
    ===================================================== */

    const [isSaving, setIsSaving] =
        useState(false);

    /* =====================================================
       CREATE MODE
    ===================================================== */

    const isCreating =
        selectedTitle === "Create Questionnaire";

    const isFormMode =
        isCreating ||
        isAddingMore ||
        isEditingQuestion;

    /* =====================================================
       SELECT QUESTIONNAIRE
    ===================================================== */

    const selectedQuestionnaire =
    questionnaires.find(
        (questionnaire) =>
            questionnaire.questionnaire_id ===
            selectedQuestionnaireId
    );
    
    const handleEditQuestion = (question: QuestionState) => {
        if (!selectedQuestionnaire) {
            toast.error("Please select a questionnaire");
            return;
        }

        setIsEditingQuestion(true);
        setEditingQuestionId(question.questionnaire_que_id);

        setCreateTitle(selectedQuestionnaire.questionnaire_name);
        setMessageToMentees(
            selectedQuestionnaire.message_to_mentees || ""
        );

        setCreateQuestions([
            {
                ...question,
                id: Date.now() + Math.random(),

                options: question.options
                    ? question.options.map((option) => ({
                        questionnaire_options_id:
                            option.questionnaire_options_id,

                        que_option: option.que_option,

                        specify_flag:
                            option.specify_flag,
                    }))
                    : [],

                typeError: "",
                textError: "",
                optionError: "",
            },
        ]);

        setSelectedTitle("Create Questionnaire");
    };

    const handleDeleteQuestion = async (
        question: QuestionState
    ) => {
        if (!question.questionnaire_que_id) {
            toast.error("Question ID is missing");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this question?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/lms_mmp_questionnaire/delete_question/${question.questionnaire_que_id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const result = await response.json();

            console.log(
                "DELETE QUESTION RESPONSE:",
                result
            );

            if (!response.ok) {
                throw new Error(
                    result?.detail ||
                    result?.message ||
                    "Failed to delete question"
                );
            }

            if (!result.status) {
                throw new Error(
                    result?.message ||
                    "Failed to delete question"
                );
            }

            toast.success(
                "Question deleted successfully"
            );

            /*
            * Reload questionnaire list.
            * This assumes your questionnaire_list API
            * returns questions inside each questionnaire.
            */
            await fetchQuestionnaires();

        } catch (error: any) {

            console.error(
                "Delete question error:",
                error
            );

            toast.error(
                error?.message ||
                "Failed to delete question"
            );
        }
    };

    /* =========================================================
    EXPORT QUESTIONNAIRE TO PDF
    ========================================================= */

    const handleExportPDF = () => {

        if (!selectedQuestionnaire) {
            toast.error("Please select a questionnaire first");
            return;
        }

        const questionnaire = selectedQuestionnaire;

        try {

            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            /* =====================================================
            HEADER
            ===================================================== */

            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);

            doc.text(
                "IonIdea Institute of Technology and Management",
                pageWidth / 2,
                15,
                {
                    align: "center",
                }
            );

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            doc.text(
                "IonIdea Institute of Technology and Management, Bangalore",
                pageWidth / 2,
                21,
                {
                    align: "center",
                }
            );

            doc.text(
                "Department of Computer Science & Engineering",
                pageWidth / 2,
                27,
                {
                    align: "center",
                }
            );

            /* =====================================================
            REPORT TITLE
            ===================================================== */

            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);

            doc.text(
                "Questionnaire Questions Report",
                pageWidth / 2,
                38,
                {
                    align: "center",
                }
            );

            /* =====================================================
            QUESTIONNAIRE DETAILS
            ===================================================== */

            let currentY = 49;

            doc.setFontSize(10);

            doc.setFont("helvetica", "bold");

            doc.text(
                "Questionnaire Title:",
                15,
                currentY
            );

            doc.setFont("helvetica", "normal");

            doc.text(
                questionnaire.questionnaire_name || "-",
                52,
                currentY
            );

            currentY += 7;

            doc.setFont("helvetica", "bold");

            doc.text(
                "Message to Mentees:",
                15,
                currentY
            );

            doc.setFont("helvetica", "normal");

            const message =
                questionnaire.message_to_mentees || "-";

            const messageLines = doc.splitTextToSize(
                message,
                pageWidth - 67
            );

            doc.text(
                messageLines,
                52,
                currentY
            );

            currentY +=
                Math.max(
                    7,
                    messageLines.length * 5
                );

            /* =====================================================
            FIELD SETTING
            ===================================================== */

            currentY += 3;

            doc.setFont("helvetica", "bold");

            doc.text(
                "Field Setting:",
                15,
                currentY
            );

            doc.setFont("helvetica", "normal");

            doc.text(
                "Allow to add / modify / delete Questionnaire",
                42,
                currentY
            );

            currentY += 8;

            /* =====================================================
            TABLE DATA
            ===================================================== */

            const tableRows: any[] = [];

            questionnaire.questions.forEach(
                (question) => {

                    let questionText =
                        question.question || "";

                    let optionsText = "";

                    if (
                        (question.que_type_id === 1 ||
                            question.que_type_id === 2) &&
                        question.options &&
                        question.options.length > 0
                    ) {

                        optionsText =
                            question.options
                                .map(
                                    (
                                        option,
                                        index
                                    ) =>
                                        `${String.fromCharCode(
                                            65 + index
                                        )}. ${option.que_option}`
                                )
                                .join("\n");
                    }

                    tableRows.push([
                        question.que_no,
                        `${questionText}${
                            optionsText
                                ? "\n\n" + optionsText
                                : ""
                        }`,
                    ]);
                }
            );

            /* =====================================================
            QUESTION TABLE
            ===================================================== */

            autoTable(doc, {
                startY: currentY,

                head: [
                    [
                        "Q. No.",
                        "Questions",
                    ],
                ],

                body: tableRows,

                theme: "grid",

                styles: {
                    font: "helvetica",
                    fontSize: 9,
                    cellPadding: 3,
                    valign: "top",
                    lineWidth: 0.1,
                    overflow: "linebreak",
                },

                headStyles: {
                    fontStyle: "bold",
                    halign: "center",
                    valign: "middle",
                },

                columnStyles: {
                    0: {
                        cellWidth: 20,
                        halign: "center",
                    },

                    1: {
                        cellWidth: "auto",
                    },
                },

                didParseCell: (data) => {

                    if (
                        data.section === "body" &&
                        data.column.index === 1
                    ) {

                        data.cell.styles.fontSize = 9;
                    }
                },

                margin: {
                    left: 15,
                    right: 15,
                    top: 15,
                    bottom: 20,
                },

                didDrawPage: () => {

                    /* =================================================
                    FOOTER
                    ================================================= */

                    const footerY =
                        pageHeight - 10;

                    doc.setFont(
                        "helvetica",
                        "normal"
                    );

                    doc.setFontSize(8);

                    doc.text(
                        "Powered by www.ioncudos.com",
                        15,
                        footerY
                    );

                    const pageNumber =
                        doc.getNumberOfPages();

                    doc.text(
                        String(pageNumber),
                        pageWidth - 15,
                        footerY,
                        {
                            align: "right",
                        }
                    );
                },
            });

            /* =====================================================
            FILE NAME
            ===================================================== */

            const safeTitle =
                questionnaire.questionnaire_name
                    ?.replace(
                        /[^a-zA-Z0-9-_]/g,
                        "_"
                    ) ||
                "Questionnaire";

            const date =
                new Date()
                    .toISOString()
                    .slice(0, 10);

            const fileName =
                `Questionnaire_Questions_Report_${safeTitle}_${date}.pdf`;

            /* =====================================================
            SAVE
            ===================================================== */

            doc.save(fileName);

            toast.success(
                "Questionnaire PDF exported successfully"
            );

        } catch (error) {

            console.error(
                "PDF export error:",
                error
            );

            toast.error(
                "Failed to export questionnaire PDF"
            );
        }
    };

    const handleTitleChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {

        const value = e.target.value;

        /* =========================================
        CREATE QUESTIONNAIRE
        ========================================= */

        if (value === "create") {

            setSelectedQuestionnaireId(null);

            setSelectedTitle(
                "Create Questionnaire"
            );

            setIsAddingMore(false);

            setIsEditingQuestion(false);

            setEditingQuestionId(null);

            return;
        }

        /* =========================================
        CLEAR SELECTION
        ========================================= */

        if (!value) {

            setSelectedQuestionnaireId(null);

            setSelectedTitle("");

            setIsAddingMore(false);

            setIsEditingQuestion(false);

            setEditingQuestionId(null);

            return;
        }

        /* =========================================
        EXISTING QUESTIONNAIRE
        ========================================= */

        const questionnaireId =
            Number(value);

        const questionnaire =
            questionnaires.find(
                (item) =>
                    item.questionnaire_id ===
                    questionnaireId
            );

        if (!questionnaire) {
            return;
        }

        setSelectedQuestionnaireId(
            questionnaireId
        );

        setSelectedTitle(
            questionnaire.questionnaire_name
        );

        setIsAddingMore(false);

        setIsEditingQuestion(false);

        setEditingQuestionId(null);
    };

    const fetchQuestionnaires = async () => {
        setIsLoadingQuestionnaires(true);

        try {

            const response = await fetch(
                "http://127.0.0.1:8000/lms_mmp_questionnaire/questionnaire_list",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const result = await response.json();

            console.log(
                "QUESTIONNAIRE LIST RESPONSE:",
                result
            );

            if (!response.ok) {
                throw new Error(
                    result?.detail ||
                    result?.message ||
                    "Failed to fetch questionnaires"
                );
            }

            if (!result.status) {
                throw new Error(
                    result.message ||
                    "Failed to fetch questionnaires"
                );
            }

            setQuestionnaires(
                result.data || []
            );

        } catch (error: any) {

            console.error(
                "Fetch questionnaire error:",
                error
            );

            toast.error(
                error?.message ||
                "Failed to load questionnaires"
            );

        } finally {

            setIsLoadingQuestionnaires(false);

        }
    };

    /* =====================================================
       ADD QUESTION
    ===================================================== */

    const addCreateQuestion = () => {

        setCreateQuestions((prev) => [
            ...prev,
            createEmptyQuestion(prev.length + 1),
        ]);
    };

    /* =====================================================
       REMOVE QUESTION
    ===================================================== */

    const removeCreateQuestion = (
        questionId: number
    ) => {

        setCreateQuestions((prev) => {

            if (prev.length === 1) {
                return prev;
            }

            return prev
                .filter(
                    (question) =>
                        question.id !== questionId
                )
                .map(
                    (question, index) => ({
                        ...question,
                        que_no: index + 1,
                    })
                );
        });
    };

    /* =====================================================
       ADD OPTION
    ===================================================== */

    const addOption = (
        questionId: number
    ) => {

        setCreateQuestions((prev) =>
            prev.map((question) => {

                if (
                    question.id !== questionId
                ) {
                    return question;
                }

                return {
                    ...question,

                    options: [
                        ...question.options,
                        createEmptyOption(),
                    ],

                    optionError: "",
                };
            })
        );
    };

    /* =====================================================
       REMOVE OPTION
    ===================================================== */

    const removeOption = (
        questionId: number,
        optionIndex: number
    ) => {

        setCreateQuestions((prev) =>
            prev.map((question) => {

                if (
                    question.id !== questionId
                ) {
                    return question;
                }

                /*
                 * Do not allow less than 2 options
                 * for single/multiple select.
                 */
                if (
                    question.options.length <= 2
                ) {
                    return question;
                }

                return {
                    ...question,

                    options:
                        question.options.filter(
                            (_, index) =>
                                index !== optionIndex
                        ),
                };
            })
        );
    };

    /* =====================================================
       UPDATE QUESTION
    ===================================================== */

    const updateCreateQuestion = (
        questionId: number,
        field:
            | "question"
            | "que_type_id"
            | "questionnaire_type_id"
            | "que_is_mandatory",
        value: string | number | boolean
    ) => {

        setCreateQuestions((prev) =>
            prev.map((question) => {

                if (
                    question.id !== questionId
                ) {
                    return question;
                }

                return {
                    ...question,

                    [field]: value,

                    ...(field === "question"
                        ? {
                            textError: "",
                        }
                        : {}),

                    ...(field === "que_type_id"
                        ? {
                            typeError: "",
                        }
                        : {}),

                    ...(field ===
                    "questionnaire_type_id"
                        ? {
                            typeError: "",
                        }
                        : {}),
                };
            })
        );
    };

    /* =====================================================
       QUESTION TYPE CHANGE
    ===================================================== */

    const handleQuestionTypeChange = (
        questionId: number,
        value: number
    ) => {

        setCreateQuestions((prev) =>
            prev.map((question) => {

                if (
                    question.id !== questionId
                ) {
                    return question;
                }

                /*
                 * OPEN ENDED
                 *
                 * Remove all options.
                 */
                if (value === 3) {

                    return {
                        ...question,

                        que_type_id: value,

                        options: [],

                        typeError: "",
                        optionError: "",
                    };
                }

                /*
                 * SINGLE SELECT / MULTIPLE SELECT
                 *
                 * Automatically create exactly
                 * two options when no options exist.
                 */
                if (
                    (value === 1 ||
                        value === 2) &&
                    question.options.length === 0
                ) {

                    return {
                        ...question,

                        que_type_id: value,

                        options: [
                            createEmptyOption(),
                            createEmptyOption(),
                        ],

                        typeError: "",
                        optionError: "",
                    };
                }

                /*
                 * If changing between single and
                 * multiple select, retain existing options.
                 */
                return {
                    ...question,

                    que_type_id: value,

                    typeError: "",
                };
            })
        );
    };

    /* =====================================================
       UPDATE OPTION
    ===================================================== */

    const updateOption = (
        questionId: number,
        optionIndex: number,
        value: string
    ) => {

        setCreateQuestions((prev) =>
            prev.map((question) => {

                if (
                    question.id !== questionId
                ) {
                    return question;
                }

                return {
                    ...question,

                    options:
                        question.options.map(
                            (option, index) =>
                                index ===
                                    optionIndex
                                    ? {
                                        ...option,
                                        que_option:
                                            value,
                                    }
                                    : option
                        ),

                    optionError: "",
                };
            })
        );
    };

    /* =====================================================
       VALIDATE FORM
    ===================================================== */

    const validateCreateForm = (): boolean => {

        let hasError = false;

        setTitleError("");

        setMessageError("");

        const updatedQuestions =
            createQuestions.map(
                (question) => ({
                    ...question,

                    textError: "",

                    typeError: "",

                    optionError: "",
                })
            );

        /* ---------------------------------------------
           TITLE
        --------------------------------------------- */

        if (!createTitle.trim()) {

            setTitleError(
                "Please enter questionnaire title"
            );

            hasError = true;
        }

        /* ---------------------------------------------
           QUESTIONS
        --------------------------------------------- */

        updatedQuestions.forEach(
            (question) => {

                /* Question */

                if (
                    !question.question.trim()
                ) {

                    question.textError =
                        "Please enter question";

                    hasError = true;
                }

                /* Question Type */

                if (
                    !question.que_type_id
                ) {

                    question.typeError =
                        "Please select question type";

                    hasError = true;
                }

                /* Questionnaire Type */

                if (
                    !question.questionnaire_type_id
                ) {

                    question.typeError =
                        "Please select questionnaire type";

                    hasError = true;
                }

                /* -------------------------------------
                   OPTIONS
                ------------------------------------- */

                if (
                    question.que_type_id === 1 ||
                    question.que_type_id === 2
                ) {

                    /*
                     * Minimum two options.
                     */

                    if (
                        question.options.length < 2
                    ) {

                        question.optionError =
                            "At least 2 options are required";

                        hasError = true;
                    }

                    /*
                     * Empty option check.
                     */

                    const hasEmptyOption =
                        question.options.some(
                            (option) =>
                                !option.que_option.trim()
                        );

                    if (
                        hasEmptyOption
                    ) {

                        question.optionError =
                            "Please enter all option values";

                        hasError = true;
                    }
                }
            }
        );

        setCreateQuestions(
            updatedQuestions
        );

        return !hasError;
    };

    /* =====================================================
       SAVE QUESTIONNAIRE
    ===================================================== */

    const resetQuestionnaireForm = () => {
        setCreateTitle("");
        setMessageToMentees("");
        setTitleError("");
        setMessageError("");
        setCreateQuestions([
            createEmptyQuestion(1),
        ]);

        setIsAddingMore(false);
        setIsEditingQuestion(false);
        setEditingQuestionId(null);
        setSelectedTitle("");
    };

    const handleSaveCreate = async () => {
        if (!validateCreateForm()) {
            return;
        }

        setIsSaving(true);

        try {

            /*
            * =====================================================
            * DETERMINE QUESTIONNAIRE ID
            * =====================================================
            *
            * CREATE:
            * questionnaire_id = null
            *
            * ADD MORE:
            * questionnaire_id = existing questionnaire ID
            *
            */

            const questionnaireId =
                isAddingMore
                    ? selectedQuestionnaireId
                    : null;

            if (isAddingMore && !questionnaireId) {
                throw new Error(
                    "Questionnaire ID is missing"
                );
            }

            const payload = {
                questionnaire_id: questionnaireId,

                questionnaire_name:
                    createTitle.trim(),

                message_to_mentees:
                    messageToMentees.trim() || null,

                access_level: 1,

                parent_id:
                    isAddingMore
                        ? selectedQuestionnaire?.parent_id ?? 1
                        : 1,

                questions: createQuestions.map(
                    (question) => ({
                        questionnaire_que_id:
                            question.questionnaire_que_id,

                        que_type_id:
                            question.que_type_id,

                        que_no:
                            question.que_no,

                        question:
                            question.question.trim(),

                        questionnaire_type_id:
                            question.questionnaire_type_id,

                        que_is_mandatory:
                            question.que_is_mandatory,

                        options:
                            question.options.map(
                                (option) => ({
                                    questionnaire_options_id:
                                        option.questionnaire_options_id,

                                    que_option:
                                        option.que_option.trim(),

                                    specify_flag:
                                        option.specify_flag,
                                })
                            ),
                    })
                ),
            };

            console.log(
                "SAVE QUESTIONNAIRE PAYLOAD:",
                JSON.stringify(
                    payload,
                    null,
                    2
                )
            );

            const response = await fetch(
                "http://127.0.0.1:8000/lms_mmp_questionnaire/save_questionnaire",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(
                        payload
                    ),
                }
            );

            const result =
                await response.json();

            console.log(
                "SAVE QUESTIONNAIRE RESPONSE:",
                result
            );

            if (!response.ok) {

                if (result?.detail) {

                    if (
                        Array.isArray(
                            result.detail
                        )
                    ) {

                        const messages =
                            result.detail
                                .map(
                                    (error: any) =>
                                        error.msg
                                )
                                .join(", ");

                        throw new Error(
                            messages
                        );
                    }

                    throw new Error(
                        result.detail
                    );
                }

                throw new Error(
                    result?.message ||
                    "Failed to save questionnaire"
                );
            }

            if (!result.status) {

                throw new Error(
                    result.message ||
                    "Failed to save questionnaire"
                );
            }

            toast.success(
                isAddingMore
                    ? "Questions added successfully!"
                    : "Questionnaire saved successfully!"
            );

            /*
            * =====================================================
            * IMPORTANT
            * =====================================================
            *
            * Refresh questionnaire list BEFORE
            * clearing the state.
            *
            */

            await fetchQuestionnaires();

            /*
            * =====================================================
            * ADD MORE MODE
            * =====================================================
            *
            * Return to questionnaire list instead of
            * clearing the selected questionnaire.
            *
            */

            if (isAddingMore) {

                /*
                * Exit Add More mode
                */
                setIsAddingMore(false);

                setIsEditingQuestion(false);

                setEditingQuestionId(null);

                /*
                * Keep the questionnaire selected.
                */
                setSelectedTitle(
                    selectedQuestionnaire?.questionnaire_name || ""
                );

                /*
                * Clear only the temporary question form.
                */
                setCreateQuestions([
                    createEmptyQuestion(1),
                ]);

                return;
            }

            /*
            * =====================================================
            * NORMAL CREATE MODE
            * =====================================================
            */

            resetQuestionnaireForm();

        } catch (error: any) {

            console.error(
                "Save questionnaire error:",
                error
            );

            toast.error(
                error?.message ||
                "Failed to save questionnaire"
            );

        } finally {

            setIsSaving(false);
        }
    };

    /* =========================================================
       RETURN
    ========================================================= */

    return (

        <MentoringPageLayout>

            <div
                className="
                    bg-white
                    dark:bg-gray-800
                    rounded-lg
                    shadow-md
                    border
                    border-gray-200
                    dark:border-gray-700
                    overflow-hidden
                    flex
                    flex-col
                    min-h-[500px]
                "
            >

                {/* =============================================
                   HEADER
                ============================================= */}

                <div
                    className="
                        bg-slate-800
                        dark:bg-slate-950
                        px-6
                        py-2.5
                        flex
                        items-center
                        justify-between
                    "
                >

                    <h2
                        className="
                            text-lg
                            font-medium
                            text-white
                            tracking-wide
                        "
                    >
                        {isEditingQuestion
                            ? "Edit Question"
                            : isAddingMore
                                ? "Add More Questions"
                                : isCreating
                                    ? "Add Questionnaires"
                                    : "Questionnaires"}
                    </h2>

                </div>

                {/* =============================================
                   CREATE QUESTIONNAIRE
                ============================================= */}

                {isFormMode ? (

                    <div
                        className="
                            p-6
                            flex
                            flex-col
                            gap-5
                            bg-white
                            dark:bg-gray-800
                        "
                    >

                        {/* =====================================
                           QUESTIONNAIRE TITLE
                        ===================================== */}

                        <div
                            className="
                                flex
                                flex-col
                                md:flex-row
                                md:items-start
                                gap-4
                            "
                        >

                            <label
                                className="
                                    text-[13px]
                                    font-bold
                                    text-gray-800
                                    dark:text-gray-200
                                    w-48
                                    shrink-0
                                    mt-2
                                "
                            >
                                Questionnaire Title:

                                <span
                                    className="
                                        text-red-500
                                    "
                                >
                                    *
                                </span>

                            </label>

                            <div className="w-full max-w-lg flex flex-col">
                                {isAddingMore ? (
                                    <div
                                        className="
                                            w-full
                                            px-3
                                            py-1.5
                                            text-[13px]
                                            text-gray-700
                                            dark:text-gray-200
                                            bg-gray-100
                                            dark:bg-gray-700
                                            border
                                            border-gray-300
                                            dark:border-gray-600
                                            rounded
                                        "
                                    >
                                        {createTitle}
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            value={createTitle}
                                            onChange={(e) => {
                                                setCreateTitle(e.target.value);

                                                if (e.target.value.trim()) {
                                                    setTitleError("");
                                                }
                                            }}
                                            placeholder="Enter questionnaire title"
                                            className={`
                                                w-full
                                                px-3
                                                py-1.5
                                                text-[13px]
                                                bg-white
                                                dark:bg-gray-700
                                                text-gray-700
                                                dark:text-gray-200
                                                border
                                                rounded
                                                focus:outline-none
                                                focus:border-blue-400
                                                shadow-sm
                                                ${
                                                    titleError
                                                        ? "border-red-500"
                                                        : "border-gray-300 dark:border-gray-600"
                                                }
                                            `}
                                        />

                                        {titleError && (
                                            <span className="text-red-500 text-[11px] mt-1">
                                                {titleError}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                        </div>

                        {/* =====================================
                        MESSAGE TO MENTEES
                        ===================================== */}

                        <div
                            className="
                                flex
                                flex-col
                                md:flex-row
                                gap-4
                            "
                        >
                            <label
                                className="
                                    text-[13px]
                                    font-bold
                                    text-gray-800
                                    dark:text-gray-200
                                    w-48
                                    shrink-0
                                    mt-1
                                "
                            >
                                Message to Mentees:
                            </label>

                            <div className="w-full max-w-lg flex flex-col gap-1">

                                {isAddingMore ? (
                                    <div
                                        className="
                                            w-full
                                            min-h-[58px]
                                            px-3
                                            py-2
                                            text-[13px]
                                            text-gray-700
                                            dark:text-gray-200
                                            bg-gray-100
                                            dark:bg-gray-700
                                            border
                                            border-gray-300
                                            dark:border-gray-600
                                            rounded
                                            whitespace-pre-wrap
                                        "
                                    >
                                        {messageToMentees || "-"}
                                    </div>
                                ) : (
                                    <>
                                        <textarea
                                            rows={2}
                                            maxLength={2000}
                                            value={messageToMentees}
                                            onChange={(e) =>
                                                setMessageToMentees(e.target.value)
                                            }
                                            placeholder="Enter message to mentees"
                                            className="
                                                w-full
                                                px-3
                                                py-1.5
                                                text-[13px]
                                                bg-white
                                                dark:bg-gray-700
                                                text-gray-700
                                                dark:text-gray-200
                                                border
                                                border-gray-300
                                                dark:border-gray-600
                                                rounded
                                                focus:outline-none
                                                focus:border-blue-400
                                                shadow-sm
                                                resize-y
                                            "
                                        />

                                        <div
                                            className="
                                                text-right
                                                text-[11px]
                                                text-[#337ab7]
                                                dark:text-blue-400
                                                font-medium
                                            "
                                        >
                                            {messageToMentees.length} / 2000 characters
                                        </div>
                                    </>
                                )}

                            </div>
                        </div>


                        {/* =====================================
                        FIELD SETTING
                        ===================================== */}

                        <div
                            className="
                                flex
                                flex-col
                                md:flex-row
                                md:items-center
                                gap-4
                            "
                        >
                            <label
                                className="
                                    text-[13px]
                                    font-bold
                                    text-gray-800
                                    dark:text-gray-200
                                    w-48
                                    shrink-0
                                "
                            >
                                Field Setting:

                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <div className="w-full max-w-lg flex flex-col gap-1">

                                {isAddingMore ? (
                                    <div
                                        className="
                                            w-full
                                            px-3
                                            py-1.5
                                            text-[13px]
                                            text-gray-700
                                            dark:text-gray-200
                                            bg-gray-100
                                            dark:bg-gray-700
                                            border
                                            border-gray-300
                                            dark:border-gray-600
                                            rounded
                                        "
                                    >
                                        {FIELD_SETTING_OPTIONS[0]}
                                    </div>
                                ) : (
                                    <select
                                        className="
                                            w-full
                                            max-w-lg
                                            px-3
                                            py-1.5
                                            text-[13px]
                                            bg-white
                                            dark:bg-gray-700
                                            text-gray-600
                                            dark:text-gray-300
                                            border
                                            border-gray-300
                                            dark:border-gray-600
                                            rounded
                                            focus:outline-none
                                            focus:border-blue-400
                                            shadow-sm
                                        "
                                    >
                                        {FIELD_SETTING_OPTIONS.map(
                                            (opt, i) => (
                                                <option
                                                    key={i}
                                                    value={opt}
                                                >
                                                    {opt}
                                                </option>
                                            )
                                        )}
                                    </select>
                                )}

                            </div>
                        </div>

                        {/* =====================================
                           QUESTIONS
                        ===================================== */}

                        {createQuestions.map((question, index) => (
                            <QuestionBlock
                                key={question.id}
                                question={question}
                                index={index}
                                updateCreateQuestion={updateCreateQuestion}
                                handleQuestionTypeChange={handleQuestionTypeChange}
                                updateOption={updateOption}
                                addOption={addOption}
                                removeOption={removeOption}
                                removeCreateQuestion={removeCreateQuestion}
                                createQuestionsLength={createQuestions.length}
                            />
                        ))}

                        {/* =====================================
                           BOTTOM BUTTONS
                        ===================================== */}

                        <div
                            className="
                                flex
                                flex-col
                                items-end
                                gap-2
                                mt-4
                                pt-4
                                pb-2
                                border-t
                                border-gray-200
                                dark:border-gray-700
                                w-full
                                max-w-5xl
                            "
                        >

                            {/* ADD QUESTION */}

                            <button
                                type="button"
                                onClick={
                                    addCreateQuestion
                                }
                                disabled={
                                    isSaving
                                }
                                className="
                                    flex
                                    items-center
                                    gap-1.5
                                    px-3
                                    py-1.5
                                    text-[13px]
                                    font-medium
                                    text-white
                                    bg-[#337ab7]
                                    rounded
                                    hover:bg-[#286090]
                                    shadow-sm
                                    disabled:opacity-50
                                "
                            >

                                <FaPlus
                                    size={12}
                                />

                                Add Question

                            </button>

                            <div
                                className="
                                    flex
                                    gap-2
                                "
                            >

                                {/* CLOSE */}

                                <button
                                    type="button"
                                    onClick={() => {

                                        /*
                                        * Exit Add More mode
                                        */
                                        setIsAddingMore(false);

                                        /*
                                        * Exit Edit mode
                                        */
                                        setIsEditingQuestion(false);

                                        setEditingQuestionId(null);

                                        /*
                                        * Clear create mode
                                        */
                                        setSelectedTitle("");

                                        /*
                                        * Clear temporary form data
                                        */
                                        setCreateTitle("");

                                        setMessageToMentees("");

                                        setTitleError("");

                                        setMessageError("");

                                        setCreateQuestions([
                                            createEmptyQuestion(1),
                                        ]);
                                    }}
                                    disabled={isSaving}
                                    className="
                                        px-4
                                        py-1.5
                                        text-[13px]
                                        font-medium
                                        text-white
                                        bg-[#d9534f]
                                        rounded
                                        hover:bg-[#c9302c]
                                        shadow-sm
                                        disabled:opacity-50
                                    "
                                >
                                    Close
                                </button>

                                {/* SAVE */}

                                <button
                                    type="button"
                                    onClick={
                                        handleSaveCreate
                                    }
                                    disabled={
                                        isSaving
                                    }
                                    className="
                                        px-4
                                        py-1.5
                                        text-[13px]
                                        font-medium
                                        text-white
                                        bg-[#5cb85c]
                                        hover:bg-[#4cae4c]
                                        rounded
                                        shadow-sm
                                        disabled:opacity-50
                                    "
                                >
                                    {isSaving
                                        ? "Saving..."
                                        : "Save"}
                                </button>

                            </div>

                        </div>

                    </div>

                ) : (

                    /* =========================================
                       QUESTIONNAIRE LIST
                    ========================================= */

                    <div className="p-6">

                        <div
                            className="
                                flex
                                flex-col
                                md:flex-row
                                justify-between
                                items-start
                                md:items-end
                                gap-4
                                mb-6
                            "
                        >

                            {/* Questionnaire Title DROPDOWN */}

                            <div
                                className="
                                    flex
                                    flex-col
                                    gap-1
                                    w-72
                                "
                            >
                                <label
                                    className="
                                        text-[13px]
                                        font-bold
                                        text-gray-800
                                        dark:text-gray-200
                                    "
                                >
                                    Questionnaire Title:

                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <select
                                    value={
                                        isCreating
                                            ? "create"
                                            : selectedQuestionnaireId !== null
                                                ? String(selectedQuestionnaireId)
                                                : ""
                                    }
                                    onChange={(e) => {

                                        const value = e.target.value;

                                        /* =========================================
                                        CREATE QUESTIONNAIRE
                                        ========================================= */

                                        if (value === "create") {

                                            setSelectedQuestionnaireId(null);

                                            setSelectedTitle(
                                                "Create Questionnaire"
                                            );

                                            setIsAddingMore(false);

                                            setIsEditingQuestion(false);

                                            setEditingQuestionId(null);

                                            return;
                                        }

                                        /* =========================================
                                        NO SELECTION
                                        ========================================= */

                                        if (!value) {

                                            setSelectedQuestionnaireId(null);

                                            setSelectedTitle("");

                                            setIsAddingMore(false);

                                            setIsEditingQuestion(false);

                                            setEditingQuestionId(null);

                                            return;
                                        }

                                        /* =========================================
                                        EXISTING QUESTIONNAIRE
                                        ========================================= */

                                        const questionnaireId =
                                            Number(value);

                                        const questionnaire =
                                            questionnaires.find(
                                                (item) =>
                                                    item.questionnaire_id ===
                                                    questionnaireId
                                            );

                                        if (!questionnaire) {
                                            return;
                                        }

                                        setSelectedQuestionnaireId(
                                            questionnaireId
                                        );

                                        setSelectedTitle(
                                            questionnaire.questionnaire_name
                                        );

                                        setIsAddingMore(false);

                                        setIsEditingQuestion(false);

                                        setEditingQuestionId(null);
                                    }}
                                    className="
                                        w-full
                                        px-3
                                        py-1.5
                                        text-[13px]
                                        text-gray-700
                                        dark:text-gray-300
                                        bg-white
                                        dark:bg-gray-700
                                        border
                                        border-blue-400
                                        dark:border-blue-500
                                        rounded
                                        focus:outline-none
                                        shadow-sm
                                    "
                                >
                                    <option value="">
                                        Select Questionnaire
                                    </option>

                                    <option value="create">
                                        Create Questionnaire
                                    </option>

                                    {questionnaires.map(
                                        (questionnaire) => (
                                            <option
                                                key={
                                                    questionnaire.questionnaire_id
                                                }
                                                value={
                                                    String(
                                                        questionnaire.questionnaire_id
                                                    )
                                                }
                                            >
                                                {
                                                    questionnaire.questionnaire_name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* BUTTONS */}

                            <div
                                className="
                                    flex
                                    gap-2
                                "
                            >

                                <button
                                    type="button"
                                    onClick={handleExportPDF}
                                    disabled={!selectedQuestionnaireId}
                                    className="
                                        flex
                                        items-center
                                        gap-1.5
                                        px-4
                                        py-1.5
                                        text-[13px]
                                        font-medium
                                        text-white
                                        bg-[#5cb85c]
                                        rounded
                                        hover:bg-[#4cae4c]
                                        shadow-sm
                                        disabled:opacity-50
                                        disabled:cursor-not-allowed
                                    "
                                >
                                    <FaFileExport size={12} />

                                    Export

                                    <FaCaretDown size={12} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!selectedQuestionnaireId) {
                                            toast.error(
                                                "Please select a questionnaire first"
                                            );
                                            return;
                                        }

                                        if (!selectedQuestionnaire) {
                                            toast.error(
                                                "Questionnaire details not found"
                                            );
                                            return;
                                        }

                                        /*
                                        * Add More Questions mode
                                        */

                                        setIsAddingMore(true);

                                        setIsEditingQuestion(false);
                                        setEditingQuestionId(null);

                                        /*
                                        * Keep the existing questionnaire details
                                        */

                                        setCreateTitle(
                                            selectedQuestionnaire.questionnaire_name
                                        );

                                        setMessageToMentees(
                                            selectedQuestionnaire.message_to_mentees ||
                                            ""
                                        );

                                        /*
                                        * Start with one new empty question.
                                        *
                                        * questionnaire_que_id = null means
                                        * this is a NEW question.
                                        */

                                        setCreateQuestions([
                                            createEmptyQuestion(
                                                selectedQuestionnaire.questions.length + 1
                                            ),
                                        ]);

                                        setTitleError("");
                                        setMessageError("");
                                    }}
                                    className="
                                        px-4
                                        py-1.5
                                        text-[13px]
                                        font-medium
                                        text-white
                                        bg-[#337ab7]
                                        rounded
                                        hover:bg-[#286090]
                                        shadow-sm
                                    "
                                >
                                    Add More Questions
                                </button>

                            </div>

                        </div>

                        {/* TABLE */}

                        <div
                            className="
                                overflow-x-auto
                                border
                                border-gray-200
                                dark:border-gray-700
                                rounded
                                shadow-sm
                            "
                        >
                            <table
                                className="
                                    min-w-full
                                    divide-y
                                    divide-gray-200
                                    dark:divide-gray-700
                                    text-[13px]
                                "
                            >

                                {/* =====================================================
                                    TABLE HEADER
                                ===================================================== */}

                                <thead className="bg-white dark:bg-gray-800">

                                    <tr>

                                        <th
                                            className="
                                                px-4
                                                py-2
                                                text-center
                                                w-20
                                                font-bold
                                                text-gray-800
                                                dark:text-gray-200
                                                border-r
                                                border-gray-200
                                                dark:border-gray-700
                                            "
                                        >
                                            Q.No.
                                        </th>

                                        <th
                                            className="
                                                px-4
                                                py-2
                                                text-left
                                                font-bold
                                                text-gray-800
                                                dark:text-gray-200
                                            "
                                        >
                                            Questions
                                        </th>

                                        <th
                                            className="
                                                px-4
                                                py-2
                                                text-center
                                                w-24
                                                font-bold
                                                text-gray-800
                                                dark:text-gray-200
                                                border-l
                                                border-gray-200
                                                dark:border-gray-700
                                            "
                                        >
                                            Action
                                        </th>

                                    </tr>

                                </thead>


                                {/* =====================================================
                                    TABLE BODY
                                ===================================================== */}

                                <tbody
                                    className="
                                        bg-white
                                        dark:bg-gray-800
                                        divide-y
                                        divide-gray-200
                                        dark:divide-gray-700
                                    "
                                >

                                    {/* =================================================
                                        LOADING
                                    ================================================= */}

                                    {isLoadingQuestionnaires ? (

                                        <tr>

                                            <td
                                                colSpan={3}
                                                className="
                                                    px-4
                                                    py-8
                                                    text-center
                                                    text-gray-500
                                                    dark:text-gray-400
                                                "
                                            >
                                                Loading questionnaires...
                                            </td>

                                        </tr>

                                    ) : !selectedQuestionnaire ? (

                                        /* =============================================
                                            NO QUESTIONNAIRE SELECTED
                                        ============================================= */

                                        <tr>

                                            <td
                                                colSpan={3}
                                                className="
                                                    px-4
                                                    py-8
                                                    text-center
                                                    text-gray-500
                                                    dark:text-gray-400
                                                "
                                            >
                                                Select a questionnaire to view its questions.
                                            </td>

                                        </tr>

                                    ) : (

                                        <>

                                            {/* =============================================
                                                FIELD SETTING
                                            ============================================= */}

                                            <tr className="bg-[#d9edf7] dark:bg-[#1f3a4d]">

                                                <td
                                                    colSpan={3}
                                                    className="
                                                        px-4
                                                        py-2.5
                                                        text-[13px]
                                                        text-gray-800
                                                        dark:text-gray-200
                                                    "
                                                >

                                                    <span className="font-bold">
                                                        Field Setting:
                                                    </span>

                                                    <span className="ml-2 text-gray-600 dark:text-gray-300">
                                                        Allow to add / modify / delete Questionnaire
                                                    </span>

                                                </td>

                                            </tr>

                                            {/* =============================================
                                                NO QUESTIONS
                                            ============================================= */}

                                            {selectedQuestionnaire.questions.length === 0 ? (

                                                <tr>

                                                    <td
                                                        colSpan={3}
                                                        className="
                                                            px-4
                                                            py-8
                                                            text-center
                                                            text-gray-500
                                                            dark:text-gray-400
                                                        "
                                                    >
                                                        No questions available for this questionnaire.
                                                    </td>

                                                </tr>

                                            ) : (

                                                /* =========================================
                                                    QUESTIONS
                                                ========================================= */

                                                selectedQuestionnaire.questions.map(
                                                    (question) => (

                                                        <tr
                                                            key={
                                                                question.questionnaire_que_id
                                                            }
                                                            className="
                                                                hover:bg-gray-50
                                                                dark:hover:bg-gray-700/30
                                                            "
                                                        >

                                                            {/* =================================
                                                                QUESTION NUMBER
                                                            ================================= */}

                                                            <td
                                                                className="
                                                                    px-4
                                                                    py-4
                                                                    text-center
                                                                    align-top
                                                                    font-medium
                                                                    text-gray-700
                                                                    dark:text-gray-300
                                                                    border-r
                                                                    border-gray-200
                                                                    dark:border-gray-700
                                                                "
                                                            >
                                                                {question.que_no}
                                                            </td>


                                                            {/* =================================
                                                                QUESTION + OPTIONS
                                                            ================================= */}

                                                            <td
                                                                className="
                                                                    px-4
                                                                    py-4
                                                                    align-top
                                                                "
                                                            >

                                                                {/* QUESTION TEXT */}

                                                                <div
                                                                    className="
                                                                        text-gray-800
                                                                        dark:text-gray-200
                                                                        font-medium
                                                                        mb-3
                                                                    "
                                                                >
                                                                    {question.question}
                                                                </div>


                                                                {/* =================================
                                                                    OPTIONS
                                                                ================================= */}

                                                                {(question.que_type_id === 1 ||
                                                                    question.que_type_id === 2) &&
                                                                    question.options &&
                                                                    question.options.length > 0 && (

                                                                        <div
                                                                            className="
                                                                                flex
                                                                                flex-wrap
                                                                                items-center
                                                                                gap-x-8
                                                                                gap-y-2
                                                                            "
                                                                        >

                                                                            {question.options.map(
                                                                                (
                                                                                    option,
                                                                                    optionIndex
                                                                                ) => (

                                                                                    <div
                                                                                        key={
                                                                                            option.questionnaire_options_id
                                                                                        }
                                                                                        className="
                                                                                            flex
                                                                                            items-center
                                                                                            gap-1
                                                                                            text-gray-600
                                                                                            dark:text-gray-400
                                                                                            whitespace-nowrap
                                                                                        "
                                                                                    >

                                                                                        {/* OPTION LABEL */}

                                                                                        <span
                                                                                            className="
                                                                                                font-medium
                                                                                                text-gray-700
                                                                                                dark:text-gray-300
                                                                                            "
                                                                                        >
                                                                                            {String.fromCharCode(
                                                                                                65 +
                                                                                                optionIndex
                                                                                            )}.
                                                                                        </span>

                                                                                        {/* OPTION TEXT */}

                                                                                        <span>
                                                                                            {
                                                                                                option.que_option
                                                                                            }
                                                                                        </span>

                                                                                    </div>

                                                                                )
                                                                            )}

                                                                        </div>

                                                                    )}

                                                            </td>


                                                            {/* =================================
                                                                ACTION
                                                            ================================= */}

                                                            <td
                                                                className="
                                                                    px-4
                                                                    py-4
                                                                    text-center
                                                                    align-middle
                                                                    border-l
                                                                    border-gray-200
                                                                    dark:border-gray-700
                                                                "
                                                            >

                                                                <div
                                                                    className="
                                                                        flex
                                                                        items-center
                                                                        justify-center
                                                                        gap-4
                                                                    "
                                                                >

                                                                    {/* EDIT */}

                                                                    <button
                                                                        type="button"
                                                                        title="Edit Question"
                                                                        className="
                                                                            text-[#337ab7]
                                                                            hover:text-[#286090]
                                                                            transition-colors
                                                                        "
                                                                        onClick={() =>
                                                                            handleEditQuestion(question)
                                                                        }
                                                                    >
                                                                        <FaPencilAlt size={13} />
                                                                    </button>


                                                                    {/* DELETE */}

                                                                    <button
                                                                        type="button"
                                                                        title="Delete Question"
                                                                        className="
                                                                            text-[#d9534f]
                                                                            hover:text-[#c9302c]
                                                                            transition-colors
                                                                        "
                                                                        onClick={() =>
                                                                            handleDeleteQuestion(question)
                                                                        }
                                                                    >
                                                                        <FaTrash size={13} />
                                                                    </button>

                                                                </div>

                                                            </td>

                                                        </tr>

                                                    )
                                                )

                                            )}

                                        </>

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>
                )}

            </div>

        </MentoringPageLayout>
    );
};

export default QuestionnairePage;