import axiosInstance from "../../../utils/api";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";

export interface StudentAttendanceOption { value: string; label: string }
export interface StudentAttendanceFilters {
  curriculumId: string;
  termId: string;
  fromMonth: string;
  toMonth: string;
}
export interface StudentAttendanceSummaryRow {
  course: string;
  present: number;
  totalClasses: number;
  percentage: number;
  attendanceLevel: "success" | "warning" | "danger";
}
export interface StudentAttendanceDaywiseRow {
  attendanceId: number;
  course: string;
  attendance: string;
  attendanceDocument: string;
  attendanceDocumentUrl: string;
  documentStatus: string;
  attendanceDate: string;
  canUpload: boolean;
}

type ApiRow = Record<string, unknown>;

const api = ApiEndpoint.studentAttendanceReport;

const ensureArray = (value: unknown): ApiRow[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is ApiRow =>
        typeof item === "object" && item !== null && !Array.isArray(item),
    );
  }

  if (typeof value === "object" && value !== null) {
    const body = value as Record<string, unknown>;
    const nested = body.data ?? body.results ?? body.items;
    if (Array.isArray(nested)) {
      return ensureArray(nested);
    }
  }

  return [];
};

const errorMessage = (error: unknown, fallback: string) => {
  const value = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
  return value.response?.data?.detail || value.response?.data?.message || value.message || fallback;
};
const paramsFor = (filters: StudentAttendanceFilters) => ({
  academic_batch_id: filters.curriculumId,
  semester_id: filters.termId,
  from_month: filters.fromMonth,
  to_month: filters.toMonth,
});

export const getAttendanceCurriculums = async (): Promise<
  StudentAttendanceOption[]
> => {
  try {
    const response = await axiosInstance.get(api.curriculums);
    return ensureArray(response.data).map((row) => ({
      value: String(row.value ?? row.academic_batch_id ?? ""),
      label: String(row.label ?? row.academic_batch_desc ?? ""),
    }));
  } catch (error) {
    throw new Error(errorMessage(error, "Failed to load curriculums"));
  }
};

export const getAttendanceTerms = async (
  curriculumId: string,
): Promise<StudentAttendanceOption[]> => {
  try {
    const response = await axiosInstance.get(api.terms(curriculumId));
    return ensureArray(response.data).map((row) => ({
      value: String(row.value ?? row.semester_id ?? ""),
      label: String(row.label ?? row.semester_desc ?? ""),
    }));
  } catch (error) {
    throw new Error(errorMessage(error, "Failed to load terms"));
  }
};

export const getAttendanceSummary = async (
  filters: StudentAttendanceFilters,
): Promise<StudentAttendanceSummaryRow[]> => {
  try {
    const response = await axiosInstance.get(api.summary, {
      params: paramsFor(filters),
    });
    return ensureArray(response.data).map((row) => ({
      course: String(row.course ?? ""),
      present: Number(row.present ?? 0),
      totalClasses: Number(row.total_classes ?? 0),
      percentage: Number(row.percentage ?? 0),
      attendanceLevel: String(
        row.attendance_level ?? "danger",
      ) as StudentAttendanceSummaryRow["attendanceLevel"],
    }));
  } catch (error) {
    throw new Error(errorMessage(error, "Failed to load attendance summary"));
  }
};

export const getAttendanceDaywise = async (
  filters: StudentAttendanceFilters,
): Promise<StudentAttendanceDaywiseRow[]> => {
  try {
    const response = await axiosInstance.get(api.daywise, {
      params: paramsFor(filters),
    });
    return ensureArray(response.data).map((row) => ({
      attendanceId: Number(row.attendance_id ?? 0),
      course: String(row.course ?? ""),
      attendance: String(row.attendance ?? ""),
      attendanceDocument: String(row.attendance_document ?? ""),
      attendanceDocumentUrl: String(row.attendance_document_url ?? ""),
      documentStatus: String(row.document_status ?? ""),
      attendanceDate: String(row.attendance_date ?? ""),
      canUpload: Boolean(row.can_upload),
    }));
  } catch (error) {
    throw new Error(errorMessage(error, "Failed to load daywise attendance"));
  }
};


export const uploadAttendanceDocument = async (
  attendanceId: number,
  file: File,
) => {
  const form = new FormData();
  form.append("attendance_id", String(attendanceId));
  form.append("document", file);

  try {
    const response = await axiosInstance.post(api.uploadDocument, form);
    return response.data;
  } catch (error) {
    throw new Error(errorMessage(error, "Failed to upload document"));
  }
};

export const viewAttendanceDocument = async (
  attendanceId: number,
): Promise<void> => {
  try {
    const response = await axiosInstance.get(api.document(attendanceId), {
      responseType: "blob",
    });
    const blob =
      response.data instanceof Blob
        ? response.data
        : new Blob([response.data as BlobPart]);
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  } catch (error) {
    throw new Error(errorMessage(error, "Failed to open document"));
  }
};
