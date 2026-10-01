
import axiosInstance from "../../../utils/api";
import { LmsApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";

export interface SelectOption { id: number; name: string; section_id?: number }
export interface SharedMaterial {
  mat_id: number;
  document_name: string;
  description?: string | null;
  topic_title?: string | null;
  license_flag?: number | null;
  created_date?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  url_flag: number;
  update_cnt: number;
  can_download: boolean;
}

interface MaterialListResponse {
  status: boolean;
  material_list: SharedMaterial[];
}

export const useStudentSharedMaterialService = () => {
  // const axiosInstance = useAxios();
  const api = LmsApiEndpoint.studentSharedMaterial;

  return {
    getCurriculums: async (): Promise<SelectOption[]> => {
      const response = await axiosInstance.get<SelectOption[]>(api.curriculums);
      return response.data;
    },
    getTerms: async (academicBatchId: number): Promise<SelectOption[]> => {
      const response = await axiosInstance.get<SelectOption[]>(api.terms, {
        params: { academic_batch_id: academicBatchId },
      });
      return response.data;
    },
    getCourses: async (academicBatchId: number, semesterId: number): Promise<SelectOption[]> => {
      const response = await axiosInstance.get<SelectOption[]>(api.courses, {
        params: { academic_batch_id: academicBatchId, semester_id: semesterId },
      });
      return response.data;
    },
    getMaterials: async (academicBatchId: number, semesterId: number, crsId: number): Promise<SharedMaterial[]> => {
      const response = await axiosInstance.get<MaterialListResponse>(api.materials, {
        params: { academic_batch_id: academicBatchId, semester_id: semesterId, crs_id: crsId },
      });
      return response.data?.material_list ?? [];
    },
    download: async (matId: number, fileIndex: number, filename: string) => {
      const response = await axiosInstance.get<Blob>(api.download(matId, fileIndex), {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  };
};
