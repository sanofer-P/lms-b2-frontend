import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  SelectOption,
  SharedMaterial,
  useStudentSharedMaterialService,
} from "./studentSharedMaterialService";

const licenseName = (flag?: number | null) =>
  flag === 1 ? "Proprietary" : flag === 2 ? "Paid" : flag === 3 ? "Public" : "-";

const displayDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB").replaceAll("/", "-");
};

const stripBreaks = (value?: string | null) => (value || "-").replace(/<\/br>/gi, ", ");

export default function MaterialsList() {
  const service = useStudentSharedMaterialService();
  const [curriculums, setCurriculums] = useState<SelectOption[]>([]);
  const [terms, setTerms] = useState<SelectOption[]>([]);
  const [courses, setCourses] = useState<SelectOption[]>([]);
  const [materials, setMaterials] = useState<SharedMaterial[]>([]);
  const [curriculum, setCurriculum] = useState("");
  const [term, setTerm] = useState("");
  const [course, setCourse] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    service.getCurriculums().then(setCurriculums).catch(() => toast.error("Unable to load curricula"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeCurriculum = async (value: string) => {
    setCurriculum(value); setTerm(""); setCourse(""); setTerms([]); setCourses([]); setMaterials([]);
    if (!value) return;
    try { setTerms(await service.getTerms(Number(value))); }
    catch { toast.error("Unable to load terms"); }
  };

  const changeTerm = async (value: string) => {
    setTerm(value); setCourse(""); setCourses([]); setMaterials([]);
    if (!value) return;
    try { setCourses(await service.getCourses(Number(curriculum), Number(value))); }
    catch { toast.error("Unable to load courses"); }
  };

  const changeCourse = async (value: string) => {
    setCourse(value); setMaterials([]); setPage(1);
    if (!value) return;
    setLoading(true);
    try { setMaterials(await service.getMaterials(Number(curriculum), Number(term), Number(value))); }
    catch { toast.error("Unable to load shared materials"); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter((m) => [m.document_name, m.description, m.topic_title]
      .some((v) => (v || "").toLowerCase().includes(q)));
  }, [materials, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const downloadFiles = async (row: SharedMaterial) => {
    if (!row.can_download) return;

    const filePath = (row.file_path || "").trim();

    if (!filePath) {
      toast.error("Document path is not available");
      return;
    }

    const firstPath = filePath.split(",")[0].trim();

    const isExternalUrl =
      /^https?:\/\//i.test(firstPath);

    // Open only genuine external URLs directly.
    if (Number(row.url_flag) === 1 && isExternalUrl) {
      window.open(
        firstPath,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    // Relative paths such as uploads/materials/file.png
    // must be downloaded through FastAPI.
    const names = (
      row.file_name ||
      row.document_name ||
      "material"
    ).split(",");

    try {
      for (
        let index = 0;
        index < names.length;
        index += 1
      ) {
        await service.download(
          row.mat_id,
          index,
          names[index]?.trim() || `material-${index + 1}`
        );
      }
    } catch (error) {
      console.error("Material download error:", error);
      toast.error("Material document is missing from storage");
    }
  };

  const selectStyle = { width: "100%", padding: "7px 10px", border: "1px solid #ced4da", borderRadius: 4 };
  const cell = { padding: "10px 12px", borderBottom: "1px solid #dee2e6" };
  return (
    <div style={{ background: "#f4f6f9", minHeight: "100vh", fontFamily: "Segoe UI, Arial, sans-serif" }}>
      <div style={{ background: "#243447", color: "white", padding: "16px 24px", fontWeight: 700 }}>Materials List</div>
      <div style={{ background: "white", padding: 24, border: "1px solid #dee2e6" }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
          <div style={{ flex: 1, minWidth: 200 }}><label>Curriculum: <b style={{ color: "red" }}>*</b></label>
            <select style={selectStyle} value={curriculum} onChange={(e) => changeCurriculum(e.target.value)}>
              <option value="">Select Curriculum</option>{curriculums.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select></div>
          <div style={{ flex: 1, minWidth: 180 }}><label>Term: <b style={{ color: "red" }}>*</b></label>
            <select style={selectStyle} value={term} disabled={!curriculum} onChange={(e) => changeTerm(e.target.value)}>
              <option value="">Select Term</option>{terms.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select></div>
          <div style={{ flex: 1.5, minWidth: 240 }}><label>Course: <b style={{ color: "red" }}>*</b></label>
            <select style={selectStyle} value={course} disabled={!term} onChange={(e) => changeCourse(e.target.value)}>
              <option value="">Select Course</option>{courses.map(x => <option key={`${x.id}-${x.section_id}`} value={x.id}>{x.name}</option>)}
            </select></div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <label>Show <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
            {[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}</select> entries</label>
          <label>Search: <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
        </div>
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: "#d6e4f0" }}>{["Sl No.", "Document/Link Name", "Description", "Topic(s)", "License", "Shared Date", "View/Download"].map(h => <th key={h} style={cell}>{h}</th>)}</tr></thead>
          <tbody>{loading ? <tr><td colSpan={7} style={{ ...cell, textAlign: "center" }}>Loading...</td></tr> : visible.length === 0 ?
            <tr><td colSpan={7} style={{ ...cell, textAlign: "center" }}>No data available in table</td></tr> :
            visible.map((row, index) => <tr key={row.mat_id}>
              <td style={cell}>{(page - 1) * pageSize + index + 1}{row.update_cnt > 0 && <span title="Shared material details have been updated" style={{ color: "blue", marginLeft: 8 }}>ⓘ</span>}</td>
              <td style={cell}>{row.document_name}</td><td style={cell}>{row.description || "-"}</td>
              <td style={cell}>{stripBreaks(row.topic_title)}</td><td style={cell}>{licenseName(row.license_flag)}</td>
              <td style={cell}>{displayDate(row.created_date)}</td><td style={cell}>
                {row.can_download ? <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      downloadFiles(row);
                    }}
                    style={{
                      border: 0,
                      background: "none",
                      color: "#d89000",
                      cursor: "pointer",
                    }}
                  >
                    Download ↓
                </button> :
                  <b style={{ color: "maroon" }} title="Topic not covered yet completely.">Not available yet</b>}
              </td></tr>)}</tbody>
        </table></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries</span>
          <div><button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button> <b>{page}</b> <button disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</button></div>
        </div>
      </div>
    </div>
  );
}

