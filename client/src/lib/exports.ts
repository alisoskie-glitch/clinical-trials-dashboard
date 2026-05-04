/**
 * Export utilities: CSV, Excel, PDF report.
 */
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Trial } from "@shared/schema";
import { formatDate, formatPhase, formatStatus } from "./format";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCsv(trials: Trial[], company: string) {
  const headers = [
    "NCT ID",
    "Trial Name",
    "Acronym",
    "Specialty",
    "Phase",
    "Status",
    "Drug(s)",
    "Conditions",
    "Lead Sponsor",
    "Collaborators",
    "Primary Completion",
    "Completion Type",
    "Start Date",
    "Enrollment",
    "Last Update",
    "Recently Updated",
    "Why Stopped",
    "Primary Endpoints",
    "URL",
  ];
  const rows = trials.map((t) => [
    t.nctId,
    t.briefTitle,
    t.acronym ?? "",
    t.specialty,
    formatPhase(t.phase),
    formatStatus(t.overallStatus),
    t.drugNames.join("; "),
    t.conditions.join("; "),
    t.leadSponsor,
    t.collaborators.join("; "),
    formatDate(t.primaryCompletionDate),
    t.primaryCompletionDateType ?? "",
    formatDate(t.startDate),
    t.enrollmentCount ?? "",
    formatDate(t.lastUpdatePostDate),
    t.recentlyUpdated ? "Yes" : "No",
    t.whyStopped ?? "",
    t.primaryEndpoints.join(" | "),
    t.url,
  ]);

  // CSV
  const escape = (v: any) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const filename = `${company.replace(/\s+/g, "_")}_pipeline_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(blob, filename);
}

export function exportExcel(trials: Trial[], company: string) {
  const data = trials.map((t) => ({
    "NCT ID": t.nctId,
    "Trial Name": t.briefTitle,
    "Acronym": t.acronym ?? "",
    "Specialty": t.specialty,
    "Phase": formatPhase(t.phase),
    "Status": formatStatus(t.overallStatus),
    "Drug(s)": t.drugNames.join("; "),
    "Conditions": t.conditions.join("; "),
    "Lead Sponsor": t.leadSponsor,
    "Collaborators": t.collaborators.join("; "),
    "Primary Completion": formatDate(t.primaryCompletionDate),
    "Completion Type": t.primaryCompletionDateType ?? "",
    "Start Date": formatDate(t.startDate),
    "Enrollment": t.enrollmentCount ?? "",
    "Last Update": formatDate(t.lastUpdatePostDate),
    "Recently Updated": t.recentlyUpdated ? "Yes" : "No",
    "Primary Endpoints": t.primaryEndpoints.join(" | "),
    "URL": t.url,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${company.slice(0, 25)} Pipeline`);
  const filename = `${company.replace(/\s+/g, "_")}_pipeline_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportPdf(trials: Trial[], company: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(`${company} Clinical Pipeline`, 40, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Phase 2 & 3 trials completing through ${new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long" })}`, 40, 68);
  doc.text(`Generated ${today} · ${trials.length} trial${trials.length === 1 ? "" : "s"} · Source: ClinicalTrials.gov`, 40, 82);

  // Group trials by specialty
  const bySpecialty = new Map<string, Trial[]>();
  for (const t of trials) {
    if (!bySpecialty.has(t.specialty)) bySpecialty.set(t.specialty, []);
    bySpecialty.get(t.specialty)!.push(t);
  }
  const specialties = Array.from(bySpecialty.keys()).sort(
    (a, b) => bySpecialty.get(b)!.length - bySpecialty.get(a)!.length,
  );

  let yPos = 100;
  for (const specialty of specialties) {
    const specTrials = bySpecialty.get(specialty)!;
    // Sort chronologically
    specTrials.sort((a, b) => (a.primaryCompletionDate ?? "").localeCompare(b.primaryCompletionDate ?? ""));

    if (yPos > 500) {
      doc.addPage();
      yPos = 50;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30);
    doc.text(`${specialty} (${specTrials.length})`, 40, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [["Trial", "Phase", "Drug(s)", "Sponsor / Collaborators", "Completion", "Indications"]],
      body: specTrials.map((t) => [
        t.acronym ? `${t.briefTitle.slice(0, 60)}\n(${t.acronym}) · ${t.nctId}` : `${t.briefTitle.slice(0, 70)}\n${t.nctId}`,
        formatPhase(t.phase),
        t.drugNames.join(", ") || "—",
        t.collaborators.length
          ? `${t.leadSponsor}\n+ ${t.collaborators.slice(0, 2).join(", ")}${t.collaborators.length > 2 ? ` +${t.collaborators.length - 2}` : ""}`
          : t.leadSponsor,
        formatDate(t.primaryCompletionDate),
        t.conditions.slice(0, 3).join(", "),
      ]),
      margin: { left: 40, right: 40 },
      styles: { fontSize: 8, cellPadding: 4, valign: "top", overflow: "linebreak" },
      headStyles: { fillColor: [30, 64, 75], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 251] },
      columnStyles: {
        0: { cellWidth: 200 },
        1: { cellWidth: 45 },
        2: { cellWidth: 110 },
        3: { cellWidth: 130 },
        4: { cellWidth: 75 },
        5: { cellWidth: 150 },
      },
      didDrawPage: (data) => {
        // Footer
        const pageCount = doc.getNumberOfPages();
        const pageNum = doc.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8);
        doc.setTextColor(140);
        doc.text(
          `Pipeline Planner · ${company} Pipeline · Page ${pageNum}/${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 20,
          { align: "center" },
        );
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 24;
  }

  const filename = `${company.replace(/\s+/g, "_")}_pipeline_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
