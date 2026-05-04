import { useRef, useState } from "react";
import { Download, Loader2, FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { TrialQualTimeline } from "./TrialQualTimeline";
import type { Trial } from "@shared/schema";

type Props = {
  trial: Trial | null;
  open: boolean;
  onClose: () => void;
};

export function TrialTimelineModal({ trial, open, onClose }: Props) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);
  const { toast } = useToast();

  const filenameBase = trial
    ? `${trial.nctId}_qual-timeline_${new Date().toISOString().slice(0, 10)}`
    : "qual-timeline";

  async function captureCanvas(): Promise<HTMLCanvasElement> {
    if (!exportRef.current) throw new Error("Timeline not mounted");
    // html2canvas dynamically imported to keep the initial bundle small
    const html2canvasMod = await import("html2canvas");
    const html2canvas = html2canvasMod.default;
    return html2canvas(exportRef.current, {
      backgroundColor: "#FFFFFF",
      scale: 2, // crisp PNG
      useCORS: true,
      logging: false,
    });
  }

  async function downloadPng() {
    if (!trial) return;
    setExporting("png");
    try {
      const canvas = await captureCanvas();
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filenameBase}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast({ title: "PNG exported", description: `${filenameBase}.png` });
    } catch (err) {
      toast({
        title: "PNG export failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  }

  async function downloadPdf() {
    if (!trial) return;
    setExporting("pdf");
    try {
      const canvas = await captureCanvas();
      const jsPdfMod = await import("jspdf");
      const { jsPDF } = jsPdfMod;
      // Landscape Letter (792 x 612 pt) — fits the 1280x720 timeline cleanly
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "letter",
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;

      const ratio = canvas.width / canvas.height;
      let drawW = maxW;
      let drawH = drawW / ratio;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * ratio;
      }
      const drawX = (pageW - drawW) / 2;
      const drawY = (pageH - drawH) / 2;

      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        drawX,
        drawY,
        drawW,
        drawH,
        undefined,
        "FAST",
      );
      pdf.save(`${filenameBase}.pdf`);
      toast({ title: "PDF exported", description: `${filenameBase}.pdf` });
    } catch (err) {
      toast({
        title: "PDF export failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-[95vw] w-[1360px] max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0"
        data-testid="modal-qual-timeline"
      >
        <DialogHeader className="flex-row items-center justify-between gap-3 pl-5 pr-14 py-3 border-b border-card-border bg-card">
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold leading-tight truncate">
              Qualitative MR engagement timeline
            </DialogTitle>
            <DialogDescription className="text-xs mt-0.5 truncate">
              {trial ? trial.briefTitle : ""}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={downloadPng}
              disabled={!trial || exporting !== null}
              data-testid="button-export-timeline-png"
            >
              {exporting === "png" ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <FileImage className="h-3.5 w-3.5 mr-1.5" />
              )}
              PNG
            </Button>
            <Button
              size="sm"
              onClick={downloadPdf}
              disabled={!trial || exporting !== null}
              data-testid="button-export-timeline-pdf"
            >
              {exporting === "pdf" ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5 mr-1.5" />
              )}
              PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-auto bg-slate-50 p-6 flex-1">
          {trial && (
            <div className="mx-auto" style={{ width: "1280px" }}>
              <div className="rounded-lg shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white">
                <TrialQualTimeline ref={exportRef} trial={trial} />
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
                <Download className="h-3 w-3" />
                Export this timeline as a high-resolution PNG or single-page landscape PDF.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
