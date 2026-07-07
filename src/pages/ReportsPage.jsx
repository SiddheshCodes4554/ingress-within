import React, { useState, useEffect } from 'react';
import { ChevronDown, ArrowLeft, Download, Lock, FileText, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import { DashboardService } from '../services/dashboardService';

export default function ReportsPage({ user, profile, onSignOut }) {
  const [viewState, setViewState] = useState('list'); // 'list' | 'summary' | 'report'
  const [selectedSummaryId, setSelectedSummaryId] = useState(null);
  const [selectedCycleId, setSelectedCycleId] = useState(null);

  // Dynamic state
  const [cycles, setCycles] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail loading states
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  // Accordion states: maps cycleId to boolean
  const [openCycles, setOpenCycles] = useState({});

  // Trigger manual retry/backfill
  const [retryingId, setRetryingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel fetches for responsiveness
      const [cyclesData, reportsData] = await Promise.all([
        DashboardService.fetchCyclesList(),
        DashboardService.fetchWeeklyReports()
      ]);

      // Sort cycles by cycle_number descending
      const sortedCycles = [...cyclesData].sort((a, b) => b.cycle_number - a.cycle_number);
      setCycles(sortedCycles);
      setReports(reportsData || []);

      // Auto-open the current active cycle accordion
      if (sortedCycles.length > 0) {
        const activeCycle = sortedCycles.find(c => c.status === 'active' || c.status === 'ACTIVE');
        const defaultOpenId = activeCycle ? activeCycle.id : sortedCycles[0].id;
        setOpenCycles({ [defaultOpenId]: true });
      }
    } catch (err) {
      console.error('[ReportsPage] Error loading reports page data:', err);
      setError('Could not establish connection to reports database.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCycle = (cycleId) => {
    setOpenCycles(prev => ({
      ...prev,
      [cycleId]: !prev[cycleId]
    }));
  };

  const handleOpenSummary = async (reportId) => {
    setSelectedSummaryId(reportId);
    setViewState('summary');
    setLoadingDetail(true);
    setSelectedReport(null);
    try {
      const data = await DashboardService.fetchWeeklyReportDetail(reportId);
      setSelectedReport(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load weekly report detail.');
      setViewState('list');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenAssessment = async (cycleId) => {
    setSelectedCycleId(cycleId);
    setViewState('report');
    setLoadingDetail(true);
    setSelectedAssessment(null);
    try {
      const data = await DashboardService.fetchCycleAssessment(cycleId);
      setSelectedAssessment(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load cycle assessment details.');
      setViewState('list');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRetryReport = async (e, reportId, cycleId, weekNumber) => {
    e.stopPropagation();
    setRetryingId(reportId);
    try {
      // Trigger backfill which scans and re-queues failed jobs
      await fetch('/api/reports/backfill', { method: 'POST' });
      // Poll to check if queued
      setTimeout(async () => {
        const freshReports = await DashboardService.fetchWeeklyReports(undefined, true);
        setReports(freshReports);
        setRetryingId(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      setRetryingId(null);
    }
  };

  const handleDownloadAssessment = async (e, cycleId) => {
    e.stopPropagation();
    try {
      const assessment = await DashboardService.fetchCycleAssessment(cycleId);
      if (assessment) {
        downloadPdf(assessment, true);
      } else {
        alert("Cycle assessment is not generated yet.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load assessment report for download.");
    }
  };

  const downloadPdf = (reportData, isDay28 = false) => {
    if (!reportData) return;

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      alert('Please allow popups to download the PDF report.');
      return;
    }

    let contentHtml = '';

    if (!isDay28) {
      const data = reportData.report_data || {};
      const stats = data.weekly_stats || {};
      const listEmos = data.vocabThisWeek || [];
      const lengths = data.writing_behaviour?.entry_lengths || [];

      // Parse what_we_saw into facts vs realization
      const parts = (data.what_we_saw || '').split('\n\n');
      const sawText = parts[0] || '';
      const realizationText = parts[1] || '';

      let sinceLastWeekContent = '';
      if (typeof data.since_last_week === 'string') {
        sinceLastWeekContent = data.since_last_week;
      } else if (data.since_last_week && typeof data.since_last_week === 'object') {
        const lastWords = data.since_last_week.last_week_words || [];
        const thisWords = data.since_last_week.this_week_words || [];
        if (lastWords.length === 0) {
          sinceLastWeekContent = 'First week on record. No prior week to compare.';
        } else {
          sinceLastWeekContent = `Last week: ${lastWords.join(', ')}. This week: ${thisWords.join(', ')}.`;
        }
      } else {
        sinceLastWeekContent = 'First week on record. No prior week to compare.';
      }

      contentHtml = `
        <div class="rpt" style="border: none; box-shadow: none; margin: 0;">
          <div class="hdr">
            <div class="hl">
              <div class="logo font-semibold">ingress <span>within</span></div>
              <div class="wl" style="margin-left: 14px; text-transform: uppercase;">Week ${reportData.week_number} Summary</div>
            </div>
            <div class="dr">${stats.week_range || ''}</div>
          </div>
          <div class="body">
            <div class="sr">
              <div class="sc">
                <div class="sl">Entries</div>
                <div class="sv">${stats.entries_completed}<sup>/${stats.total_possible}</sup></div>
                <div class="ss">${stats.skipped_days > 0 ? stats.skipped_days + ' days skipped' : 'Perfect streak'}</div>
              </div>
              <div class="sc">
                <div class="sl">Top focal expression</div>
                <div class="sw">"${listEmos[0]?.word || 'none'}"</div>
                <div class="ss">appeared ${listEmos[0]?.frequency || 0} times</div>
              </div>
              <div class="sc">
                <div class="sl">Week tone</div>
                <div class="st">${reportData.title || 'Neutral baseline'}</div>
              </div>
            </div>

            <div class="since-last">
              <div class="eyebrow">Since Last Week</div>
              <p>${sinceLastWeekContent}</p>
            </div>

            <div class="tc">
              <div>
                <div class="lbl">Emotion language this week</div>
                <div class="cx">Words pulled from your writing this week, grouped with related words you didn't use.</div>
                <div style="margin-top: 10px;">
                  ${data.emotion_clusters && data.emotion_clusters.length > 0 ? (
                    data.emotion_clusters.slice(0, 3).map(cluster => `
                      <div class="cluster-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
                        <span class="tag" style="background: var(--terracotta-bg); color: var(--terracotta-text); font-size: 12.5px; padding: 5px 11px; border-radius: 20px;">${cluster.word} →</span>
                        ${(cluster.related || []).slice(0, 3).map(rel => `
                          <span class="related" style="background: #fff; border: 1px solid var(--border); font-size: 12.5px; padding: 5px 11px; border-radius: 20px; color: var(--muted);">${rel}</span>
                        `).join('')}
                      </div>
                    `).join('')
                  ) : (
                    listEmos.slice(0, 3).map(emo => `
                      <div class="cluster-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
                        <span class="tag" style="background: var(--terracotta-bg); color: var(--terracotta-text); font-size: 12.5px; padding: 5px 11px; border-radius: 20px;">${emo.word} →</span>
                        <span class="related" style="background: #fff; border: 1px solid var(--border); font-size: 12.5px; padding: 5px 11px; border-radius: 20px; color: var(--muted);">${emo.normalized_word}</span>
                      </div>
                    `).join('')
                  )}
                </div>
                ${data.analytical_block ? `
                  <div class="cluster-note" style="font-size: 13.5px; line-height: 1.6; margin-top: 12px; color: var(--ink);">
                    Theme: ${data.analytical_block.primary_theme}. Emotional register: ${data.analytical_block.emotional_tone}.
                  </div>
                ` : ''}

                <div class="dv"></div>
                <div class="lbl">How the week moved</div>
                <div class="rpt-bars-container">
                  ${[0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                    const h = lengths[dayIdx] || 0;
                    return `
                      <div class="rpt-bar-wrapper">
                        ${h > 0 ? `<div class="rpt-bar-element" style="height: ${h}%; width: 100%; background: var(--sage); border-radius: 3px 3px 0 0;"></div>` : `<div class="rpt-bar-element empty" style="width: 100%;"></div>`}
                        <span class="rpt-bar-label">D${dayIdx + 1}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
                <div class="arc-note" style="margin-top: 10px;">${data.writing_behaviour?.consistency || 'Writing patterns logged consistently.'}</div>
              </div>
              <div>
                <div class="lbl">What we saw</div>
                <div class="ws">
                  ${sawText}
                </div>
                ${realizationText ? `
                  <div class="yt">
                    ${realizationText}
                  </div>
                ` : ''}
                <div class="why-hedge" style="margin-top: 12px;">Based on ${stats.entries_completed || 0} of 7 entries this week.</div>
              </div>
            </div>
            ${data.crisis_review ? `
              <div class="status-bar">
                ${data.crisis_review.occurred ? `<span style="color: #8a3020; font-weight: 600;">⚠️ Alert: ${data.crisis_review.summary}</span>` : 'No crisis indicators were detected this week.'}
              </div>
            ` : ''}
            <div class="cb" style="margin-top: 24px;">
              <div class="cq">"${data.candidate_quote || 'Reflecting on your logs helps align focus.'}"</div>
              <div class="carry-label">Carry Question</div>
              <div class="co">${reportData.open_question || data.carry_question}</div>
            </div>
          </div>
        </div>
      `;
    } else {
      const cycleObj = cycles.find(c => c.id === selectedCycleId) || {};
      contentHtml = `
        <div class="rpt" style="border: none; box-shadow: none; margin: 0;">
          <div class="hdr">
            <div class="hl">
              <div class="logo font-semibold">ingress <span>within</span></div>
              <div class="wl" style="margin-left: 14px; text-transform: uppercase;">Cycle ${cycleObj.cycle_number || 1} Assessment Report</div>
            </div>
            <div class="dr">${new Date(reportData.generated_at).toLocaleDateString('en-GB')}</div>
          </div>
          <div class="body">
            <h2 style="font-family: Georgia, serif; font-size: 20px; font-weight: normal; color: var(--navy); margin-bottom: 12px;">
              28 days of honest writing — here is what it showed.
            </h2>
            <div style="font-size: 12px; color: var(--muted); margin-bottom: 24px;">
              ${reportData.entry_count} entries completed · ${reportData.path_assignment || 'Guided pathway'}
            </div>

            <div style="margin-bottom: 24px;">
              <div class="lbl">What this cycle showed</div>
              <p style="font-family: Georgia, serif; font-size: 15px; line-height: 1.75; color: var(--ink); padding: 16px; background: #FAFBFB; border: 1px solid var(--border); border-radius: 10px; margin-top: 6px;">
                ${reportData.report_text || ''}
              </p>
            </div>

            <div class="cb" style="background: var(--navy); padding: 24px; border-radius: 12px; color: white;">
              <div class="carry-label" style="color: var(--sage); font-size: 11px; text-transform: uppercase; margin-bottom: 8px;">Carry into Cycle ${Number(cycleObj.cycle_number || 1) + 1}</div>
              <p style="font-size: 13.5px; line-height: 1.6; color: #ECEFF0; margin-bottom: 16px;">
                Pathway assignment for your integration is: <strong>${reportData.path_assignment || 'second_cycle'}</strong>.<br/>
                Branch assignment code: <strong>${reportData.branch_assignment || 'A'}</strong>.
              </p>
              <div style="border-left: 2.5px solid rgba(224,168,152,0.4); padding-left: 16px;">
                <p style="font-family: Georgia, serif; font-size: 14.5px; font-style: italic; color: var(--cream);">
                  "visibility is the first condition for change. Fix focus on agency."
                </p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Ingress Within - Report</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet">
          <style>
            :root {
              --navy: #1c2733;
              --sage: #9db9a8;
              --sage-dark: #6b8b78;
              --bg: #fbfaf8;
              --border: #e7e3da;
              --terracotta-bg: #f2dccb;
              --terracotta-text: #9c5a2e;
              --ink: #22262b;
              --muted: #767c72;
              --cream: #f4efe4;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; background: #fff; padding: 40px; color: var(--ink); }
            .rpt { max-width: 920px; margin: 0 auto; background: #fff; }
            .hdr { background: var(--navy); padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; border-radius: 10px 10px 0 0; }
            .hl { display: flex; align-items: center; gap: 10px; }
            .logo { font-size: 16px; font-weight: 600; color: #fff; }
            .logo span { color: var(--sage); }
            .wl { font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--sage); font-weight: 500; margin-left: 14px; }
            .dr { font-size: 13px; color: #b9c0c7; }
            .body { padding: 30px 24px; border: 1px solid var(--border); border-top: none; border-radius: 0 0 10px 10px; }
            .sr { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid var(--border); border-radius: 10px; margin-bottom: 24px; overflow: hidden; }
            .sc { padding: 14px 16px; border-right: 1px solid var(--border); }
            .sc:last-child { border-right: none; }
            .sl { font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
            .sv { font-size: 28px; font-weight: 600; color: var(--ink); line-height: 1.1; }
            .sv sup { font-size: 14px; font-weight: 400; color: var(--muted); }
            .ss { font-size: 12px; color: var(--muted); margin-top: 3px; }
            .sw { font-family: Georgia, serif; font-style: italic; font-size: 18px; color: var(--ink); }
            .st { font-size: 16px; font-weight: 600; color: var(--ink); line-height: 1.3; }
            .tc { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
            .lbl { font-size: 12px; letter-spacing: 1.2px; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; font-weight: 600; }
            .cx { font-size: 12.5px; color: var(--muted); line-height: 1.5; margin-bottom: 12px; }
            .tag { background: var(--terracotta-bg); color: var(--terracotta-text); font-size: 12.5px; padding: 5px 11px; border-radius: 20px; font-weight: 500; }
            .related { background: #fff; border: 1px solid var(--border); font-size: 12.5px; padding: 5px 11px; border-radius: 20px; color: var(--muted); }
            .dv { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
            
            .since-last { border: 1px solid var(--border); border-radius: 10px; background: #fff; padding: 16px 22px; margin-bottom: 24px; }
            .since-last .eyrow { font-weight: 600; font-size: 11px; text-transform: uppercase; }
            .since-last p { font-size: 13.5px; color: var(--muted); margin: 6px 0 0; }

            .rpt-bars-container { display: flex; align-items: flex-end; justify-content: space-between; height: 70px; margin-top: 16px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid var(--border); }
            .rpt-bar-wrapper { display: flex; flex-direction: column; align-items: center; flex: 1; max-width: 38px; justify-content: flex-end; height: 100%; }
            .rpt-bar-element { width: 100%; background: var(--sage); border-radius: 3px 3px 0 0; }
            .rpt-bar-element.empty { background: var(--border); height: 3px !important; border-radius: 2px; }
            .rpt-bar-label { font-size: 10.5px; color: var(--muted); margin-top: 5px; }
            .arc-note { font-size: 12.5px; color: var(--muted); line-height: 1.5; }

            .ws { font-size: 14.5px; line-height: 1.7; color: var(--ink); margin-bottom: 16px; }
            .yt { font-size: 16px; font-weight: 600; line-height: 1.6; color: var(--navy); border-left: 3px solid #d98b6b; padding-left: 14px; margin-bottom: 14px; }
            .why-hedge { font-size: 12px; color: var(--muted); }

            .status-bar { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 13px 18px; font-size: 13px; color: var(--muted); text-align: center; margin-bottom: 24px; }

            .cb { background: var(--navy); border-radius: 12px; padding: 26px 28px; color: var(--cream); }
            .cq { font-family: Georgia, serif; font-style: italic; font-size: 17px; line-height: 1.6; margin-bottom: 16px; }
            .co { font-size: 14px; line-height: 1.7; color: #d9dee2; }
            .carry-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--sage); margin-bottom: 6px; font-weight: 600; }

            @media print {
              body { padding: 0; }
              .hdr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .tag { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .cb { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .rpt-bar-element { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .since-last { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans relative pb-20">
      <style dangerouslySetInnerHTML={{
        __html: `
        :root {
          --navy: #1c2733;
          --sage: #9db9a8;
          --sage-dark: #6b8b78;
          --bg: #fbfaf8;
          --border: #e7e3da;
          --terracotta-bg: #f2dccb;
          --terracotta-text: #9c5a2e;
          --ink: #22262b;
          --muted: #767c72;
          --cream: #f4efe4;
        }
        .rpt {
          max-width: 920px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(34,38,43,0.04);
        }
        .hdr {
          background: var(--navy);
          color: #fff;
          padding: 22px 32px;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .hl {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }
        .logo span {
          color: var(--sage);
          font-weight: 400;
        }
        .hdiv {
          width: 1px;
          height: 14px;
          background: rgba(236,239,240,0.2);
        }
        .wl {
          font-size: 12px;
          letter-spacing: 1.5px;
          color: var(--sage);
          margin-left: 14px;
          text-transform: uppercase;
          font-weight: 500;
        }
        .dr {
          font-size: 13px;
          color: #b9c0c7;
        }
        .body {
          padding: 30px 32px;
        }
        .sr {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border: 1px solid var(--border);
          border-radius: 10px;
          margin-bottom: 28px;
          overflow: hidden;
          background: #fff;
        }
        .sc {
          padding: 18px 22px;
          border-right: 1px solid var(--border);
        }
        .sc:last-child {
          border-right: none;
        }
        .sl {
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 8px;
          font-weight: 600;
        }
        .sv {
          font-size: 28px;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.1;
        }
        .sv sup {
          font-size: 14px;
          font-weight: 400;
          color: var(--muted);
        }
        .ss {
          font-size: 12px;
          color: var(--muted);
          margin-top: 2px;
        }
        .sw {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: 18px;
          color: var(--ink);
        }
        .st {
          font-size: 16px;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.3;
        }
        .tc {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 20px;
        }
        .lbl {
          font-size: 12px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: var(--muted);
          font-weight: 600;
          margin-bottom: 6px;
        }
        .cx {
          font-size: 12.5px;
          color: var(--muted);
          line-height: 1.5;
          margin-bottom: 14px;
        }
        .cr {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .wu {
          background: var(--terracotta-bg);
          color: var(--terracotta-text);
          font-size: 12.5px;
          padding: 5px 11px;
          border-radius: 20px;
          font-weight: 500;
        }
        .wn {
          background: #fff;
          border: 1px solid var(--border);
          font-size: 12.5px;
          padding: 5px 11px;
          border-radius: 20px;
          color: var(--muted);
        }
        .dv {
          border: none;
          border-top: 1px solid var(--border);
          margin: 20px 0;
        }
        .rpt-bars-container {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 70px;
          margin: 10px 0 6px;
        }
        .rpt-bar-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          height: 100%;
        }
        .rpt-bar-element {
          width: 100%;
          background: var(--sage);
          border-radius: 3px 3px 0 0;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .rpt-bar-element.empty {
          background: var(--border);
          height: 3px !important;
          border-radius: 2px;
        }
        .rpt-bar-label {
          font-size: 10.5px;
          color: var(--muted);
          margin-top: 5px;
        }
        .arc-note {
          font-size: 12.5px;
          color: var(--muted);
          line-height: 1.5;
        }
        .ws {
          font-size: 14.5px;
          line-height: 1.7;
          color: var(--ink);
          margin-bottom: 16px;
        }
        .yl {
          display: none;
        }
        .yt {
          font-size: 16px;
          font-weight: 600;
          line-height: 1.6;
          color: var(--navy);
          border-left: 3px solid #d98b6b;
          padding-left: 14px;
          margin-bottom: 14px;
          background: transparent;
          border-radius: 0;
          padding-top: 2px;
          padding-bottom: 2px;
        }
        .why-hedge {
          font-size: 12px;
          color: var(--muted);
        }
        .cb {
          background: var(--navy);
          border-radius: 12px;
          padding: 26px 28px;
          color: var(--cream);
        }
        .cq {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: 17px;
          line-height: 1.6;
          color: var(--cream);
          margin-bottom: 16px;
        }
        .co {
          font-size: 14px;
          line-height: 1.7;
          color: #d9dee2;
        }
        .carry-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--sage);
          margin-bottom: 6px;
          font-weight: 600;
        }
        .since-last {
          border: 1px solid var(--border);
          border-radius: 10px;
          background: #fff;
          padding: 16px 22px;
          margin-bottom: 24px;
        }
        .since-last .eyebrow {
          color: var(--sage-dark);
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .since-last p {
          font-size: 13.5px;
          color: var(--muted);
          margin: 6px 0 0;
        }
        .status-bar {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 13px 18px;
          font-size: 13px;
          color: var(--muted);
          text-align: center;
          margin-bottom: 24px;
        }
        .foot {
          background: var(--navy);
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 24px -24px -24px;
        }
        .foot-link {
          font-size: 11px;
          color: var(--sage);
          text-decoration: none;
        }
        .foot-center {
          font-size: 10px;
          color: rgba(236,239,240,0.2);
          letter-spacing: .06em;
          text-transform: uppercase;
        }
        @media(max-width: 768px) {
          .tc {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .sr {
            grid-template-columns: 1fr;
          }
          .sc {
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .sc:last-child {
            border-bottom: none;
          }
        }
      `}} />
      <DashboardNavbar activeTab="reports" />

      <main className={`${viewState === 'list' ? 'max-w-[680px]' : 'max-w-[900px]'} mx-auto px-6 pt-6 transition-all duration-300`}>
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin text-secondary" size={32} />
            <p className="text-sm font-serif italic text-mid">Retrieving writing history...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-6 text-center space-y-4 my-10 shadow-xs">
            <AlertCircle size={36} className="mx-auto text-accent" />
            <h2 className="font-serif text-lg text-primary">Connection Interrupted</h2>
            <p className="text-xs text-mid leading-relaxed max-w-sm mx-auto">
              We encountered a database error checking your cycle records.
            </p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* View State: LIST */}
        {!loading && !error && viewState === 'list' && (
          <div className="space-y-4">
            <button
              onClick={() => window.navigateTo('/dashboard')}
              className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            >
              <ArrowLeft size={14} /> Back to dashboard
            </button>

            <div>
              <h1 className="font-serif text-[22px] text-primary mb-0.5">Reports</h1>
              <p className="text-xs text-mid">Your reports and summaries — organised by cycle.</p>
            </div>

            <div className="flex gap-3 text-[12px] text-[#4A6A64] pb-1.5 border-b border-[#1E2A2E]/5">
              <span><strong className="text-primary">{cycles.length}</strong> cycles</span>
              <span>·</span>
              <span>
                <strong className="text-primary">
                  {cycles.filter(c => c.assessment_completed).length}
                </strong> Day 28 reports
              </span>
              <span>·</span>
              <span>
                <strong className="text-primary">
                  {reports.filter(r => r.status?.toUpperCase() === 'READY').length}
                </strong> weekly summaries
              </span>
            </div>

            {cycles.length === 0 ? (
              <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-8 text-center text-mid text-xs">
                No active cycles found. Start writing daily entries to initialize your first cycle.
              </div>
            ) : (
              cycles.map((cycle) => {
                const cycleReports = reports.filter(r => r.cycle_id === cycle.id);
                const isOpen = !!openCycles[cycle.id];
                const isCurrent = cycle.status === 'active' || cycle.status === 'ACTIVE';

                return (
                  <div key={cycle.id} className="bg-white border border-[#1E2A2E]/10 rounded-xl overflow-hidden shadow-xs">
                    <div
                      onClick={() => handleToggleCycle(cycle.id)}
                      className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#F5F8F8] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e0a898]/15 text-[#8a3020]">
                            Current
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#8DBFB4]/12 text-[#1A5040]">
                            Completed
                          </span>
                        )}
                        <div>
                          <div className="text-[13.5px] font-semibold">Cycle {cycle.cycle_number}</div>
                          <div className="text-[11px] text-[#8DBFB4] mt-0.5">
                            {cycle.start_date ? new Date(cycle.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Started'} – {cycle.end_date ? new Date(cycle.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#8DBFB4] hidden sm:inline">
                          {cycleReports.length} summaries · {cycle.assessment_completed ? 'report unlocked' : 'report locked'}
                        </span>
                        <ChevronDown size={16} className={`text-mid transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t border-[#1E2A2E]/5 bg-[#FAFBFB] divide-y divide-[#1E2A2E]/5">
                        {/* Day 28 Report Section */}
                        <div className="px-3.5 py-1.5 bg-[#F5F8F8] text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase">
                          Day 28 report
                        </div>
                        {cycle.assessment_completed ? (
                          <div
                            onClick={() => handleOpenAssessment(cycle.id)}
                            className="p-3.5 flex items-center justify-between hover:bg-[#F5F8F8]/60 cursor-pointer bg-white transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e0a898]/15 text-[#8a3020]">
                                New
                              </span>
                              <div>
                                <div className="text-[13px] font-semibold text-primary group-hover:text-secondary-dark transition-colors">Day 28 report</div>
                                <div className="text-[11px] text-[#4A6A64]">Completed cycle analysis</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <button onClick={(e) => handleDownloadAssessment(e, cycle.id)} className="text-[#8DBFB4] hover:text-primary transition-colors border-none bg-transparent">
                                <Download size={15} />
                              </button>
                              <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                                Read <ArrowLeft size={11} className="rotate-180" />
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 flex items-center justify-between bg-white text-mid">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-mint-grey flex items-center justify-center text-[#8DBFB4]">
                                <Lock size={14} />
                              </span>
                              <div>
                                <div className="text-[13px] font-semibold text-primary">Day 28 report</div>
                                <div className="text-[11px] text-[#4A6A64]">
                                  {isCurrent ? `Generates at end of cycle` : `Awaiting cycle assessment completion`}
                                </div>
                              </div>
                            </div>
                            {isCurrent && (
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-1 bg-mint-grey rounded overflow-hidden">
                                  <div
                                    className="bg-accent h-full"
                                    style={{ width: `${Math.min(100, Math.round(((cycle.current_day || 1) / (cycle.total_days || 30)) * 100))}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-[#8DBFB4]">
                                  {Math.max(0, (cycle.total_days || 30) - (cycle.current_day || 1))} days left
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Weekly Summaries Section */}
                        <div className="px-3.5 py-1.5 bg-[#F5F8F8] text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase">
                          Weekly summaries
                        </div>

                        {(() => {
                          const weeksList = [1, 2, 3];
                          const currentWeek = Math.floor(((cycle.current_day || 1) - 1) / 7) + 1;
                          const isActiveCycle = cycle.status?.toUpperCase() !== 'COMPLETED' && cycle.status?.toUpperCase() !== 'COMPLETE';
                          if (currentWeek > 3 && currentWeek <= 4 && isActiveCycle) {
                            weeksList.push(currentWeek);
                          }
                          return weeksList.map(weekNum => {
                            const report = cycleReports.find(r => r.week_number === weekNum);
                            const isWeekCompleted = (cycle.current_day || 1) > (weekNum * 7) || (report && report.status?.toUpperCase() === 'READY');

                            // Calculate completion date based on cycle start_date
                            const startDate = cycle.start_date ? new Date(cycle.start_date) : null;
                            const formattedDate = startDate
                              ? new Date(startDate.getTime() + (weekNum * 7) * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                              : (report?.generated_at ? new Date(report.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');

                            if (!isWeekCompleted) {
                            return (
                              <div key={`locked-week-${weekNum}`} className="p-3.5 flex items-center justify-between bg-white text-mid border-b border-[#1E2A2E]/5 last:border-b-0 opacity-70">
                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-mint-grey text-[#4A6A64]/70">
                                    Week {weekNum}
                                  </span>
                                  <div>
                                    <div className="text-[13px] font-semibold text-[#1E2A2E]/70">Week {weekNum} summary yet to complete</div>
                                    <div className="text-[11px] text-[#4A6A64]">
                                      Will compile automatically on {formattedDate || 'soon'} (Cycle Day {weekNum * 7}).
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[10px] font-semibold text-[#8DBFB4] uppercase tracking-wider">
                                  In Progress
                                </span>
                              </div>
                            );
                          }

                          if (!report) {
                            return (
                              <div key={`generating-week-${weekNum}`} className="p-3.5 flex items-center justify-between bg-white text-mid border-b border-[#1E2A2E]/5 last:border-b-0">
                                <div className="flex items-center gap-3">
                                  <Loader2 className="animate-spin text-secondary" size={14} />
                                  <div>
                                    <div className="text-[13px] font-semibold text-primary">Week {weekNum} summary</div>
                                    <div className="text-[11px] text-[#4A6A64]">
                                      Preparing weekly writing analysis report... {formattedDate && `(${formattedDate})`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                           const status = report.status?.toUpperCase() || 'PENDING';
                           if (status !== 'READY' && status !== 'FAILED') {
                             let statusText = "Queued for generation...";
                             let statusIcon = <Loader2 className="animate-spin text-secondary" size={14} />;
                             if (status === 'GRACE_PERIOD') {
                               statusText = "Almost ready...";
                             } else if (status === 'GENERATING') {
                               statusText = "Finalizing your report...";
                               statusIcon = <Loader2 className="animate-spin text-secondary" size={14} />;
                             } else if (status === 'WAITING_FOR_PROCESSING' || status.startsWith('WAITING_FOR_')) {
                               statusText = "Your weekly insights are being compiled...";
                             } else if (status === 'PENDING') {
                               statusText = "Scheduled for processing...";
                               statusIcon = <span className="w-3.5 h-3.5 rounded-full bg-[#8DBFB4]/30 border border-[#8DBFB4]/50 inline-block" />;
                             }

                             return (
                               <div key={report.id} className="p-3.5 flex items-center justify-between bg-white text-mid border-b border-[#1E2A2E]/5 last:border-b-0">
                                 <div className="flex items-center gap-3">
                                   {statusIcon}
                                   <div>
                                     <div className="text-[13px] font-semibold text-primary">Week {weekNum} summary</div>
                                     <div className="text-[11px] text-[#4A6A64]">
                                       {statusText} {formattedDate && `(${formattedDate})`}
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             );
                           }

                           if (status === 'FAILED') {
                            return (
                              <div key={report.id} className="p-3.5 flex items-center justify-between bg-white text-[#8a3020] border-b border-[#1E2A2E]/5 last:border-b-0">
                                <div className="flex items-center gap-3">
                                  <AlertCircle size={14} className="text-[#8a3020]" />
                                  <div>
                                    <div className="text-[13px] font-semibold text-[#8a3020]">Week {weekNum} summary compilation failed</div>
                                    <div className="text-[11px] text-[#4A6A64]">
                                      Click retry to restart processor {formattedDate && `(${formattedDate})`}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => handleRetryReport(e, report.id, cycle.id, weekNum)}
                                  className="px-2.5 py-1 text-[10.5px] font-semibold text-primary bg-[#e0a898]/15 hover:bg-[#e0a898]/25 rounded transition-all cursor-pointer flex items-center gap-1 border-none"
                                  disabled={retryingId === report.id}
                                >
                                  {retryingId === report.id ? (
                                    <Loader2 className="animate-spin" size={11} />
                                  ) : (
                                    <RefreshCw size={11} />
                                  )}
                                  Retry
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={report.id}
                              onClick={() => handleOpenSummary(report.id)}
                              className="p-3.5 flex items-center justify-between hover:bg-[#F5F8F8]/60 cursor-pointer bg-white transition-colors group border-b border-[#1E2A2E]/5 last:border-b-0"
                            >
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-mint-grey text-primary">
                                  Week {weekNum}
                                </span>
                                <div>
                                  <div className="text-[13px] font-semibold text-primary group-hover:text-secondary-dark transition-colors">
                                    {report.title || `Week ${weekNum} summary`}
                                  </div>
                                  <div className="text-[11px] text-[#4A6A64]">
                                    {formattedDate || 'Ready'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <button onClick={(e) => { e.stopPropagation(); downloadPdf(report); }} className="text-[#8DBFB4] hover:text-primary transition-colors border-none bg-transparent">
                                  <Download size={15} />
                                </button>
                                <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                                  Read <ArrowLeft size={11} className="rotate-180" />
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* View State: SUMMARY (Weekly Detail Screen) */}
        {!loading && !error && viewState === 'summary' && (
          <div className="space-y-4 max-w-[920px] mx-auto page-fade-enter-active">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setViewState('list')}
                className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
              >
                <ArrowLeft size={14} /> Back to reports
              </button>
              {selectedReport && !loadingDetail && (
                <button
                  onClick={() => downloadPdf(selectedReport)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors border border-[#1E2A2E]/10 px-2.5 py-1 rounded bg-white cursor-pointer"
                >
                  <Download size={13} /> Save PDF
                </button>
              )}
            </div>

            {loadingDetail || !selectedReport ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="animate-spin text-secondary" size={24} />
                <p className="text-xs font-serif italic text-mid">Reading weekly patterns...</p>
              </div>
            ) : (
              (() => {
                const data = selectedReport.report_data || {};
                const stats = data.weekly_stats || {};
                const listEmos = data.vocabThisWeek || [];
                const lengths = data.writing_behaviour?.entry_lengths || [];

                // Parse what_we_saw into facts vs realization
                const parts = (data.what_we_saw || '').split('\n\n');
                const sawText = parts[0] || '';
                const realizationText = parts[1] || '';

                let sinceLastWeekContent = '';
                if (typeof data.since_last_week === 'string') {
                  sinceLastWeekContent = data.since_last_week;
                } else if (data.since_last_week && typeof data.since_last_week === 'object') {
                  const lastWords = data.since_last_week.last_week_words || [];
                  const thisWords = data.since_last_week.this_week_words || [];
                  if (lastWords.length === 0) {
                    sinceLastWeekContent = 'First week on record. No prior week to compare.';
                  } else {
                    sinceLastWeekContent = `Last week: ${lastWords.join(', ')}. This week: ${thisWords.join(', ')}.`;
                  }
                } else {
                  sinceLastWeekContent = 'First week on record. No prior week to compare.';
                }

                return (
                  <div className="rpt">
                    <div className="hdr">
                      <div className="hl">
                        <div className="logo font-semibold">ingress <span>within</span></div>
                        <div className="wl" style={{ textTransform: 'uppercase' }}>Week {selectedReport.week_number} Summary</div>
                      </div>
                      <div className="dr">{stats.week_range || (selectedReport.generated_at ? new Date(selectedReport.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '')}</div>
                    </div>

                    <div className="body">
                      {/* STATS SECTION */}
                      <div className="sr">
                        <div className="sc">
                          <div className="sl">Entries</div>
                          <div className="sv">{stats.entries_completed}<sup>/{stats.total_possible}</sup></div>
                          <div className="ss">
                            {stats.skipped_days > 0 ? `${stats.skipped_days} day${stats.skipped_days > 1 ? 's' : ''} skipped` : 'Perfect streak'}
                          </div>
                        </div>
                        <div className="sc">
                          <div className="sl">Top focal expression</div>
                          <div className="sw">"{listEmos[0]?.word || 'none'}"</div>
                          <div className="ss">appeared {listEmos[0]?.frequency || 0} times</div>
                        </div>
                        <div className="sc">
                          <div className="sl">Week tone</div>
                          <div className="st">{selectedReport.title || 'Neutral baseline'}</div>
                        </div>
                      </div>

                      {/* SINCE LAST WEEK */}
                      <div className="since-last">
                        <div className="eyebrow">Since Last Week</div>
                        <p>{sinceLastWeekContent}</p>
                      </div>

                      <div className="tc">
                        {/* LEFT COLUMN */}
                        <div>
                          <div className="lbl">Emotion language this week</div>
                          <div className="cx">Words pulled from your writing this week, grouped with related words you didn't use.</div>

                          <div className="space-y-3">
                            {data.emotion_clusters && data.emotion_clusters.length > 0 ? (
                              data.emotion_clusters.slice(0, 3).map((cluster, index) => (
                                <div key={index} className="cr">
                                  <span className="wu">{cluster.word} →</span>
                                  {(cluster.related || []).slice(0, 3).map((rel, rIdx) => (
                                    <span key={rIdx} className="wn">{rel}</span>
                                  ))}
                                </div>
                              ))
                            ) : (
                              listEmos.slice(0, 3).map((emo, index) => (
                                <div key={index} className="cr">
                                  <span className="wu">{emo.word} →</span>
                                  <span className="wn">{emo.normalized_word}</span>
                                </div>
                              ))
                            )}
                          </div>

                          {data.analytical_block && (
                            <div className="cluster-note mt-3 text-xs leading-relaxed text-[#22262b]">
                              Theme: <strong>{data.analytical_block.primary_theme}</strong>. Emotional register: <strong>{data.analytical_block.emotional_tone}</strong>.
                            </div>
                          )}

                          <div className="dv"></div>

                          <div className="lbl">How the week moved</div>
                          <div className="rpt-bars-container">
                            {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                              const h = lengths[dayIdx] || 0;
                              const isEmpty = h === 0;

                              return (
                                <div key={dayIdx} className="rpt-bar-wrapper">
                                  {isEmpty ? (
                                    <div className="rpt-bar-element empty" />
                                  ) : (
                                    <div
                                      className="rpt-bar-element"
                                      style={{ height: `${h}%` }}
                                    />
                                  )}
                                  <span className="rpt-bar-label">D{dayIdx + 1}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="arc-note">
                            {data.writing_behaviour?.consistency || 'Writing patterns logged consistently.'}
                          </div>

                        </div>

                        {/* RIGHT COLUMN */}
                        <div>
                          <div className="lbl">What we saw</div>
                          <div className="ws font-serif text-[15px] leading-[1.8] text-[#22262b] mb-6">
                            {sawText || selectedReport.body}
                          </div>

                          {realizationText && (
                            <div className="yt font-serif text-[15.5px] leading-relaxed text-[#1c2733] border-l-[3px] border-[#d98b6b] pl-[14px] mb-5 bg-transparent rounded-none">
                              {realizationText}
                            </div>
                          )}

                          <div className="why-hedge">
                            Based on {stats.entries_completed || 0} of {stats.total_possible || 7} entries this week.
                          </div>

                        </div>
                      </div>

                      {/* CRISIS STATUS */}
                      {data.crisis_review && (
                        <div className="status-bar">
                          {data.crisis_review.occurred ? (
                            <span className="text-[#8a3020] font-semibold">⚠️ Alert: {data.crisis_review.summary}</span>
                          ) : (
                            <span>No crisis indicators were detected this week.</span>
                          )}
                        </div>
                      )}

                      <div className="cb mt-5">
                        <div className="cq">
                          "{data.candidate_quote || 'Reflecting on your logs helps align focus.'}"
                        </div>
                        <div className="carry-label">Carry Question</div>
                        <div className="co">
                          {selectedReport.open_question || data.carry_question}
                        </div>
                      </div>
                    </div>

                    <div className="foot">
                      <button
                        onClick={() => setViewState('list')}
                        className="foot-link border-none bg-transparent hover:text-primary transition-colors cursor-pointer"
                      >
                        ← Back to progress
                      </button>
                      <div className="foot-center">Ingress Within · Week {selectedReport.week_number}</div>
                      <button
                        onClick={() => window.navigateTo('/write')}
                        className="foot-link border-none bg-transparent hover:text-primary transition-colors cursor-pointer"
                      >
                        Write today's entry
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* View State: REPORT (Day 28 Synthesis Report) */}
        {!loading && !error && viewState === 'report' && (
          <div className="space-y-4 max-w-[620px] mx-auto page-fade-enter-active">
            <button
              onClick={() => setViewState('list')}
              className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            >
              <ArrowLeft size={14} /> Back to reports
            </button>

            {loadingDetail || !selectedAssessment ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="animate-spin text-secondary" size={24} />
                <p className="text-xs font-serif italic text-mid">Decoding monthly cycle data...</p>
              </div>
            ) : (
              (() => {
                const cycleObj = cycles.find(c => c.id === selectedCycleId) || {};



                return (
                  <div className="space-y-4">
                    <div className="bg-[#1E2A2E] border-none text-white rounded-xl p-4.5 flex flex-col justify-between shadow-md">
                      <div className="space-y-1.5">
                        <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">
                          Cycle {cycleObj.cycle_number} · Day 28 report · Generated {selectedAssessment.generated_at ? new Date(selectedAssessment.generated_at).toLocaleDateString('en-GB') : ''}
                        </div>
                        <h2 className="font-serif text-lg text-white leading-snug">28 days of honest writing — here is what it showed.</h2>
                        <p className="text-[11.5px] text-[#5A8A84]">
                          {selectedAssessment.entry_count} entries · {selectedAssessment.path_assignment || 'Guided pathway'}
                        </p>
                      </div>
                      <button
                        onClick={() => downloadPdf(selectedAssessment, true)}
                        className="mt-3 px-3.5 py-1.5 border border-white/15 rounded text-xs font-semibold bg-white/8 hover:bg-white/15 transition-all text-white w-fit cursor-pointer flex items-center gap-1.5"
                      >
                        <Download size={13} /> Save PDF
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">What this cycle showed</div>
                      <p className="text-[14.5px] text-[#1E2A2E] leading-relaxed font-serif bg-white border border-[#1E2A2E]/5 p-4.5 rounded-xl">
                        {selectedAssessment.report_text || 'No cycle summary narrative compiled.'}
                      </p>
                    </div>



                    <div className="bg-primary text-[#E0EEEC] rounded-xl p-4.5 space-y-3">
                      <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">Carry into Cycle {Number(cycleObj.cycle_number || 1) + 1}</div>
                      <p className="text-[13px] leading-relaxed">
                        Pathway assignment for your integration is: <strong>{selectedAssessment.path_assignment || 'second_cycle'}</strong>.
                        Branch code: <strong>{selectedAssessment.branch_assignment || 'A'}</strong>.
                      </p>
                      <div className="border-l-[2.5px] border-[#E0A898]/40 pl-4 space-y-1">
                        <p className="text-[14px] text-[#E0A898] italic font-serif leading-relaxed">
                          " visibility is the first condition for change. Fix focus on agency."
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </main>
    </div>
  );
}
