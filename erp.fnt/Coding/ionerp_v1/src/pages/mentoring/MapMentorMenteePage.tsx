import React, { useState, useEffect, useMemo } from "react";
import { FaPlusCircle, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { FiEdit2, FiTrash2, FiPlusCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import MentoringPageLayout from "./MentoringPageLayout";
import { useMapMentorMenteeService } from "../lms/mmp/mapMentorMentee/manageMentorMenteeService";
import { MentoringGroup } from "./types/mapMentorMentee";

const MapMentorMenteePage: React.FC = () => {
    // --- View Toggle ---
    const [view, setView] = useState<"list" | "add" | "add-mentors" | "add-mentees">("list");

    // --- State Variables ---
    const [groups, setGroups] = useState<MentoringGroup[]>([]);
    const [curriculums, setCurriculums] = useState<any[]>([]);
    const [terms, setTerms] = useState<any[]>([]);
    const [configTypes, setConfigTypes] = useState<any[]>([]);
    const [questionnaires, setQuestionnaires] = useState<any[]>([]);
    const [mentors, setMentors] = useState<any[]>([]);
    const [mentees, setMentees] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [loadingBatch, setLoadingBatch] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedAcademicBatchId, setSelectedAcademicBatchId] = useState<number | null>(null);
    
    const service = useMapMentorMenteeService();

    const [searchTerm, setSearchTerm] = useState("");
    const [entriesPerPage, setEntriesPerPage] = useState(100);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Sorting state
    const [sortColumn, setSortColumn] = useState<keyof MentoringGroup | "">("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    // Add Group Page state
    const [groupTitleInput, setGroupTitleInput] = useState("");
    const [applicableTermInput, setApplicableTermInput] = useState("");
    const [configTypeInput, setConfigTypeInput] = useState("");
    const [questionnaireInput, setQuestionnaireInput] = useState("");
    const [selectedMentors, setSelectedMentors] = useState<string[]>([]);
    const [addErrors, setAddErrors] = useState<Record<string, string>>({});

    const [newlyCreatedGroup, setNewlyCreatedGroup] = useState<any | null>(null);

    // Edit Title Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<MentoringGroup | null>(null);
    const [editTitleInput, setEditTitleInput] = useState("");
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});

    // Delete Confirm Modal state
    const [groupToDelete, setGroupToDelete] = useState<MentoringGroup | null>(null);

    // Add Mentor Modal state
    const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
    const [targetGroupForMentor, setTargetGroupForMentor] = useState<MentoringGroup | null>(null);
    const [selectedMentorIds, setSelectedMentorIds] = useState<number[]>([]);

    // Add Mentee Modal state
    const [isMenteeModalOpen, setIsMenteeModalOpen] = useState(false);
    const [targetGroupForMentee, setTargetGroupForMentee] = useState<MentoringGroup | null>(null);
    const [selectedMenteeIds, setSelectedMenteeIds] = useState<number[]>([]);

    // --- Load Data on Mount ---
    useEffect(() => {
        const loadCurriculums = async () => {
            try {
                setLoadingBatch(true);
                const data = await service.getCurriculums();
                setCurriculums(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load curriculum");
            } finally {
                setLoadingBatch(false);
            }
        };

        const loadConfigTypes = async () => {
            try {
                const data = await service.getConfigTypes();
                setConfigTypes(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load configuration types");
            }
        };

        loadCurriculums();
        loadConfigTypes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Load Data when Batch changes ---
    useEffect(() => {
        if (!selectedBatch) {
            setGroups([]);
            setTerms([]);
            setQuestionnaires([]);
            setMentors([]);
            setMentees([]);
            return;
        }

        const loadBatchData = async () => {
            try {
                setLoading(true);
                const batchId = Number(selectedBatch);
                
                // Fetch groups and auxiliary dropdown data in parallel
                const [groupsData, termsData, questionnairesData, mentorsData, menteesData] = await Promise.all([
                    service.getGroups(batchId),
                    service.getTerms(batchId),
                    service.getQuestionnaires(batchId),
                    service.getMentors(batchId),
                    service.getMentees(batchId)
                ]);

                setGroups(Array.isArray(groupsData) ? groupsData : []);
                setTerms(Array.isArray(termsData) ? termsData : []);
                setQuestionnaires(Array.isArray(questionnairesData) ? questionnairesData : []);
                setMentors(Array.isArray(mentorsData) ? mentorsData : []);
                setMentees(Array.isArray(menteesData) ? menteesData : []);
                
                setCurrentPage(1);
                setSelectedIds([]);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load mentoring data for batch");
            } finally {
                setLoading(false);
            }
        };

        loadBatchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBatch]);

    // --- Sorting Handler ---
    const handleSort = (column: keyof MentoringGroup) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
        setCurrentPage(1);
    };

    // --- Filter and Search Logic ---
    const filteredAndSearchedGroups = useMemo(() => {
        let result = [...groups];
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(g =>
                g.group_title?.toLowerCase().includes(term) ||
                g.mentors?.some((m: any) => m.name?.toLowerCase().includes(term)) ||
                g.mentees?.some((m: any) => m.name?.toLowerCase().includes(term)) ||
                g.session_status?.toLowerCase().includes(term)
            );
        }
        return result;
    }, [groups, searchTerm]);

    // --- Pagination Logic ---
    const totalEntries = filteredAndSearchedGroups.length;
    const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const paginatedGroups = useMemo(() => {
        const start = (currentPage - 1) * entriesPerPage;
        return filteredAndSearchedGroups.slice(start, start + entriesPerPage);
    }, [filteredAndSearchedGroups, currentPage, entriesPerPage]);

    // --- Checkbox Handlers ---
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const pageIds = paginatedGroups.map(g => g.mentors_group_id);
            setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
        } else {
            const pageIds = paginatedGroups.map(g => g.mentors_group_id);
            setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
        }
    };

    const handleSelectRow = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const isAllSelectedOnPage = useMemo(() => {
        if (paginatedGroups.length === 0) return false;
        return paginatedGroups.every(g => selectedIds.includes(g.mentors_group_id));
    }, [paginatedGroups, selectedIds]);

    // --- Add Page Operations ---
    const handleOpenAddView = () => {
        setGroupTitleInput("");
        setApplicableTermInput("");
        setConfigTypeInput("");
        setQuestionnaireInput("");
        setSelectedMentors([]);
        setAddErrors({});
        setView("add");
    };

    const validateAddForm = () => {
        const errors: Record<string, string> = {};
        if (!groupTitleInput.trim()) {
            errors.group_title = "Group Title is required";
        }
        if (!applicableTermInput) {
            errors.applicable_terms = "Applicable Terms selection is required";
        }
        if (!configTypeInput) {
            errors.config_type = "Configuration Type selection is required";
        }
        if (!questionnaireInput) {
            errors.questionnaire_title = "Questionnaire Title selection is required";
        }
        setAddErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAddForm()) return;

        try {
            setLoading(true);

            // Construct payload to align perfectly with FastAPI router Pydantic expectations
            const groupPayload = {
                academic_batch_id: Number(selectedBatch),
                mentors_pgm_title: groupTitleInput.trim(),
                config_type_id: Number(configTypeInput),
                questionnaire_id: Number(questionnaireInput),
                semester_ids: [Number(applicableTermInput)]
            };
            
            const response = await service.createGroup(groupPayload);

            const curriculum = curriculums.find(c => c.academic_batch_id === Number(selectedBatch));
            const term = terms.find(t => t.semester_id === Number(applicableTermInput));
            const config = configTypes.find(c => c.config_type_id === Number(configTypeInput));
            const questionnaire = questionnaires.find(q => q.questionnaire_id === Number(questionnaireInput));

            setNewlyCreatedGroup({
                ...response.data,
                mentors_group_id: response.data?.mentors_group_id, // Fetch mapped ID
                group_title: groupTitleInput.trim(),
                curriculum_name: curriculum ? `${curriculum.academic_batch_desc} ${curriculum.academic_year || ''}` : '',
                applicable_terms_display: term ? term.semester_desc : '', 
                config_type_display: config ? config.config_type_name : '',
                questionnaire_display: questionnaire ? questionnaire.questionnaire_name : '',
            });

            toast.success("Group created successfully! Now, add mentors.");
            setSelectedMentorIds([]);
            setView("add-mentors"); // Switch to Full-Page Mentor layout
        } catch (error) {
            console.error(error);
            toast.error("Failed to create mentoring group.");
        } finally {
            setLoading(false);
        }
    };

    // --- Wizard flow: Save Mentors and go to Mentees ---
    const handleAddMentorsForNewGroupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newlyCreatedGroup?.mentors_group_id) {
            toast.error("No group context found.");
            return;
        }
        if (selectedMentorIds.length === 0) {
            toast.warning("Please select at least one mentor.");
            return;
        }

        try {
            setLoading(true);
            await service.addMentor(newlyCreatedGroup.mentors_group_id, selectedMentorIds);
            toast.success("Mentors assigned successfully! Now, select mentees.");
            
            setSelectedMenteeIds([]);
            setView("add-mentees"); // Switch to Full-Page Mentee layout
        } catch (error) {
            console.error(error);
            toast.error("Failed to map mentors.");
        } finally {
            setLoading(false);
        }
    };

    // --- Wizard flow: Save Mentees and return to Main list ---
    const handleAddMenteesForNewGroupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Use newlyCreatedGroup, which is guaranteed to be populated in this view
        if (!newlyCreatedGroup?.mentors_group_id) {
            toast.error("No group context found. Please restart the process.");
            return;
        }
        if (selectedMenteeIds.length === 0) {
            toast.warning("Please select at least one mentee.");
            return;
        }

        try {
            setLoading(true);
            
            // FIX: Use newlyCreatedGroup.mentors_group_id instead of the null targetGroupForMentee
            await service.addMentee(
                newlyCreatedGroup.mentors_group_id, 
                selectedMentorIds,
                selectedMenteeIds
            );

            toast.success("Mentees mapped successfully! Setup complete.");

            // Reset and refetch
            const updatedGroups = await service.getGroups(Number(selectedBatch));
            setGroups(updatedGroups);

            setView("list");
            setNewlyCreatedGroup(null);
            setSelectedMentorIds([]);
            setSelectedMenteeIds([]);

        } catch (error) {
            console.error("Error adding mentees:", error);
            toast.error("Failed to map mentees.");
        } finally {
            setLoading(false);
        }
    };

    // --- Edit Modal Operations ---
    const handleOpenEditModal = (group: MentoringGroup) => {
        setEditingGroup(group);
        setEditTitleInput(group.group_title);
        setEditErrors({});
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTitleInput.trim()) {
            setEditErrors({ group_title: "Group Title is required" });
            return;
        }
        if (!editingGroup) return;

        try {
            await service.updateGroup(editingGroup.mentors_group_id, {
                group_title: editTitleInput.trim()
            });

            toast.success("Group title updated successfully!");
            setIsEditModalOpen(false);
            setEditingGroup(null);
            
            const data = await service.getGroups(Number(selectedBatch));
            setGroups(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update group");
        }
    };

    // --- Delete Group Operations ---
    const handleDeleteClick = (group: MentoringGroup) => {
        setGroupToDelete(group);
    };

    const confirmDeleteGroup = async () => {
        if (!groupToDelete) return;
        try {
            await service.deleteGroup(groupToDelete.mentors_group_id);
            toast.success("Mentoring group deleted successfully!");
            setSelectedIds(prev => prev.filter(id => id !== groupToDelete.mentors_group_id));
            setGroupToDelete(null);
            
            const data = await service.getGroups(Number(selectedBatch));
            setGroups(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete mentoring group");
        }
    };

    // --- Add Mentor Operations to existing group ---
    const handleOpenAddMentor = async (group: MentoringGroup) => {
        setTargetGroupForMentor(group);
        setIsMentorModalOpen(true); // Open the modal immediately

        try {
            // Fetch the list of mentors already mapped to this specific group
            const currentlyMappedMentors = await service.getGroupMentors(group.mentors_group_id);

            // Extract just the IDs from the response
            const existingMentorIds = currentlyMappedMentors.map((m: any) => m.mentor_id);

            // Set the state to pre-check the boxes
            setSelectedMentorIds(existingMentorIds);
        } catch (error) {
            console.error("Failed to fetch group's current mentors:", error);
            toast.error("Could not load existing mentor mappings.");
            setSelectedMentorIds([]); // Ensure it's empty on failure
        }
    };

    const handleAddMentorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!targetGroupForMentor) {
            toast.warning("Please select a group");
            return;
        }
        if (selectedMentorIds.length === 0) {
            toast.warning("Please select a mentor");
            return;
        }
        if (!selectedAcademicBatchId) {
            toast.warning("Please select academic batch");
            return;
        }

        try {
            setLoading(true);
            await service.addMentor(targetGroupForMentor.mentors_group_id, selectedMentorIds);

            const updatedGroups = await service.getGroups(Number(selectedAcademicBatchId));
            setGroups(updatedGroups);

            setIsMentorModalOpen(false);
            setTargetGroupForMentor(null);
            setSelectedMentorIds([]);
            toast.success("Mentor assigned successfully!");
        } catch (error) {
            console.error("Error adding mentor:", error);
            toast.error("Failed to assign mentor");
        } finally {
            setLoading(false);
        }
    };

    // --- Add Mentee Operations to existing group ---
    const handleOpenAddMentee = async (group: MentoringGroup) => {
        setTargetGroupForMentee(group);
        setIsMenteeModalOpen(true); // Open the modal immediately

        try {
            // Fetch the list of mentees already mapped to this specific group
            const currentlyMappedMentees = await service.getGroupMentees(group.mentors_group_id);
            
            // Extract just the IDs from the response
            const existingMenteeIds = currentlyMappedMentees.map((m: any) => m.student_id);

            // Set the state to pre-check the boxes
            setSelectedMenteeIds(existingMenteeIds);
        } catch (error) {
            console.error("Failed to fetch group's current mentees:", error);
            toast.error("Could not load existing mentee mappings.");
            setSelectedMenteeIds([]); // Ensure it's empty on failure
        }
    };

    const handleAddMenteeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Safety Guard Clause to fix "targetGroupForMentee is possibly null"
        if (!targetGroupForMentee) {
            toast.warning("Please select a group");
            return;
        }
        if (selectedMenteeIds.length === 0) {
            toast.warning("Please select a mentee");
            return;
        }
        if (!selectedAcademicBatchId) {
            toast.warning("Please select academic batch");
            return;
        }

        try {
            setLoading(true);
            
            // Now TypeScript knows targetGroupForMentee is guaranteed to be non-null here!
            await service.addMentee(
                targetGroupForMentee.mentors_group_id, 
                selectedMentorIds, 
                selectedMenteeIds
            );

            const updatedGroups = await service.getGroups(Number(selectedAcademicBatchId));
            setGroups(updatedGroups);

            setIsMenteeModalOpen(false);
            setTargetGroupForMentee(null);
            setSelectedMenteeIds([]);
            toast.success("Mentee added successfully!");
        } catch (error) {
            console.error("Error adding mentee:", error);
            toast.error("Failed to add mentee");
        } finally {
            setLoading(false);
        }
    };

    // Sort Icon Renderer
    const renderSortIcon = (column: keyof MentoringGroup) => {
        if (sortColumn !== column) return <FaSort className="inline ml-1 text-gray-400 text-xs" />;
        return sortDirection === "asc" ? (
            <FaSortUp className="inline ml-1 text-gray-800 text-sm" />
        ) : (
            <FaSortDown className="inline ml-1 text-gray-800 text-sm" />
        );
    };

    return (
        <MentoringPageLayout>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Banner header title */}
                <div className="bg-slate-800 dark:bg-slate-950 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        {view === "list" && "Map Mentor Mentee"}
                        {view === "add" && "Add Mentor Mentee"}
                        {view === "add-mentors" && "Add Mentors"}
                        {view === "add-mentees" && "Add Mentees"}
                    </h2>
                </div>

                {view === "list" && (
                    /* --- List View Screen --- */
                    <div className="p-6">
                        {/* Top Row: Curriculum Selector and Add button */}
                        <div className="grid grid-cols-4 gap-4 mb-4 items-end">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Curriculum <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 bg-white"
                                    value={selectedBatch}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setSelectedBatch(value);
                                        setSelectedAcademicBatchId(value ? Number(value) : null);
                                        setCurrentPage(1);
                                    }}
                                    disabled={loadingBatch}
                                >
                                    <option value="">{loadingBatch ? 'Loading...' : 'Select Curriculum'}</option>
                                    {curriculums.map(c => (
                                        <option key={c.academic_batch_id} value={c.academic_batch_id}>
                                            {c.academic_batch_desc} {c.academic_year ? `${c.academic_year}` : `(${c.academic_batch_code})`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        
                            <button
                                onClick={handleOpenAddView}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded shadow transition duration-150 cursor-pointer"
                            >
                                <FiPlusCircle size={16} />
                                Add Mentor Mentee
                            </button>
                        </div>

                        {/* Table Controls (Search and Entries count) */}
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <span>Show</span>
                                <select
                                    value={entriesPerPage}
                                    onChange={(e) => {
                                        setEntriesPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <span>entries</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Search:</span>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full md:w-64 px-3 py-1 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Mentoring Groups Table */}
                        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 font-semibold text-[13px]">
                                <tr>
                                    <th className="px-4 py-3 w-20 cursor-pointer select-none">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelectedOnPage}
                                            onChange={handleSelectAll}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span>Sl. No.</span>
                                        {renderSortIcon("mentors_group_id")}
                                    </div>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("group_title")}>
                                    <div className="flex items-center">
                                        Group Title
                                        {renderSortIcon("group_title")}
                                    </div>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("mentors")}>
                                    <div className="flex items-center">
                                        Mentor
                                        {renderSortIcon("mentors")}
                                    </div>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("mentees")}>
                                    <div className="flex items-center">
                                        Mentee
                                        {renderSortIcon("mentees")}
                                    </div>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("session_date")}>
                                    <div className="flex items-center">
                                        Session Date
                                        {renderSortIcon("session_date")}
                                    </div>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("session_status")}>
                                    <div className="flex items-center">
                                        Session Status
                                        {renderSortIcon("session_status")}
                                    </div>
                                    </th>
                                    <th className="px-4 py-3 text-center w-24">
                                        Action
                                    </th>
                                </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                {paginatedGroups.length > 0 ? (
                                    paginatedGroups.map((group, index) => {
                                    const slNo = (currentPage - 1) * entriesPerPage + index + 1;
                                    const isSelected = selectedIds.includes(group.mentors_group_id);

                                    return (
                                        <tr
                                            key={group.mentors_group_id}
                                            className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 transition duration-150 ${
                                                isSelected ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
                                            }`}
                                        >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectRow(group.mentors_group_id)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span>{slNo}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                            {group.group_title}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1.5">
                                            {group.mentors.length > 0 ? (
                                                <span className="text-gray-800 dark:text-gray-200">
                                                    {group.mentors
                                                        .map((m: { name: string }) => m.name)
                                                        .join(" , ")}
                                                </span>
                                            ) : null}
                                            <button
                                                onClick={() => handleOpenAddMentor(group)}
                                                className="flex items-center gap-1 text-[13px] text-[#337ab7] dark:text-blue-400 hover:underline text-left font-medium w-max"
                                            >
                                                <FaPlusCircle className="text-[#337ab7] dark:text-blue-400" size={13} />
                                                Add mentor
                                            </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1.5">
                                            {group.mentees.length > 0 ? (
                                                <span className="text-gray-800 dark:text-gray-200">
                                                    {group.mentees
                                                        .map((m: { name: string }) => m.name)
                                                        .join(" , ")}
                                                </span>
                                            ) : null}
                                            <button
                                                onClick={() => handleOpenAddMentee(group)}
                                                className="flex items-center gap-1 text-[13px] text-[#337ab7] dark:text-blue-400 hover:underline text-left font-medium w-max"
                                            >
                                                <FaPlusCircle className="text-[#337ab7] dark:text-blue-400" size={13} />
                                                Add mentee
                                            </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {group.session_date || ""}
                                        </td>
                                        <td className="px-4 py-3">
                                            {group.session_status || ""}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleOpenEditModal(group)}
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition cursor-pointer"
                                                title="Edit Group Title"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(group)}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition cursor-pointer"
                                                title="Delete Mentoring Group"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                            </div>
                                        </td>
                                        </tr>
                                    );
                                    })
                                ) : (
                                    <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        No mentoring groups found. Click "Add Mentor Mentee" to create one.
                                    </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Table Footer / Pagination */}
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mt-6">
                            <div className="text-sm text-gray-500">
                                {totalEntries > 0 ? (
                                <span>
                                    Showing {Math.min((currentPage - 1) * entriesPerPage + 1, totalEntries)} to{" "}
                                    {Math.min(currentPage * entriesPerPage, totalEntries)} of {totalEntries} entries
                                </span>
                                ) : (
                                <span>Showing 0 to 0 of 0 entries</span>
                                )}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex justify-center items-center -space-x-px text-sm">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-2 border cursor-pointer ${
                                        currentPage === page
                                        ? "z-10 bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                    }`}
                                    >
                                    {page}
                                    </button>
                                ))}
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Next
                                </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {view === "add" && (
                    /* --- Add Mentor Mentee Full Page View Screen --- */
                    <form onSubmit={handleAddSubmit} className="p-6 space-y-5 max-w-2xl animate-in fade-in duration-200">
                        <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Group Title: <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={groupTitleInput}
                            onChange={(e) => {
                            setGroupTitleInput(e.target.value);
                            if (e.target.value.trim()) setAddErrors(p => ({ ...p, group_title: "" }));
                            }}
                            placeholder="Enter Group Title"
                            className={`w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            addErrors.group_title ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600"
                            }`}
                        />
                        {addErrors.group_title && (
                            <p className="mt-1 text-xs text-red-500 font-semibold">{addErrors.group_title}</p>
                        )}
                        </div>

                        {/* --- Applicable Terms dropdown select --- */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Applicable Terms: <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={applicableTermInput}
                                onChange={e => setApplicableTermInput(e.target.value)}
                                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
                            >
                                <option value="">Select Applicable Term</option>
                                {terms.map((term: any) => (
                                    <option
                                        key={term.semester_id}  
                                        value={term.semester_id}
                                    >
                                        {term.semester_desc}
                                    </option>
                                ))}
                            </select>
                            {addErrors.applicable_terms && (
                                <p className="mt-1 text-xs text-red-500 font-semibold">{addErrors.applicable_terms}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Configuration Type: <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={configTypeInput}
                                onChange={e => setConfigTypeInput(e.target.value)}
                                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                            >
                                <option value="">Select configuration type</option>
                                {configTypes.map((type: any) => (
                                    <option key={type.config_type_id} value={type.config_type_id}>
                                        {type.config_type_name}
                                    </option>
                                ))}
                            </select>
                            {addErrors.config_type && (
                                <p className="mt-1 text-xs text-red-500 font-semibold">{addErrors.config_type}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Questionnaire Title: <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={questionnaireInput}
                                onChange={e => {
                                    setQuestionnaireInput(e.target.value);
                                    if (e.target.value) {
                                        setAddErrors(prev => ({ ...prev, questionnaire_title: "" }));
                                    }
                                }}
                                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                            >
                                <option value="">Select questionnaire title</option>
                                {questionnaires.map((questionnaire: any) => (
                                    <option key={questionnaire.questionnaire_id} value={questionnaire.questionnaire_id}>
                                        {questionnaire.questionnaire_name}
                                    </option>
                                ))}
                            </select>
                            {addErrors.questionnaire_title && (
                                <p className="mt-1 text-xs text-red-500 font-semibold">{addErrors.questionnaire_title}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-solid border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setView("list")}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm font-semibold transition cursor-pointer"
                            >
                                Close
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold shadow transition cursor-pointer flex items-center gap-2"
                            >
                                Save & Proceed to Add Mentors
                            </button>
                        </div>
                    </form>
                )}

                {/* --- ADD MENTORS FULL-PAGE LAYOUT --- */}
                {view === "add-mentors" && newlyCreatedGroup && (
                     <form onSubmit={handleAddMentorsForNewGroupSubmit} className="p-6 space-y-5 animate-in fade-in duration-200">
                         {/* Display newly created group details */}
                         <div className="space-y-2 text-sm border-b pb-4 mb-4">
                             <div className="grid grid-cols-4"><strong className="col-span-1 text-gray-700 dark:text-gray-300">Curriculum:</strong> <span className="col-span-3 text-gray-900 dark:text-white">{newlyCreatedGroup.curriculum_name}</span></div>
                             <div className="grid grid-cols-4"><strong className="col-span-1 text-gray-700 dark:text-gray-300">Applicable Terms:</strong> <span className="col-span-3 text-gray-900 dark:text-white">{newlyCreatedGroup.applicable_terms_display}</span></div>
                             <div className="grid grid-cols-4"><strong className="col-span-1 text-gray-700 dark:text-gray-300">Group Title:</strong> <span className="col-span-3 text-gray-900 dark:text-white">{newlyCreatedGroup.group_title}</span></div>
                             <div className="grid grid-cols-4"><strong className="col-span-1 text-gray-700 dark:text-gray-300">Configuration Type:</strong> <span className="col-span-3 text-gray-900 dark:text-white">{newlyCreatedGroup.config_type_display}</span></div>
                             <div className="grid grid-cols-4"><strong className="col-span-1 text-gray-700 dark:text-gray-300">Questionnaire Type:</strong> <span className="col-span-3 text-gray-900 dark:text-white">{newlyCreatedGroup.questionnaire_display}</span></div>
                         </div>
                
                         {/* Mentor Selection Checklist in 3 columns */}
                         <div>
                             <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Mentors:</label>
                             <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/30 dark:bg-gray-900/10 p-4 max-h-[300px] overflow-y-auto grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2.5">
                                 {mentors.map((mentor: any) => (
                                     <label key={mentor.user_id} className="flex items-center gap-2.5 px-3 py-1.5 border rounded bg-white cursor-pointer hover:bg-gray-50">
                                         <input
                                             type="checkbox"
                                             className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                             checked={selectedMentorIds.includes(Number(mentor.user_id))}
                                             onChange={(e) => {
                                                 const mId = Number(mentor.user_id);
                                                 const isNowChecked = e.target.checked;
                                                 setSelectedMentorIds(prev =>
                                                     isNowChecked
                                                         ? [...prev, mId]
                                                         : prev.filter(id => id !== mId)
                                                 );
                                             }}
                                         />
                                         <span className="text-gray-800 dark:text-gray-100 text-sm">{mentor.name}</span>
                                     </label>
                                 ))}
                             </div>
                         </div>
                
                         {/* Footer Buttons */}
                         <div className="flex items-center gap-2 pt-4 border-t border-solid border-gray-200 dark:border-gray-700">
                             <button type="button" onClick={() => { setView("list"); setNewlyCreatedGroup(null); }} className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded text-sm font-semibold">Cancel</button>
                             <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold shadow disabled:opacity-50">
                                 {loading ? 'Adding Mentors...' : 'Add Selected Mentors & Proceed'}
                             </button>
                         </div>
                     </form>
                )}

                {/* --- ADD MENTEES FULL-PAGE LAYOUT --- */}
                {view === 'add-mentees' && newlyCreatedGroup && (
                     <form onSubmit={handleAddMenteesForNewGroupSubmit} className="p-6 space-y-5 animate-in fade-in duration-200">
                         {/* Display newly created group details at the top */}
                         <div className="space-y-2 text-sm border-b pb-4 mb-4">
                             <div className="grid grid-cols-4"><strong className="col-span-1 text-gray-700 dark:text-gray-300">Curriculum:</strong> <span className="col-span-3 text-gray-900 dark:text-white">{newlyCreatedGroup.curriculum_name}</span></div>
                             <div className="grid grid-cols-4"><strong className="col-span-1 text-gray-700 dark:text-gray-300">Applicable Terms:</strong> <span className="col-span-3 text-gray-900 dark:text-white">{newlyCreatedGroup.applicable_terms_display}</span></div>
                             <div className="grid grid-cols-4"><strong className="col-span-1 text-gray-700 dark:text-gray-300">Group Title:</strong> <span className="col-span-3 text-gray-900 dark:text-white">{newlyCreatedGroup.group_title}</span></div>
                             <div className="grid grid-cols-4"><strong className="col-span-1 text-gray-700 dark:text-gray-300">Configuration Type:</strong> <span className="col-span-3 text-gray-900 dark:text-white">{newlyCreatedGroup.config_type_display}</span></div>
                             <div className="grid grid-cols-4"><strong className="col-span-1 text-gray-700 dark:text-gray-300">Questionnaire Type:</strong> <span className="col-span-3 text-gray-900 dark:text-white">{newlyCreatedGroup.questionnaire_display}</span></div>
                         </div>
                
                         {/* Mentee Selection Checklist in 3 columns */}
                         <div>
                             <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Mentees:</label>
                             <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/30 dark:bg-gray-900/10 p-4 max-h-[300px] overflow-y-auto grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2.5">
                                 {mentees.length > 0 ? (
                                     mentees.map((mentee: any, index: number) => {
                                         const menteeId = mentee.user_id ? Number(mentee.user_id) : `fallback-${index}`;
                                         const isChecked = selectedMenteeIds.includes(menteeId as any);

                                         return (
                                             <label key={`new-mentee-${menteeId}-${index}`} className="flex items-center gap-2.5 px-3 py-1.5 border rounded bg-white cursor-pointer hover:bg-gray-50">
                                                 <input
                                                     type="checkbox"
                                                     className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                     checked={isChecked}
                                                     onChange={(e) => {
                                                         const isNowChecked = e.target.checked;
                                                         setSelectedMenteeIds(prev =>
                                                             isNowChecked
                                                                 ? [...prev, menteeId as any]
                                                                 : prev.filter(id => id !== menteeId)
                                                         );
                                                     }}
                                                 />
                                                 <span className="text-gray-800 dark:text-gray-100 text-sm">{mentee.name || "Unknown Mentee"}</span>
                                             </label>
                                         );
                                     })
                                 ) : (
                                     <div className="col-span-3 text-center text-gray-500 py-4">No mentees available for this batch.</div>
                                 )}
                             </div>
                         </div>
                
                         {/* Footer Buttons */}
                         <div className="flex items-center gap-2 pt-4 border-t border-solid border-gray-200 dark:border-gray-700">
                             <button 
                                 type="button" 
                                 onClick={() => {
                                     setView("list");
                                     setNewlyCreatedGroup(null);
                                 }} 
                                 className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded text-sm font-semibold"
                             >
                                 Cancel
                             </button>
                             <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold shadow disabled:opacity-50">
                                 {loading ? 'Adding Mentees...' : 'Add Selected Mentees & Complete'}
                             </button>
                         </div>
                     </form>
                )}

            </div>

            {/* --- EDIT GROUP TITLE MODAL --- */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                <div className="fixed inset-0 bg-black opacity-50 transition-opacity" onClick={() => setIsEditModalOpen(false)}></div>
                
                <div className="relative w-full max-w-md mx-auto my-6 z-50">
                    <div className="relative flex flex-col w-full bg-white dark:bg-gray-800 border-0 rounded-lg shadow-lg outline-none focus:outline-none overflow-hidden">
                    
                    <div className="flex items-center justify-between p-5 border-b border-solid border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Edit Mentoring Group Title
                        </h3>
                        <button
                        className="p-1 ml-auto bg-transparent border-0 text-gray-400 hover:text-gray-650 float-right text-3xl leading-none font-semibold outline-none focus:outline-none cursor-pointer"
                        onClick={() => setIsEditModalOpen(false)}
                        >
                        <span className="text-gray-400 block h-6 w-6 text-2xl outline-none focus:outline-none">×</span>
                        </button>
                    </div>

                    <form onSubmit={handleEditSubmit}>
                        <div className="relative p-6 flex-auto space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Group Title: <span className="text-red-500">*</span>
                            </label>
                            <input
                            type="text"
                            value={editTitleInput}
                            onChange={(e) => {
                                setEditTitleInput(e.target.value);
                                if (e.target.value.trim()) setEditErrors({});
                            }}
                            placeholder="Enter Group Title"
                            className={`w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                editErrors.group_title ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600"
                            }`}
                            />
                            {editErrors.group_title && (
                            <p className="mt-1 text-xs text-red-500 font-semibold">{editErrors.group_title}</p>
                            )}
                        </div>
                        </div>

                        <div className="flex items-center justify-end p-4 border-t border-solid border-gray-200 dark:border-gray-700 rounded-b bg-gray-50 dark:bg-gray-700/30 gap-2">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm font-semibold transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold shadow transition cursor-pointer"
                        >
                            Save
                        </button>
                        </div>
                    </form>

                    </div>
                </div>
                </div>
            )}

            {/* --- CONFIRM DELETE DIALOG --- */}
            {groupToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                <div className="fixed inset-0 bg-black opacity-50 transition-opacity" onClick={() => setGroupToDelete(null)}></div>
                
                <div className="relative w-full max-w-sm mx-auto my-6 z-50">
                    <div className="relative flex flex-col w-full bg-white dark:bg-gray-800 border-0 rounded-lg shadow-lg outline-none focus:outline-none overflow-hidden">
                    
                    <div className="flex items-center justify-between p-4 border-b border-solid border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                        <h3 className="text-md font-bold">Confirm Delete</h3>
                    </div>

                    <div className="p-5">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                        Are you sure you want to delete mentoring group{" "}
                        <strong className="text-gray-900 dark:text-white">
                            "{groupToDelete.group_title}"
                        </strong>
                        ? This action cannot be undone.
                        </p>
                    </div>

                    <div className="flex items-center justify-end p-4 border-t border-solid border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 gap-2">
                        <button
                        type="button"
                        onClick={() => setGroupToDelete(null)}
                        className="px-3.5 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm font-semibold transition cursor-pointer"
                        >
                        Cancel
                        </button>
                        <button
                        type="button"
                        onClick={confirmDeleteGroup}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold shadow transition cursor-pointer"
                        >
                        Delete
                        </button>
                    </div>

                    </div>
                </div>
                </div>
            )}

            {/* --- ADD MENTOR POPUP (EXISTING GROUP) --- */}
            {isMentorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                <div className="fixed inset-0 bg-black opacity-50 transition-opacity" onClick={() => setIsMentorModalOpen(false)}></div>
                
                <div className="relative w-full max-w-sm mx-auto my-6 z-50">
                    <div className="relative flex flex-col w-full bg-white dark:bg-gray-800 border-0 rounded-lg shadow-lg outline-none focus:outline-none overflow-hidden">
                    
                    <div className="flex items-center justify-between p-5 border-b border-solid border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <h3 className="text-md font-bold text-gray-900 dark:text-white">
                        Add Mentor to {targetGroupForMentor?.group_title}
                        </h3>
                    </div>

                    <form onSubmit={handleAddMentorSubmit}>
                        <div className="p-5 space-y-4">
                            <div className="mb-3">
                                <label className="form-label font-semibold block mb-2 text-sm text-gray-700 dark:text-gray-300">
                                    Select Mentor(s)
                                </label>

                                <div className="border border-gray-300 dark:border-gray-600 rounded p-2 max-h-48 overflow-y-auto">
                                    {mentors.length > 0 ? (
                                        mentors.map((mentor: any) => (
                                            <div className="flex items-center mb-2 gap-2" key={mentor.user_id}>
                                                <input
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    type="checkbox"
                                                    id={`mentor-${mentor.user_id}`}
                                                    checked={selectedMentorIds.includes(Number(mentor.user_id))}
                                                    onChange={(e) => {
                                                        const mentorId = Number(mentor.user_id);
                                                        setSelectedMentorIds(prev =>
                                                            e.target.checked
                                                                ? [...prev, mentorId]
                                                                : prev.filter(id => id !== mentorId)
                                                        );
                                                    }}
                                                />
                                                <label
                                                    className="text-sm cursor-pointer text-gray-700 dark:text-gray-300"
                                                    htmlFor={`mentor-${mentor.user_id}`}
                                                >
                                                    {mentor.name}
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-gray-500 text-sm text-center py-2">
                                            No mentors available
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end p-4 border-t border-solid border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 gap-2">
                        <button
                            type="button"
                            onClick={() => setIsMentorModalOpen(false)}
                            className="px-3.5 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm font-semibold transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold shadow transition cursor-pointer"
                        >
                            Add
                        </button>
                        </div>
                    </form>

                    </div>
                </div>
                </div>
            )}

            {/* --- ADD MENTEE POPUP (EXISTING GROUP) --- */}
            {isMenteeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                    <div className="fixed inset-0 bg-black opacity-50 transition-opacity" onClick={() => setIsMenteeModalOpen(false)}></div>
                    
                    <div className="relative w-full max-w-sm mx-auto my-6 z-50">
                        <div className="relative flex flex-col w-full bg-white dark:bg-gray-800 border-0 rounded-lg shadow-lg outline-none focus:outline-none overflow-hidden">
                            
                            <div className="flex items-center justify-between p-5 border-b border-solid border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                <h3 className="text-md font-bold text-gray-900 dark:text-white">
                                    Add Mentee to {targetGroupForMentee?.group_title}
                                </h3>
                            </div>
                            <form onSubmit={handleAddMenteeSubmit}>
                                <div className="p-5 space-y-4">
                                    <div className="mb-3">
                                        <label className="form-label font-semibold block mb-2 text-sm text-gray-700 dark:text-gray-300">
                                            Select Mentee(s)
                                        </label>
                                        <div className="border border-gray-300 dark:border-gray-600 rounded p-2 max-h-48 overflow-y-auto">
                                            {mentees.length > 0 ? (
                                                mentees.map((mentee: any, index: number) => {
                                                    const menteeId = mentee.user_id ? Number(mentee.user_id) : `fallback-${index}`;
                                                    const isChecked = selectedMenteeIds.includes(menteeId as any);

                                                    return (
                                                        <div className="flex items-center mb-2 gap-2" key={`mentee-row-${menteeId}-${index}`}>
                                                            <input
                                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                type="checkbox"
                                                                id={`mentee-${menteeId}-${index}`}
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    const isNowChecked = e.target.checked;
                                                                    setSelectedMenteeIds(prev => 
                                                                        isNowChecked 
                                                                            ? [...prev, menteeId as any] 
                                                                            : prev.filter(id => id !== menteeId)
                                                                    );
                                                                }}
                                                            />
                                                            <label
                                                                className="text-sm cursor-pointer text-gray-700 dark:text-gray-300"
                                                                htmlFor={`mentee-${menteeId}-${index}`}
                                                            >
                                                                {mentee.name || "Unknown Mentee"}
                                                            </label>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-gray-500 text-sm text-center py-2">
                                                    No mentees available
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end p-4 border-t border-solid border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsMenteeModalOpen(false)}
                                        className="px-3.5 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm font-semibold transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold shadow transition cursor-pointer"
                                    >
                                        Add
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </MentoringPageLayout>
    );
};

export default MapMentorMenteePage;
