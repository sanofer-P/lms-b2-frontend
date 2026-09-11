import axiosInstance from "../../../../utils/api";
import { LmsApiEndpoint } from "../../../../utils/ApiEndpoint/lmsApiEndpoint";
import { MentoringGroup } from "../../../../pages/mentoring/types/mapMentorMentee"; 

export const useMapMentorMenteeService = () => {
    
    const getCurriculums = async () => {
        const response = await axiosInstance.get<any>(LmsApiEndpoint.mentorMentee.academic_batch_list);
        return response.data?.data || []; 
    };

    const getGroups = async (academicBatchId: number): Promise<MentoringGroup[]> => {
        // Fix: Pass academic_batch_id as query parameter instead of appending to URL path
        const response = await axiosInstance.get<any>(
            LmsApiEndpoint.mentorMentee.group_list, 
            {
                params: {
                    academic_batch_id: academicBatchId
                }
            }
        );

        const rawGroups = response.data?.data || [];

        return rawGroups.map((item: any) => ({
            mentors_group_id: item.mentors_group_id,
            academic_batch_id: item.academic_batch_id,
            config_type_id: item.config_type_id,
            questionnaire_id: item.questionnaire_id,
            term_count: item.term_count,
            group_title: item.mentors_pgm_title || "", 
            mentors: item.mentors || [],
            mentees: item.mentees || [],
            session_status: item.session_status || "",
            session_date: item.session_date || null
        }));
    };


    const getTerms = async (academicBatchId: number) => {
        const response = await axiosInstance.get<any>(
            LmsApiEndpoint.mentorMentee.semesters_by_academic_batch,
            { params: { academic_batch_id: academicBatchId } }
        );
        return response.data?.data || [];
    };

    const getConfigTypes = async () => {
        const response = await axiosInstance.get<any>(LmsApiEndpoint.mentorMentee.get_config_types);
        return response.data?.data || [];
    };

    const getQuestionnaires = async (academicBatchId: number) => {
        const response = await axiosInstance.get<any>(
            LmsApiEndpoint.questionnaire.questionnaire_list,
            { params: { academic_batch_id: academicBatchId } }
        );
        return response.data?.data || [];
    };

    const getMentors = async (academicBatchId: number) => {
        const response = await axiosInstance.get<any>(
            LmsApiEndpoint.mentorMentee.get_all_mentors,
            { params: { academic_batch_id: academicBatchId } }
        );

        const rawMentors = response.data?.data || [];

        // Map backend's 'mentor_id' and 'mentor_name' keys 
        // to frontend's expected 'user_id' and 'name'
        return rawMentors.map((m: any) => ({
            user_id: m.mentor_id,
            name: m.mentor_name,
            email: m.email,
            mobile: m.mobile,
            department: m.department,
            is_cross_department: m.is_cross_department,
            mapped_groups: m.mapped_groups || []
        }));
    };

    const getMentees = async (academicBatchId: number) => {
        const response = await axiosInstance.get<any>(
            LmsApiEndpoint.mentorMentee.get_all_mentees,
            { params: { academic_batch_id: academicBatchId } }
        );

        const rawMentees = response.data?.data || [];

        // Map backend's 'mentee_id' and 'mentee_name' keys (assuming similar structures)
        // to frontend's expected 'user_id' and 'name'
        return rawMentees.map((m: any) => ({
            user_id: m.student_id,
            name: m.name,
            email: m.email,
            mobile: m.mobile,
            department: m.department
        }));
    };

    const createGroup = async (data: any) => {
        const response = await axiosInstance.post<any>(LmsApiEndpoint.mentorMentee.save_group, data);
        return response.data;
    };

    // In manageMentorMenteeService.ts

const updateGroup = async (
    groupId: number,
    data: any
) => {
    // The backend uses a single POST endpoint for both creating and updating.
    // We need to include the group ID in the payload for the backend's "EDIT" logic.
    const payload = {
        ...data,
        mentors_group_id: groupId 
    };

    // Use POST instead of PUT and send the full payload
    const response = await axiosInstance.post(
            LmsApiEndpoint.mentorMentee.save_group, // This should point to "lms_mentors_group/save_mentors_group"
            payload
        );
        return response.data;
    };

    const deleteGroup = async (groupId: number) => {
        const response = await axiosInstance.delete<any>(`${LmsApiEndpoint.mentorMentee.delete_mentors_group}/${groupId}`);
        return response.data;
    };

        const addMentor = async (groupId: number, mentorIds: number[]) => {
        const response = await axiosInstance.post<any>(
            // Just use the base endpoint without adding /groupId/mentors
            LmsApiEndpoint.mentorMentee.save_mentors, 
            {
                // Send BOTH the group ID and the mentor IDs inside the body
                mentors_group_id: groupId, 
                mentor_ids: mentorIds
            }
        );
        return response.data;
    };

    const addMentee = async (groupId: number, mentorIds: number[], menteeIds: number[]) => {
        const response = await axiosInstance.post<any>(
            LmsApiEndpoint.mentorMentee.save_mentees, 
            {
                // FIX: Send all three required fields
                mentors_group_id: groupId,
                mentor_ids: mentorIds,
                mentee_ids: menteeIds
            }
        );
        return response.data;
    };

    const getGroupMentees = async (mentorsGroupId: number) => {
        const response = await axiosInstance.get<any>(
            `${LmsApiEndpoint.mentorMentee.get_group_mentees}/${mentorsGroupId}`
        );
        // Handle both direct array and wrapped data
        if (Array.isArray(response.data)) return response.data;
        return response.data?.data || [];
    };

    const getGroupMentors = async (mentorsGroupId: number) => {
        const response = await axiosInstance.get<any>(
            `${LmsApiEndpoint.mentorMentee.get_group_mentors}/${mentorsGroupId}`
        );
        // Handle both direct array and wrapped data
        if (Array.isArray(response.data)) return response.data;
        return response.data?.data || [];
    };

    return {
        getCurriculums, getGroups, getTerms, getConfigTypes, getQuestionnaires, getGroupMentees, getGroupMentors,
        getMentors, getMentees, createGroup, updateGroup, deleteGroup, addMentor, addMentee
    };
};
