import React from 'react';
import { FileCheck, AlertTriangle, Clock, Activity, User, AlertCircle } from 'lucide-react';

/**
 * Human-Designed Light Theme Structured Medical Intake Report Card
 */
export function HealthReport({ report }) {
  if (!report) return null;

  const isIncomplete = report.status === 'INCOMPLETE';

  return (
    <div className="w-full max-w-2xl mx-auto my-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
      {/* Report Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Medical Intake Summary</h3>
            <p className="text-xs text-slate-500">Synthesized Clinical Intake Assessment</p>
          </div>
        </div>

        <div
          className={`px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide border ${
            isIncomplete
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {isIncomplete ? 'Incomplete Intake' : 'Complete Report'}
        </div>
      </div>

      {/* Structured Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-5">
        {/* Patient Name */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <User className="w-3.5 h-3.5 text-teal-600" />
            <span>Patient Name</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">{report.patientName || 'Not Provided'}</p>
        </div>

        {/* Chief Complaint */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>Chief Complaint</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">{report.chiefComplaint || 'N/A'}</p>
        </div>

        {/* Duration */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>Onset & Duration</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">{report.duration || 'N/A'}</p>
        </div>

        {/* Severity */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>Severity Rating</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">{report.severity || 'N/A'}</p>
        </div>
      </div>

      {/* Associated Symptoms */}
      {report.associatedSymptoms && report.associatedSymptoms.length > 0 && (
        <div className="mb-4">
          <span className="text-xs font-medium text-slate-500 block mb-2">Associated Symptoms</span>
          <div className="flex flex-wrap gap-2">
            {report.associatedSymptoms.map((sym, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700"
              >
                {sym}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Summary */}
      {report.summary && (
        <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100 mb-4">
          <span className="text-xs font-bold text-sky-800 uppercase tracking-wider block mb-1">
            Executive Overview
          </span>
          <p className="text-xs leading-relaxed text-slate-700">{report.summary}</p>
        </div>
      )}

      {/* Red Flags / Follow-Up Recommendations */}
      {report.flaggedFollowUp && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block mb-1 text-rose-900">
              Red Flags & Recommended Follow-up
            </span>
            <p className="text-xs leading-relaxed text-rose-800">{report.flaggedFollowUp}</p>
          </div>
        </div>
      )}
    </div>
  );
}
