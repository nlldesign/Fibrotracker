import React, { useState } from 'react';
import { useFibroStore } from '../../store/useFibroStore';
import { formatDateKey, generateClinicalReport } from '../../domain/riskEngine';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setSettingsModalOpen,
    user,
    syncWithCloud,
    isSyncing,
    lastSyncedAt,
    signOut,
    patientMeta,
    updatePatientMeta,
    records,
    openReportForPeriod,
    resetDemoData,
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

  const handleOpenDetailedReportAndPrint = () => {
    const { days, customRange } = getSelectedRangeParams();
    openReportForPeriod(days, customRange);
    setTimeout(() => {
      window.print();
    }, 350);
  };

  const handleViewDetailedReport = () => {
    const { days, customRange } = getSelectedRangeParams();
    openReportForPeriod(days, customRange);
  };

  const handleExportCsvByPeriod = () => {
    const { days, customRange } = getSelectedRangeParams();
    const report = generateClinicalReport(records, days, customRange);

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
    link.setAttribute(
      'download',
      `relatorio_medico_fibrocare_${report.startKey}_a_${report.endKey}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Relatório CSV (${report.totalLoggedDays} registros) exportado!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-3xl p-6 sm:p-7 border border-rosebrand-100 dark:border-zinc-800 shadow-2xl relative my-8 space-y-6">
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
          <div className="w-11 h-11 rounded-2xl bg-rosebrand-100 dark:bg-rosebrand-950 text-rosebrand-600 dark:text-rosebrand-300 flex items-center justify-center text-xl">
            ⚙️
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-400">
              Preferências, Conta & Exportação Clínica
            </span>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Configurações do FibroCare
            </h3>
          </div>
        </div>

        {/* SECTION 1: Export Detailed Report for Doctor by Period */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rosebrand-50 via-rosebrand-50/50 to-white dark:from-zinc-800/80 dark:to-zinc-900 border border-rosebrand-200/80 dark:border-zinc-700 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400">
                🩺 Para Consulta Médica
              </span>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">
                Exportar Relatório Detalhado por Período
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Escolha o período desejado para gerar o laudo com índices ACR (WPI/SSS), mapa de dor
                e medicação SOS para enviar ao seu médico.
              </p>
            </div>
          </div>

          {/* Period Preset Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: '7', label: 'Últimos 7 dias (ACR)' },
              { id: '30', label: 'Últimos 30 dias' },
              { id: '90', label: 'Últimos 90 dias' },
              { id: 'custom', label: 'Data Personalizada' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setExportPreset(item.id as any)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition ${
                  exportPreset === item.id
                    ? 'bg-rosebrand-500 border-rosebrand-500 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border-rosebrand-100 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-rosebrand-50'
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
              onClick={handleOpenDetailedReportAndPrint}
              className="flex-1 bg-rosebrand-500 hover:bg-rosebrand-600 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition text-xs flex items-center justify-center gap-2"
            >
              <span>🖨️ Exportar / Salvar PDF para o Médico</span>
            </button>
            <button
              type="button"
              onClick={handleViewDetailedReport}
              className="py-3 px-3.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-rosebrand-50 dark:hover:bg-zinc-800 text-rosebrand-700 dark:text-rosebrand-300 border border-rosebrand-200 dark:border-zinc-700 text-xs font-bold transition"
            >
              👁️ Abrir Relatório
            </button>
            <button
              type="button"
              onClick={handleExportCsvByPeriod}
              className="py-3 px-3.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-rosebrand-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-rosebrand-200 dark:border-zinc-700 text-xs font-bold transition"
            >
              📥 CSV
            </button>
          </div>
        </div>

        {/* SECTION 2: Patient Clinical Profile for Reports */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            👤 Dados Clínicos do Cabeçalho do Relatório
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">
                Nome da Paciente
              </label>
              <input
                type="text"
                placeholder="Ex: Maria Clara"
                value={patientMeta.patientName}
                onChange={(e) => updatePatientMeta({ patientName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-rosebrand-50/40 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700"
              />
            </div>
            <div>
              <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">
                Médico(a) Assistente
              </label>
              <input
                type="text"
                placeholder="Ex: Dra. Helena (Reumatologista)"
                value={patientMeta.doctorName}
                onChange={(e) => updatePatientMeta({ doctorName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-rosebrand-50/40 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">
                Medicações de Uso Contínuo
              </label>
              <input
                type="text"
                placeholder="Ex: Pregabalina 75mg, Duloxetina 60mg"
                value={patientMeta.continuousMedications}
                onChange={(e) => updatePatientMeta({ continuousMedications: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-rosebrand-50/40 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Cloud Account & Sync Status */}
        <div className="pt-4 border-t border-rosebrand-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          {user ? (
            <>
              <div className="text-xs">
                <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
                  🟢 Conta Conectada ao Supabase
                </span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{user.email}</span>
                {lastSyncedAt && (
                  <span className="text-zinc-400 ml-2">(Último sync: {lastSyncedAt})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={syncWithCloud}
                  className="px-3.5 py-2 rounded-xl bg-rosebrand-50 hover:bg-rosebrand-100 dark:bg-zinc-800 text-rosebrand-700 dark:text-rosebrand-300 text-xs font-bold border border-rosebrand-200 dark:border-zinc-700 transition"
                >
                  {isSyncing ? 'Sincronizando...' : '🔄 Sincronizar Nuvem'}
                </button>
                <button
                  type="button"
                  onClick={signOut}
                  className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-rose-100 dark:bg-zinc-800 dark:hover:bg-rose-950 text-zinc-600 hover:text-rose-600 dark:text-zinc-300 text-xs font-bold transition"
                >
                  Sair da Conta
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Modo demonstração local ativo (sem conta conectada).
              </span>
              <button
                type="button"
                onClick={signOut}
                className="px-4 py-2 rounded-xl bg-rosebrand-500 text-white text-xs font-bold"
              >
                Criar Conta / Entrar
              </button>
            </div>
          )}
        </div>

        {/* Reset Demo Data */}
        <div className="pt-2 border-t border-rosebrand-50 dark:border-zinc-800/60 flex justify-between items-center text-[11px] text-zinc-400">
          <span>Restaurar exemplos de demonstração de 12 dias</span>
          <button
            type="button"
            onClick={resetDemoData}
            className="text-rosebrand-600 dark:text-rosebrand-400 font-semibold hover:underline"
          >
            ↻ Restaurar Dados Demo
          </button>
        </div>
      </div>
    </div>
  );
};
