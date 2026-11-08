# 🌸 FibroCare — Monitor Cíclico, Mapa Corporal & Alerta de Crises

Aplicativo web e mobile-first para **monitoramento cíclico da Fibromialgia**, previsão de crises em 24h–48h, mapeamento anatômico interativo e geração de relatórios clínicos nos critérios do *American College of Rheumatology (ACR 2016)*.

## ✨ Principais Funcionalidades

1. **📝 Check-in Diário de Baixo Atrito (< 30s):**
   - **Intensidade & Qualidade da Dor:** Escala EVA (0–10) + sensação da dor (`Peso muscular 🪨`, `Queimação 🔥`, `Choque/Formigamento ⚡`, `Pontadas 🗡️`).
   - **Mapa Corporal Interativo em SVG (Frente e Costas):** Mapeamento de 12 zonas anatômicas equivalentes às 19 regiões do índice **WPI (ACR)**.
   - **Teoria das Colheres (*Spoon Theory* 🥄):** Medidor de bateria de energia diária (1 a 5 colheres) para prevenir o efeito rebote (*Post-Exertional Malaise / PEM*).
   - **Qualidade do Sono & Névoa Mental (*Fibrofog*).**
   - **Gatilhos & Sintomas Associados:** Rigidez matinal, alodinia, pico de estresse, mudança de clima, esforço excessivo, **TPM/Ciclo menstrual 🩸**, **Sobrecarga sensorial 🔊** e **Intestino irritável 🤢**.
   - **Medicação & Alívio:** Adesão à medicação contínua vs. necessidade de **Remédio de Resgate (SOS 🆘)** e terapias não-farmacológicas.

2. **🗓️ Calendário Cíclico Preditivo:**
   - Classificação visual diária em **Estável (🟢)**, **Alerta Precoce (🟡)** e **Crise (🔴)**.
   - Detecção automática de **Zonas de Cuidado** para os próximos dias após acúmulo de bandeiras amarelas.

3. **🌸 Termômetro do Ciclo & Plano de Acolhimento:**
   - Radar dos principais gatilhos do ciclo, ranking das áreas corporais mais afetadas e checklist prático de *pacing* adaptado à fase atual.

4. **📊 Relatório Médico (Padrão ACR) & Sincronização Supabase:**
   - Cálculo automático do **WPI (0–19)** e **SSS (0–12)** nos últimos 7, 30 ou 90 dias.
   - Exportação limpa para **Impressão / PDF** e **CSV**.
   - Autenticação e banco de dados na nuvem via **Supabase (PostgreSQL + Row Level Security LGPD)**.

## 🚀 Como Executar Localmente

```bash
npm install
npm run dev
```

O banco de dados Supabase pode ser configurado via arquivo `.env` (veja `.env.example`) e o schema completo com políticas RLS está em [`supabase/schema.sql`](./supabase/schema.sql).
