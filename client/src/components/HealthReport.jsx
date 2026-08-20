import React from 'react';
import { FileCheck, AlertTriangle, Clock, Activity, User, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Renders structured medical intake report summary dashboard card
 */
export function HealthReport({ report }) {
  if (!report) return null;

  const isIncomplete = report.status === 'INCOMPLETE';

  return (
    <div className="w-full max-w-2xl mx-auto my-6 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
      {/* Report Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Medical Intake Summary</h3>
            <p className="text-xs text-slate-400">Synthesized Clinical Intake Assessment</p>
          </div>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${
            isIncomplete
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          {isIncomplete ? 'Incomplete Intake' : 'Complete Report'}
        </div>
      </div>

      {/* Structured Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
        {/* Patient Name */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <User className="w-3.5 h-3.5 text-teal-400" />
            <span>Patient Name</span>
          </div>
          <p className="text-sm font-semibold text-slate-200">{report.patientName || 'Not Provided'}</p>
        </div>

        {/* Chief Complaint */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Chief Complaint</span>
          </div>
          <p className="text-sm font-semibold text-slate-200">{report.chiefComplaint || 'N/A'}</p>
        </div>

        {/* Duration */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Onset & Duration</span>
          </div>
          <p className="text-sm font-semibold text-slate-200">{report.duration || 'N/A'}</p>
        </div>

        {/* Severity */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
            <span>Severity Rating</span>
          </div>
          <p className="text-sm font-semibold text-slate-200">{report.severity || 'N/A'}</p>
        </div>
      </div>

      {/* Associated Symptoms */}
      {report.associatedSymptoms && report.associatedSymptoms.length > 0 && (
        <div className="mb-4">
          <span className="text-xs font-medium text-slate-400 block mb-2">Associated Symptoms</span>
          <div className="flex flex-wrap gap-2">
            {report.associatedSymptoms.map((sym, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300"
              >
                {sym}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Summary */}
      {report.summary && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 mb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Executive Overview
          </span>
          <p className="text-xs leading-relaxed text-slate-300">{report.summary}</p>
        </div>
      )}

      {/* Red Flags / Follow-Up Recommendations */}
      {report.flaggedFollowUp && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider block mb-1">
              Red Flags & Recommended Follow-up
            </span>
            <p className="text-xs leading-relaxed">{report.flaggedFollowUp}</p>
          </div>
        </div>
      )}
    </div>
  );
}
