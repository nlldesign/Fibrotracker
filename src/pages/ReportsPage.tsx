import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFibroStore } from '../store/useFibroStore';
import {
  formatDateKey,
  formatHumanDate,
  generateClinicalReport,
  getTopBodyZones,
  getTopTriggers,
} from '../domain/riskEngine';
import { BODY_ZONE_MAP } from '../constants/clinicalData';
import { MedicationItem } from '../types/record';
import { downloadClinicalPdfDirect, getFibroPdfFilename } from '../utils/pdfExport';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClinicalIcon,
  Compass,
  Download,
  FileSpreadsheet,
  FileText,
  Pill,
  Plus,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SpoonIcon,
  Stethoscope,
  Trash2,
  Zap,
} from '../components/common/ClinicalIcons';

export const ReportsPage: React.FC = () => {
  const {
    records,
    patientMeta,
    updatePatientMeta,
    showToast,
    user,
    reportDaysFilter,
    reportCustomRange,
    setReportDaysFilter,
    setReportCustomRange,
    setSettingsModalOpen,
  } = useFibroStore();

  const [isClinicalModalOpen, setIsClinicalModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const todayStr = formatDateKey(new Date());
  const thirtyDaysAgoDate = new Date();
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 29);

  const [customStart, setCustomStart] = useState(
    reportCustomRange?.startDate || formatDateKey(thirtyDaysAgoDate)
  );
  const [customEnd, setCustomEnd] = useState(reportCustomRange?.endDate || todayStr);

  const report = generateClinicalReport(records, reportDaysFilter, reportCustomRange);

  const handleApplyCustomRange = () => {
    if (!customStart || !customEnd) return;
    if (customStart > customEnd) {
      showToast('A data inicial deve ser anterior à data final.');
      return;
    }
    setReportCustomRange({ startDate: customStart, endDate: customEnd });
    showToast(`Filtro aplicado: ${customStart} até ${customEnd}`);
  };

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    showToast(`Gerando ${getFibroPdfFilename()}...`);
    const ok = await downloadClinicalPdfDirect();
    setIsGeneratingPdf(false);
    if (ok) {
      showToast(`PDF (${getFibroPdfFilename()}) baixado com sucesso!`);
    } else {
      showToast('Não foi possível gerar o PDF. Tente novamente.');
    }
  };

  // Dynamic Medications Handlers
  const medicationsList: MedicationItem[] = patientMeta.medicationsList || [];

  const handleAddMedicationRow = () => {
    const nextItem: MedicationItem = {
      id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      frequency: '',
    };
    updatePatientMeta({
      medicationsList: [...medicationsList, nextItem],
    });
  };

  const handleUpdateMedicationRow = (
    id: string,
    field: 'name' | 'frequency',
    value: string
  ) => {
    const updated = medicationsList.map((m) =>
      m.id === id ? { ...m, [field]: value } : m
    );
    updatePatientMeta({ medicationsList: updated });
  };

  const handleRemoveMedicationRow = (id: string) => {
    const updated = medicationsList.filter((m) => m.id !== id);
    updatePatientMeta({ medicationsList: updated });
  };

  const openClinicalModal = () => {
    if (medicationsList.length === 0) {
      // Pre-populate 1 initial row if empty so user immediately sees the fields and "+ Remédios" below
      updatePatientMeta({
        medicationsList: [
          {
            id: `med_${Date.now()}`,
            name: patientMeta.continuousMedications || '',
            frequency: '',
          },
        ],
      });
    }
    setIsClinicalModalOpen(true);
  };

  const handleExportCsv = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();

    const headers = [
      'Data',
      'Status_Ciclo',
      'Dor_EVA_0_10',
      'Colheres_Energia_1_5',
      'Sono',
      'Nevoa_Mental',
      'Regioes_Corporais',
      'Qualidade_Dor',
      'Gatilhos',
      'Cuidados_Medicacao',
      'Anotacoes',
    ];

    const rows = report.entries.map(({ dateKey, rec, status }) => [
      dateKey,
      status === 'red' ? 'Crise' : status === 'yellow' ? 'Alerta' : 'Estavel',
      rec.pain,
      rec.spoons ?? 3,
      rec.sleep,
      rec.fog,
      (rec.bodyZones || []).join(';'),
      (rec.painQualities || []).join(';'),
      (rec.triggers || []).join(';'),
      (rec.reliefActions || []).join(';'),
      `"${(rec.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fibrocare_${dd}-${mm}-${yyyy}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Planilha fibrocare_${dd}-${mm}-${yyyy}.csv baixada!`);
  };

  const topZones = getTopBodyZones(records, 4);
  const topTriggers = getTopTriggers(records, 4);
  const validMedications = medicationsList.filter(
    (m) => m.name.trim() !== '' || m.frequency.trim() !== ''
  );

  return (
    <section className="page-fade space-y-6 pb-8">
      {/* Top Action & Filter Bar (Hidden when printing) */}
      <div className="print:hidden bg-gradient-to-r from-rosebrand-50 via-rosebrand-50/50 to-white dark:from-zinc-900 dark:to-zinc-900 rounded-3xl p-5 sm:p-6 border border-rosebrand-100 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400">
              Prontuário & Consulta Médica
            </span>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
              Relatório Clínico de Sintomas (ACR 2016)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Gera automaticamente o laudo PDF em 1 página com seus exames, remédios e histórico
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period Selector */}
            <div className="inline-flex rounded-2xl bg-white dark:bg-zinc-800 p-1 border border-rosebrand-100 dark:border-zinc-700">
              {[
                { days: 7, label: '7 dias' },
                { days: 14, label: '14 dias' },
                { days: 30, label: '30 dias' },
                { days: 90, label: '90 dias' },
              ].map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setReportDaysFilter(p.days)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    !reportCustomRange && reportDaysFilter === p.days
                      ? 'bg-rosebrand-500 text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-300 hover:text-rosebrand-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={openClinicalModal}
              className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-rosebrand-50 dark:hover:bg-zinc-700 text-rosebrand-700 dark:text-rosebrand-200 border border-rosebrand-200 dark:border-zinc-700 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <Stethoscope className="w-4 h-4 text-rosebrand-500 shrink-0" />
              <span>Exames & Remédios</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-rosebrand-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-rosebrand-200 dark:border-zinc-700 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-rosebrand-500 shrink-0" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2.5 rounded-2xl bg-rosebrand-500 hover:bg-rosebrand-600 disabled:opacity-60 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Baixar PDF'}</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range Bar (Fixed dark mode button contrast) */}
        <div className="pt-3 border-t border-rosebrand-100/70 dark:border-zinc-800 flex flex-wrap items-center gap-2.5 text-xs">
          <span className="font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-rosebrand-500 shrink-0" />
            <span>Filtrar por Período Específico:</span>
          </span>
          <input
            type="date"
            value={customStart}
            max={customEnd}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-rosebrand-200 dark:border-zinc-700"
          />
          <span className="text-zinc-400">até</span>
          <input
            type="date"
            value={customEnd}
            min={customStart}
            max={todayStr}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-rosebrand-200 dark:border-zinc-700"
          />
          <button
            type="button"
            onClick={handleApplyCustomRange}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white dark:text-zinc-100 border border-zinc-900 dark:border-zinc-600 font-bold transition whitespace-nowrap"
          >
            Aplicar Período
          </button>
          {reportCustomRange && (
            <button
              type="button"
              onClick={() => setReportDaysFilter(30)}
              className="text-rosebrand-600 dark:text-rosebrand-400 underline font-semibold whitespace-nowrap"
            >
              Limpar filtro personalizado
            </button>
          )}
        </div>
      </div>

      {/* Printable / Exportable Single-Page Clinical Sheet */}
      <div
        id="clinical-sheet-content"
        className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-7 border border-rosebrand-100 dark:border-zinc-800 shadow-sm space-y-5 print:border-none print:shadow-none print:p-0"
      >
        {/* Patient & Doctor Identification Header (Full-Width Mobile-First Layout) */}
        <div className="space-y-3 pb-4 border-b border-rosebrand-100 dark:border-zinc-800">
          {/* Top Row: Title, Date Pill & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white leading-snug">
                Laudo de Acompanhamento Diário — Fibromialgia
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap bg-rosebrand-100 text-rosebrand-800 dark:bg-rosebrand-950/90 dark:text-rosebrand-200 dark:border dark:border-rosebrand-800/60">
                  {report.startKey} a {report.endKey} ({report.totalLoggedDays} registros)
                </span>
              </div>
            </div>

            <div
              className="print:hidden flex items-center gap-2 w-full sm:w-auto shrink-0"
              data-pdf-hide="true"
            >
              <button
                type="button"
                onClick={openClinicalModal}
                className="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl bg-rosebrand-50 dark:bg-zinc-800 hover:bg-rosebrand-100 dark:hover:bg-zinc-700 text-xs font-bold text-rosebrand-600 dark:text-rosebrand-300 border border-rosebrand-200 dark:border-zinc-700 transition flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Editar Exames / Remédios</span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(true)}
                className="p-2 rounded-xl bg-rosebrand-50 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white border border-rosebrand-100 dark:border-zinc-700 transition shrink-0"
                title="Configurações"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Second Row: Patient & Assistant Doctor Info (100% Width) */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-1 gap-x-3 text-xs text-zinc-600 dark:text-zinc-300">
            <div>
              Paciente:{' '}
              <strong className="text-zinc-900 dark:text-white">
                {patientMeta.patientName || user?.fullName || user?.email || 'Não informado'}
              </strong>
            </div>
            <span className="hidden sm:inline text-zinc-400">•</span>
            <div>
              Médico(a) Assistente:{' '}
              <strong className="text-zinc-900 dark:text-white">
                {patientMeta.doctorName || 'Reumatologia / Clínica da Dor'}
              </strong>
            </div>
          </div>

          {/* Third Row: Medications & Exams Clinical Context Box (100% Width Grid) */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="w-full p-3.5 rounded-2xl bg-rosebrand-50/40 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Pill className="w-3.5 h-3.5 text-rosebrand-500 dark:text-rosebrand-400 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400">
                  Medicações & Frequência de Uso
                </span>
              </div>
              {validMedications.length > 0 ? (
                <ul className="space-y-1 text-zinc-700 dark:text-zinc-200">
                  {validMedications.map((m) => (
                    <li key={m.id} className="flex items-baseline justify-between gap-2">
                      <strong className="font-semibold">{m.name || 'Medicação'}</strong>
                      {m.frequency && (
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {m.frequency}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : patientMeta.continuousMedications ? (
                <p className="text-zinc-700 dark:text-zinc-200">
                  {patientMeta.continuousMedications}
                </p>
              ) : (
                <p className="text-zinc-400 italic">Nenhuma medicação cadastrada</p>
              )}
            </div>

            <div className="w-full p-3.5 rounded-2xl bg-rosebrand-50/40 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-rosebrand-500 dark:text-rosebrand-400 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400">
                  Exames Complementares Recentes
                </span>
              </div>
              {patientMeta.clinicalExams ? (
                <p className="text-zinc-700 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
                  {patientMeta.clinicalExams}
                </p>
              ) : (
                <p className="text-zinc-400 italic">Nenhum exame informado</p>
              )}
            </div>
          </div>
        </div>

        {/* Row 1: 4 Redesigned Clinical KPI Cards (Clean, No Broken Words) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* KPI 1: Média de Dor (EVA) */}
          <div className="p-4 rounded-2xl bg-rosebrand-50/40 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                Média de Dor (EVA)
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                  {report.avgPain}
                </span>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  / 10
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap flex items-center gap-1 bg-rosebrand-100/80 text-rosebrand-800 dark:bg-rosebrand-950/90 dark:text-rosebrand-200 dark:border dark:border-rosebrand-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-rosebrand-500" />
                <span>{report.redDays}d crise</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap flex items-center gap-1 bg-amber-100/80 text-amber-800 dark:bg-amber-950/90 dark:text-amber-200 dark:border dark:border-amber-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{report.yellowDays}d alerta</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap flex items-center gap-1 bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{report.greenDays}d estável</span>
              </span>
            </div>
          </div>

          {/* KPI 2: Energia Média (Spoon Theory) */}
          <div className="p-4 rounded-2xl bg-rosebrand-50/40 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                Energia (Spoon Theory)
              </span>
              <div className="flex items-baseline gap-1.5 mt-1 whitespace-nowrap">
                <SpoonIcon className="w-5 h-5 text-rosebrand-500 self-center shrink-0" />
                <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                  {report.avgSpoons}
                </span>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  / 5 colheres
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className={`h-1.5 rounded-full ${
                      n <= Math.round(report.avgSpoons)
                        ? 'bg-rosebrand-500'
                        : 'bg-rosebrand-200/60 dark:bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Reserva funcional diária
              </p>
            </div>
          </div>

          {/* KPI 3: Medicação SOS vs. Contínua */}
          <div className="p-4 rounded-2xl bg-rosebrand-50/40 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                Medicação SOS & Contínua
              </span>
              <div className="flex items-baseline gap-1.5 mt-1 whitespace-nowrap">
                <ShieldAlert className="w-5 h-5 text-rosebrand-500 self-center shrink-0" />
                <span className="text-2xl font-extrabold text-rosebrand-600 dark:text-rosebrand-400">
                  {report.sosDays}d
                </span>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  com resgate SOS
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-rosebrand-100/80 dark:border-zinc-700/70 flex items-center justify-between text-[11px]">
              <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                <Pill className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Adesão contínua:</span>
              </span>
              <strong className="text-zinc-900 dark:text-white whitespace-nowrap">
                {report.continuousMedDays} dias
              </strong>
            </div>
          </div>

          {/* KPI 4: Índices ACR (Últimos 7d) */}
          <div className="p-4 rounded-2xl bg-rosebrand-50/40 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                Índices ACR (Últimos 7d)
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-200 dark:border-zinc-700 text-xs font-extrabold text-zinc-900 dark:text-white whitespace-nowrap">
                  WPI: {report.wpiScore}/19
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-200 dark:border-zinc-700 text-xs font-extrabold text-zinc-900 dark:text-white whitespace-nowrap">
                  SSS: {report.sssScore}/12
                </span>
              </div>
            </div>

            <div className="mt-3">
              {report.meetsAcrThreshold ? (
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  <span>Compatível com atividade ACR</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                  <span>Abaixo do limiar de crise ACR</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Anatomical Pain Distribution & Pain Characteristics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Anatomical Regions */}
          <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-rosebrand-100 dark:border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400 mb-2.5 flex items-center gap-1.5">
              <Compass className="w-4 h-4 shrink-0" />
              <span>Regiões Anatômicas Mais Afetadas</span>
            </h4>
            {topZones.length > 0 ? (
              <div className="space-y-2">
                {topZones.map((z) => (
                  <div key={z.id} className="flex items-center justify-between text-xs gap-2">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      {z.label}
                    </span>
                    <span className="font-bold text-rosebrand-600 dark:text-rosebrand-400 whitespace-nowrap shrink-0">
                      {z.count} dias ({z.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400">
                Nenhuma região corporal registrada no período.
              </p>
            )}
          </div>

          {/* Pain Qualities & Triggers */}
          <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-rosebrand-100 dark:border-zinc-800 space-y-3.5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400 mb-2 flex items-center gap-1.5">
                <Zap className="w-4 h-4 shrink-0" />
                <span>Característica da Dor Relatada</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {report.topQualities.length > 0 ? (
                  report.topQualities.map((q) => (
                    <span
                      key={q.key}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-100 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1.5"
                    >
                      <ClinicalIcon name={q.key} className="w-3.5 h-3.5 text-rosebrand-500" />
                      <span>
                        {q.shortLabel}: <strong>{q.count}d</strong>
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-400">Sem especificação de tipo de dor.</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 shrink-0" />
                <span>Principais Gatilhos & Sintomas Associados</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {topTriggers.map((t) => (
                  <span
                    key={t.key}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-100 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1.5"
                  >
                    <ClinicalIcon name={t.key} className="w-3.5 h-3.5 text-rosebrand-500" />
                    <span>
                      {t.pillLabel}: <strong>{t.count}x</strong>
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Chronological Table for the Doctor (Compact for 1-page A4 fit) */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400 mb-2 flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 shrink-0" />
            <span>Histórico Cronológico Detalhado</span>
          </h4>
          <div className="overflow-x-auto rounded-2xl border border-rosebrand-100 dark:border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-rosebrand-50/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-2.5">Fase</th>
                  <th className="py-2.5 px-2.5">Dor</th>
                  <th className="py-2.5 px-2.5">Energia</th>
                  <th className="py-2.5 px-2.5">Sono / Fog</th>
                  <th className="py-2.5 px-2.5">Áreas & Tipo</th>
                  <th className="py-2.5 px-3">Medicação / Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rosebrand-100/60 dark:divide-zinc-800">
                {report.entries
                  .slice()
                  .reverse()
                  .slice(0, 12)
                  .map(({ dateKey, rec, status }) => (
                    <tr
                      key={dateKey}
                      className="hover:bg-rosebrand-50/20 dark:hover:bg-zinc-800/40"
                    >
                      <td className="py-2 px-3 font-semibold whitespace-nowrap">
                        {formatHumanDate(dateKey)}
                      </td>
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        {status === 'red' && (
                          <span className="px-2 py-0.5 rounded-full bg-rosebrand-100 text-rosebrand-800 dark:bg-rosebrand-950 dark:text-rosebrand-200 font-bold text-[10px]">
                            Crise
                          </span>
                        )}
                        {status === 'yellow' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 font-bold text-[10px]">
                            Alerta
                          </span>
                        )}
                        {status === 'green' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 font-bold text-[10px]">
                            Estável
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 font-bold whitespace-nowrap">{rec.pain}/10</td>
                      <td className="py-2 px-2.5 whitespace-nowrap">{rec.spoons ?? 3}/5</td>
                      <td className="py-2 px-2.5 whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                        Sono: {rec.sleep} • Fog: {rec.fog}
                      </td>
                      <td className="py-2 px-2.5 max-w-[180px]">
                        <div className="truncate font-medium text-zinc-700 dark:text-zinc-200">
                          {(rec.bodyZones || [])
                            .map((z) => BODY_ZONE_MAP[z]?.shortLabel || z)
                            .join(', ') || '—'}
                        </div>
                        {rec.painQualities && rec.painQualities.length > 0 && (
                          <div className="text-[10px] text-rosebrand-500">
                            Tipo: {rec.painQualities.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 max-w-[220px]">
                        {rec.reliefActions?.includes('med_sos') && (
                          <span className="inline-block mr-1.5 px-1.5 py-0.5 rounded bg-rosebrand-100 dark:bg-rosebrand-950 text-rosebrand-700 dark:text-rosebrand-200 font-bold text-[10px]">
                            SOS
                          </span>
                        )}
                        <span className="text-zinc-500 dark:text-zinc-300 italic truncate block">
                          {rec.notes || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-3 border-t border-rosebrand-100 dark:border-zinc-800 text-[10px] text-zinc-400 flex flex-wrap justify-between gap-2">
          <span>
            Relatório gerado pelo FibroCare — Monitor Cíclico & Autogestão da Fibromialgia
          </span>
          <span>
            Nota: Os indicadores WPI e SSS apoiam o acompanhamento clínico e não substituem
            avaliação médica presencial.
          </span>
        </div>
      </div>

      {/* Modal de Preenchimento: Exames, Dados do Paciente & Lista Dinâmica "+ Remédios" */}
      {isClinicalModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsClinicalModalOpen(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-3xl p-5 sm:p-7 border border-rosebrand-100 dark:border-zinc-800 shadow-2xl space-y-5 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-rosebrand-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-rosebrand-100 dark:bg-rosebrand-950 text-rosebrand-600 dark:text-rosebrand-300 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white">
                      Dados do Laudo, Exames & Medicações
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Preencha seus exames e a frequência dos seus remédios para o relatório médico
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClinicalModalOpen(false)}
                  className="p-2 rounded-xl bg-rosebrand-50 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Patient & Doctor Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-200">
                    Nome da Paciente *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ana Paula Silva"
                    value={patientMeta.patientName}
                    onChange={(e) => updatePatientMeta({ patientName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-rosebrand-50/40 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-200">
                    Médico(a) / Especialidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Dr. Roberto (Reumatologista)"
                    value={patientMeta.doctorName}
                    onChange={(e) => updatePatientMeta({ doctorName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-rosebrand-50/40 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Dynamic Medications List + "+ Remédios" Button */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-rosebrand-500" />
                    <span>Medicações em Uso & Frequência</span>
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    {medicationsList.length}{' '}
                    {medicationsList.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {medicationsList.map((med, idx) => (
                    <div
                      key={med.id}
                      className="p-3 rounded-2xl bg-rosebrand-50/40 dark:bg-zinc-800/70 border border-rosebrand-100 dark:border-zinc-700 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[11px] font-bold text-rosebrand-500 w-5 text-center shrink-0">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          placeholder="Remédio e dose (Ex: Pregabalina 75mg)"
                          value={med.name}
                          onChange={(e) =>
                            handleUpdateMedicationRow(med.id, 'name', e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2 sm:w-56">
                        <input
                          type="text"
                          placeholder="Frequência (Ex: 1x à noite)"
                          value={med.frequency}
                          onChange={(e) =>
                            handleUpdateMedicationRow(med.id, 'frequency', e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicationRow(med.id)}
                          className="p-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-zinc-400 hover:text-rose-600 border border-rosebrand-100 dark:border-zinc-700 transition shrink-0"
                          title="Remover remédio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddMedicationRow}
                  className="w-full py-2.5 px-4 rounded-2xl border-2 border-dashed border-rosebrand-300 dark:border-zinc-700 hover:border-rosebrand-500 dark:hover:border-rosebrand-500 text-rosebrand-600 dark:text-rosebrand-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-rosebrand-50/50 dark:hover:bg-zinc-800/60 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Remédios (Adicionar mais um medicamento)</span>
                </button>
              </div>

              {/* Clinical Exams Textarea */}
              <div className="text-xs">
                <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-rosebrand-500" />
                  <span>Exames Realizados & Resultados Relevantes</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Hemograma, VHS e PCR normais (Out/2026) • Vitamina D: 32 ng/mL • Ressonância cervical sem compressão nervosa..."
                  value={patientMeta.clinicalExams}
                  onChange={(e) => updatePatientMeta({ clinicalExams: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-rosebrand-50/40 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-zinc-900 dark:text-white resize-none"
                />
              </div>

              {/* Save Button */}
              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsClinicalModalOpen(false);
                    showToast('Dados do laudo, exames e medicações salvos!');
                  }}
                  className="flex-1 py-3.5 px-5 rounded-2xl bg-rosebrand-500 hover:bg-rosebrand-600 text-white text-xs font-bold uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Dados no Relatório</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};
