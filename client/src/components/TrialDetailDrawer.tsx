import type { Trial } from "@shared/schema";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Users, Calendar, Target, FlaskConical, Activity } from "lucide-react";
import { formatDate, formatPhase, formatStatus } from "@/lib/format";

interface Props {
  trial: Trial | null;
  open: boolean;
  onClose: () => void;
}

export function TrialDetailDrawer({ trial, open, onClose }: Props) {
  if (!trial) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        className="w-full sm:max-w-2xl overflow-y-auto"
        data-testid="trial-detail-drawer"
      >
        <SheetHeader className="space-y-3 pb-4 border-b border-border">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {trial.nctId}
            </Badge>
            <Badge variant="secondary">{formatPhase(trial.phase)}</Badge>
            <Badge variant="outline">{trial.specialty}</Badge>
            <Badge variant="outline">{formatStatus(trial.overallStatus)}</Badge>
            {trial.recentlyUpdated && (
              <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
                Recently updated
              </Badge>
            )}
          </div>
          <SheetTitle className="text-base font-semibold leading-snug text-left">
            {trial.briefTitle}
            {trial.acronym && (
              <span className="ml-2 text-sm font-medium text-muted-foreground">
                ({trial.acronym})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Description */}
          {trial.briefSummary && (
            <Section icon={<FlaskConical className="h-3.5 w-3.5" />} title="Summary">
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {trial.briefSummary}
              </p>
            </Section>
          )}

          {/* Key facts grid */}
          <Section icon={<Calendar className="h-3.5 w-3.5" />} title="Key Dates & Numbers">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <KV label="Start date" value={formatDate(trial.startDate)} />
              <KV
                label="Primary completion"
                value={
                  <>
                    {formatDate(trial.primaryCompletionDate)}{" "}
                    {trial.primaryCompletionDateType && (
                      <span className="text-xs text-muted-foreground">
                        ({trial.primaryCompletionDateType.toLowerCase()})
                      </span>
                    )}
                  </>
                }
              />
              <KV label="Completion date" value={formatDate(trial.completionDate)} />
              <KV
                label="Enrollment"
                value={trial.enrollmentCount?.toLocaleString() ?? "—"}
              />
              <KV label="Last updated" value={formatDate(trial.lastUpdatePostDate)} />
              <KV label="Study type" value={trial.studyType ?? "—"} />
            </dl>
          </Section>

          {/* Drugs / Interventions */}
          <Section icon={<Activity className="h-3.5 w-3.5" />} title="Interventions">
            {trial.allInterventions.length === 0 ? (
              <p className="text-sm text-muted-foreground">None listed</p>
            ) : (
              <ul className="space-y-1.5">
                {trial.allInterventions.map((i, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] mt-0.5 shrink-0">
                      {i.type}
                    </Badge>
                    <span className="text-foreground/90">{i.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Conditions */}
          <Section title="Conditions">
            <div className="flex flex-wrap gap-1.5">
              {trial.conditions.length === 0 ? (
                <span className="text-sm text-muted-foreground">None listed</span>
              ) : (
                trial.conditions.map((c) => (
                  <Badge key={c} variant="secondary" className="font-normal">
                    {c}
                  </Badge>
                ))
              )}
            </div>
          </Section>

          {/* Sponsorship */}
          <Section icon={<Users className="h-3.5 w-3.5" />} title="Sponsor & Collaborators">
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground mr-2">
                  Lead
                </span>
                <span className="font-medium">{trial.leadSponsor}</span>
              </div>
              {trial.collaborators.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground block mb-1">
                    Collaborators
                  </span>
                  <ul className="space-y-1">
                    {trial.collaborators.map((c) => (
                      <li key={c} className="text-foreground/90">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Section>

          {/* Endpoints */}
          {trial.primaryEndpoints.length > 0 && (
            <Section icon={<Target className="h-3.5 w-3.5" />} title="Primary Endpoints">
              <ul className="space-y-1.5 list-disc list-inside text-sm marker:text-muted-foreground">
                {trial.primaryEndpoints.map((e, i) => (
                  <li key={i} className="text-foreground/90">
                    {e}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {trial.secondaryEndpoints.length > 0 && (
            <Section title="Secondary Endpoints">
              <ul className="space-y-1.5 list-disc list-inside text-sm marker:text-muted-foreground">
                {trial.secondaryEndpoints.slice(0, 8).map((e, i) => (
                  <li key={i} className="text-foreground/80">
                    {e}
                  </li>
                ))}
                {trial.secondaryEndpoints.length > 8 && (
                  <li className="text-xs text-muted-foreground list-none">
                    +{trial.secondaryEndpoints.length - 8} more
                  </li>
                )}
              </ul>
            </Section>
          )}

          {trial.whyStopped && (
            <Section title="Why Stopped">
              <p className="text-sm text-destructive">{trial.whyStopped}</p>
            </Section>
          )}

          {/* External link */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(trial.url, "_blank")}
            data-testid="button-open-clinicaltrials"
          >
            View on ClinicalTrials.gov
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground/90 nums">{value}</dd>
    </div>
  );
}
