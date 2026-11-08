import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFibroStore } from '../../store/useFibroStore';
import { formatDateKey, generateClinicalReport } from '../../domain/riskEngine';
import { downloadClinicalPdfDirect, getFibroPdfFilename } from '../../utils/pdfExport';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Settings,
  SlidersHorizontal,
  Stethoscope,
  Zap,
} from '../common/ClinicalIcons';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setSettingsModalOpen,
    checkinDefaultMode,
    setCheckinDefaultMode,
    user,
    signOut,
    patientMeta,
    updatePatientMeta,
    records,
    openReportForPeriod,
    showToast,
  } = useFibroStore();

  const todayStr = formatDateKey(new Date());
  const thirtyDaysAgoDate = new Date();
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 29);
  const defaultStartStr = formatDateKey(thirtyDaysAgoDate);

  const [exportPreset, setExportPreset] = useState<'7' | '30' | '90' | 'custom'>('30');
  const [customStart, setCustomStart] = useState(defaultStartStr);
  const [customEnd, setCustomEnd] = useState(todayStr);

  if (!isSettingsModalOpen) return null;

  const getSelectedRangeParams = () => {
    if (exportPreset === 'custom') {
      return {
        days: 30,
        customRange: { startDate: customStart, endDate: customEnd },
      };
    }
    return {
      days: Number(exportPreset),
      customRange: null,
    };
  };

  const handleOpenDetailedReportAndDownloadPdf = () => {
    const { days, customRange } = getSelectedRangeParams();
    openReportForPeriod(days, customRange);
    showToast(`Gerando ${getFibroPdfFilename()}...`);
    setTimeout(async () => {
      const ok = await downloadClinicalPdfDirect();
      if (ok) {
        showToast(`PDF (${getFibroPdfFilename()}) baixado automaticamente!`);
      }
    }, 350);
  };

  const handleViewDetailedReport = () => {
    const { days, customRange } = getSelectedRangeParams();
    openReportForPeriod(days, customRange);
  };

  const handleExportCsvByPeriod = () => {
    const { days, customRange } = getSelectedRangeParams();
    const report = generateClinicalReport(records, days, customRange);

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
    showToast(`Planilha fibrocare_${dd}-${mm}-${yyyy}.csv exportada!`);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={() => setSettingsModalOpen(false)}
    >
      <div
        className="bg-white dark:bg-zinc-900 w-full max-w-xl max-h-[88vh] overflow-y-auto my-auto rounded-3xl p-5 sm:p-7 border border-rosebrand-100 dark:border-zinc-800 shadow-2xl relative space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setSettingsModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl bg-rosebrand-50 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-rosebrand-100 dark:bg-rosebrand-950 text-rosebrand-600 dark:text-rosebrand-300 flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-400">
              Preferências & Exportação Clínica
            </span>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Configurações do FibroCare
            </h3>
          </div>
        </div>

        {/* SECTION 1: Default Check-in Mode Preference */}
        <div className="p-4 sm:p-5 rounded-2xl bg-rosebrand-50/50 dark:bg-zinc-800/70 border border-rosebrand-100 dark:border-zinc-700 space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400 block">
              Experiência de Preenchimento
            </span>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">
              Qual versão do Check-in sempre exibir por padrão?
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Escolha como a aba &ldquo;Registrar&rdquo; deve abrir toda vez que você entrar no
              aplicativo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setCheckinDefaultMode('simple');
                showToast('Modo Simples definido como padrão!');
              }}
              className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                checkinDefaultMode === 'simple'
                  ? 'bg-rosebrand-500 border-rosebrand-500 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 border-rosebrand-100 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-rosebrand-50'
              }`}
            >
              <Zap
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  checkinDefaultMode === 'simple' ? 'text-white' : 'text-rosebrand-500'
                }`}
              />
              <div className="text-xs">
                <div className="font-extrabold flex items-center gap-1.5">
                  <span>Versão Simples</span>
                  {checkinDefaultMode === 'simple' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <p
                  className={`text-[11px] mt-0.5 leading-snug ${
                    checkinDefaultMode === 'simple'
                      ? 'text-rosebrand-50'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  Apenas informações principais (Dor, Colheres, Sono, Fog e Medicação).
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setCheckinDefaultMode('advanced');
                showToast('Modo Avançado definido como padrão!');
              }}
              className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                checkinDefaultMode === 'advanced'
                  ? 'bg-rosebrand-500 border-rosebrand-500 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 border-rosebrand-100 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-rosebrand-50'
              }`}
            >
              <SlidersHorizontal
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  checkinDefaultMode === 'advanced' ? 'text-white' : 'text-rosebrand-500'
                }`}
              />
              <div className="text-xs">
                <div className="font-extrabold flex items-center gap-1.5">
                  <span>Versão Avançada</span>
                  {checkinDefaultMode === 'advanced' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <p
                  className={`text-[11px] mt-0.5 leading-snug ${
                    checkinDefaultMode === 'advanced'
                      ? 'text-rosebrand-50'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  Mostra tudo (inclui Mapa Corporal de Dor, Gatilhos e Anotações).
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 2: Export Detailed Report for Doctor by Period */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rosebrand-50 via-rosebrand-50/50 to-white dark:from-zinc-800/80 dark:to-zinc-900 border border-rosebrand-200/80 dark:border-zinc-700 space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Para Consulta Médica</span>
            </span>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">
              Baixar Relatório Detalhado por Período
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Escolha o período desejado para baixar automaticamente o PDF ({getFibroPdfFilename()})
              em 1 página.
            </p>
          </div>

          {/* Period Preset Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: '7', label: 'Últimos 7 dias' },
              { id: '30', label: 'Últimos 30 dias' },
              { id: '90', label: 'Últimos 90 dias' },
              { id: 'custom', label: 'Personalizado' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setExportPreset(item.id as any)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition whitespace-nowrap ${
                  exportPreset === item.id
                    ? 'bg-rosebrand-500 border-rosebrand-500 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border-rosebrand-100 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-rosebrand-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {exportPreset === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-200 dark:border-zinc-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={todayStr}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-200 dark:border-zinc-700 text-xs"
                />
              </div>
            </div>
          )}

          {/* Export Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={handleOpenDetailedReportAndDownloadPdf}
              className="flex-1 bg-rosebrand-500 hover:bg-rosebrand-600 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition text-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Baixar PDF Automaticamente</span>
            </button>
            <button
              type="button"
              onClick={handleViewDetailedReport}
              className="py-3 px-3.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-rosebrand-50 dark:hover:bg-zinc-800 text-rosebrand-700 dark:text-rosebrand-300 border border-rosebrand-200 dark:border-zinc-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Ver Relatório</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsvByPeriod}
              className="py-3 px-3.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-rosebrand-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-rosebrand-200 dark:border-zinc-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* SECTION 3: Patient Clinical Profile for Reports */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Dados Rápidos do Paciente
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-200">
                Nome da Paciente *
              </label>
              <input
                type="text"
                placeholder="Digite seu nome"
                value={patientMeta.patientName}
                onChange={(e) => updatePatientMeta({ patientName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-rosebrand-50/40 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-200">
                Médico(a) Assistente
              </label>
              <input
                type="text"
                placeholder="Nome do(a) médico(a)"
                value={patientMeta.doctorName}
                onChange={(e) => updatePatientMeta({ doctorName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-rosebrand-50/40 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Simple Sign Out Footer */}
        {user && (
          <div className="pt-4 border-t border-rosebrand-100 dark:border-zinc-800 flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Logado como{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">{user.email}</strong>
            </span>
            <button
              type="button"
              onClick={signOut}
              className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-rose-100 dark:bg-zinc-800 dark:hover:bg-rose-950 text-zinc-600 hover:text-rose-600 dark:text-zinc-300 text-xs font-bold transition"
            >
              Sair da Conta
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
