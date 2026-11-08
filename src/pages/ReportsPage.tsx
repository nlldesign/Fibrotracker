import React, { useState } from 'react';
import { useFibroStore } from '../store/useFibroStore';
import {
  formatHumanDate,
  generateClinicalReport,
  getTopBodyZones,
  getTopTriggers,
} from '../domain/riskEngine';
import { BODY_ZONE_MAP } from '../constants/clinicalData';

export const ReportsPage: React.FC = () => {
  const {
    records,
    user,
    setAuthModalOpen,
    patientMeta,
    updatePatientMeta,
    showToast,
  } = useFibroStore();

  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [editingHeader, setEditingHeader] = useState(false);

  const report = generateClinicalReport(records, daysFilter);
  const topZones = getTopBodyZones(records, 6);
  const topTriggers = getTopTriggers(records, 4);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
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
      `relatorio_fibrocare_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha CSV exportada com sucesso!');
  };

  return (
    <section className="page-fade">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="print:hidden mb-6 bg-gradient-to-r from-rosebrand-50 via-white to-rosebrand-50/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 rounded-3xl p-5 border border-rosebrand-100 dark:border-zinc-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-400">
            Acompanhamento Médico & Exportação
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
            Relatório Clínico de Evolução (Padrão ACR)
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Resumo consolidado de dor, bateria de energia, medicação SOS e critérios WPI/SSS para
            consultas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Filter */}
          <div className="inline-flex bg-rosebrand-50 dark:bg-zinc-800 p-1 rounded-2xl border border-rosebrand-100 dark:border-zinc-700">
            {[
              { days: 7, label: '7 dias (ACR)' },
              { days: 30, label: '30 dias' },
              { days: 90, label: '90 dias' },
            ].map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => setDaysFilter(p.days)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  daysFilter === p.days
                    ? 'bg-rosebrand-500 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-rosebrand-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-rosebrand-50 dark:hover:bg-zinc-700 text-rosebrand-700 dark:text-rosebrand-300 border border-rosebrand-200 dark:border-zinc-700 text-xs font-bold transition"
          >
            📥 Baixar CSV
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-2xl bg-rosebrand-500 hover:bg-rosebrand-600 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            <span>🖨️ Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* Cloud Sync Banner if not logged in (Hidden when printing) */}
      {!user && (
        <div className="print:hidden mb-6 p-4 rounded-2xl bg-amber-50/70 dark:bg-zinc-900 border border-amber-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">☁️</span>
            <div className="text-xs">
              <p className="font-bold text-zinc-800 dark:text-zinc-100">
                Seus dados estão salvos apenas neste navegador
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Conecte sua conta ao Supabase para ter histórico vitalício em nuvem e acessar de
                qualquer aparelho.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold transition"
          >
            Conectar Conta / Nuvem
          </button>
        </div>
      )}

      {/* Printable Clinical Sheet */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-rosebrand-100 dark:border-zinc-800 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Patient & Doctor Identification Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-rosebrand-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                Laudo de Acompanhamento Diário — Fibromialgia
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rosebrand-100 text-rosebrand-700 dark:bg-rosebrand-950 dark:text-rosebrand-300">
                Últimos {daysFilter} dias ({report.totalLoggedDays} registros)
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Paciente:{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">
                {patientMeta.patientName || user?.fullName || user?.email || 'Não informado'}
              </strong>{' '}
              • Médico(a) Assistente:{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">
                {patientMeta.doctorName || 'Reumatologia / Clínica da Dor'}
              </strong>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Medicação Contínua Informada:{' '}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {patientMeta.continuousMedications || 'Nenhuma informada'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEditingHeader(!editingHeader)}
            className="print:hidden text-xs font-bold text-rosebrand-600 dark:text-rosebrand-400 underline"
          >
            {editingHeader ? 'Fechar Edição' : '✏️ Editar Cabeçalho do Paciente'}
          </button>
        </div>

        {/* Editable Patient Meta Box */}
        {editingHeader && (
          <div className="print:hidden p-4 rounded-2xl bg-rosebrand-50/50 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">
                Nome da Paciente
              </label>
              <input
                type="text"
                placeholder="Ex: Ana Paula Silva"
                value={patientMeta.patientName}
                onChange={(e) => updatePatientMeta({ patientName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-200 dark:border-zinc-700"
              />
            </div>
            <div>
              <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">
                Médico(a) / Especialidade
              </label>
              <input
                type="text"
                placeholder="Ex: Dr. Roberto (Reumatologista)"
                value={patientMeta.doctorName}
                onChange={(e) => updatePatientMeta({ doctorName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-200 dark:border-zinc-700"
              />
            </div>
            <div>
              <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">
                Medicações de Uso Contínuo
              </label>
              <input
                type="text"
                placeholder="Ex: Pregabalina 75mg, Duloxetina 60mg"
                value={patientMeta.continuousMedications}
                onChange={(e) => updatePatientMeta({ continuousMedications: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-200 dark:border-zinc-700"
              />
            </div>
          </div>
        )}

        {/* Row 1: 4 Clinical KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-rosebrand-50/50 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase text-zinc-400 block">
              Média de Dor (EVA)
            </span>
            <p className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1">
              {report.avgPain} <span className="text-xs font-normal text-zinc-500">/ 10</span>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              🔴 {report.redDays}d crise • 🟡 {report.yellowDays}d alerta • 🟢 {report.greenDays}d
              estáveis
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rosebrand-50/50 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase text-zinc-400 block">
              Energia Média (Spoon Theory)
            </span>
            <p className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1">
              🥄 {report.avgSpoons}{' '}
              <span className="text-xs font-normal text-zinc-500">/ 5 colheres</span>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Capacidade funcional e reserva de fadiga diária
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rosebrand-50/50 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase text-zinc-400 block">
              Medicação SOS vs. Contínua
            </span>
            <p className="text-2xl font-extrabold text-rosebrand-600 dark:text-rosebrand-400 mt-1">
              🆘 {report.sosDays}d{' '}
              <span className="text-xs font-normal text-zinc-500">com resgate</span>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              💊 Adesão contínua registrada em {report.continuousMedDays} dias
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rosebrand-50/50 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase text-zinc-400 block">
              Índices ACR (Últimos 7d)
            </span>
            <p className="text-lg font-extrabold text-zinc-900 dark:text-white mt-1">
              WPI: {report.wpiScore}/19 • SSS: {report.sssScore}/12
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              {report.meetsAcrThreshold
                ? '⚠️ Compatível com atividade polissintomática ACR'
                : '🟢 Abaixo do limiar de crise difusa ACR nos últimos 7d'}
            </p>
          </div>
        </div>

        {/* Row 2: Anatomical Pain Distribution & Pain Characteristics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Anatomical Regions */}
          <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-rosebrand-100 dark:border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400 mb-3">
              📍 Regiões Anatômicas Mais Afetadas (Mapa Corporal)
            </h4>
            {topZones.length > 0 ? (
              <div className="space-y-2.5">
                {topZones.map((z) => (
                  <div key={z.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {z.emoji} {z.label}
                    </span>
                    <span className="font-bold text-rosebrand-600 dark:text-rosebrand-400">
                      {z.count} dias ({z.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400">Nenhuma região corporal registrada no período.</p>
            )}
          </div>

          {/* Pain Qualities & Triggers */}
          <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-rosebrand-100 dark:border-zinc-800 space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400 mb-2">
                ⚡ Característica / Qualidade da Dor Relatada
              </h4>
              <div className="flex flex-wrap gap-2">
                {report.topQualities.length > 0 ? (
                  report.topQualities.map((q) => (
                    <span
                      key={q.key}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-100 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200"
                    >
                      {q.emoji} {q.label}: <strong>{q.count}d</strong>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-400">Sem especificação de tipo de dor.</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400 mb-2">
                🚩 Principais Gatilhos & Sintomas Associados
              </h4>
              <div className="flex flex-wrap gap-2">
                {topTriggers.map((t) => (
                  <span
                    key={t.key}
                    className="px-3 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-100 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    {t.pillLabel}: <strong>{t.count}x</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Chronological Table for the Doctor */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400 mb-3">
            📅 Histórico Cronológico Detalhado
          </h4>
          <div className="overflow-x-auto rounded-2xl border border-rosebrand-100 dark:border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-rosebrand-50/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">Data</th>
                  <th className="py-3 px-3">Fase</th>
                  <th className="py-3 px-3">Dor</th>
                  <th className="py-3 px-3">Energia</th>
                  <th className="py-3 px-3">Sono / Fog</th>
                  <th className="py-3 px-3">Áreas & Qualidade</th>
                  <th className="py-3 px-3">Medicação / Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rosebrand-100/60 dark:divide-zinc-800">
                {report.entries
                  .slice()
                  .reverse()
                  .map(({ dateKey, rec, status }) => (
                    <tr key={dateKey} className="hover:bg-rosebrand-50/20 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 px-3.5 font-semibold whitespace-nowrap">
                        {formatHumanDate(dateKey)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {status === 'red' && (
                          <span className="px-2 py-0.5 rounded-full bg-rosebrand-100 text-rosebrand-700 dark:bg-rosebrand-950 dark:text-rosebrand-300 font-bold text-[10px]">
                            🔴 Crise
                          </span>
                        )}
                        {status === 'yellow' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                            🟡 Alerta
                          </span>
                        )}
                        {status === 'green' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                            🟢 Estável
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold">{rec.pain}/10</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">🥄 {rec.spoons ?? 3}/5</td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                        Sono: {rec.sleep} • Fog: {rec.fog}
                      </td>
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <div className="truncate font-medium text-zinc-700 dark:text-zinc-300">
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
                      <td className="py-2.5 px-3 max-w-[240px]">
                        {rec.reliefActions?.includes('med_sos') && (
                          <span className="inline-block mr-1.5 px-1.5 py-0.5 rounded bg-rosebrand-100 dark:bg-rosebrand-950 text-rosebrand-700 dark:text-rosebrand-300 font-bold text-[10px]">
                            🆘 SOS
                          </span>
                        )}
                        <span className="text-zinc-500 dark:text-zinc-400 italic">
                          {rec.notes || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-4 border-t border-rosebrand-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex flex-wrap justify-between gap-2">
          <span>
            Relatório gerado pelo FibroCare — Monitor Cíclico & Autogestão da Fibromialgia
          </span>
          <span>
            Nota: Os indicadores WPI e SSS apoiam o acompanhamento clínico e não substituem avaliação
            médica presencial.
          </span>
        </div>
      </div>
    </section>
  );
};
