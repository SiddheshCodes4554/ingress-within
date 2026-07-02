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
        const freshReports = await DashboardService.fetchWeeklyReports();
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
      const listEmos = data.emotional_language || [];
      const lengths = data.writing_behaviour?.entry_lengths || [];
      const maxLen = Math.max(...lengths, 1);

      contentHtml = `
        <div class="rpt" style="border: none; box-shadow: none; margin: 0;">
          <div class="hdr">
            <div class="hl">
              <div class="logo">ingress <span>within</span></div>
              <div class="hdiv"></div>
              <div class="wl">Week ${reportData.week_number} — Pattern Summary</div>
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
                <div class="sw">"${listEmos[0]?.expression || 'none'}"</div>
                <div class="ss">appeared ${listEmos[0]?.frequency || 0} times</div>
              </div>
              <div class="sc">
                <div class="sl">Week tone</div>
                <div class="st">${reportData.title || 'Neutral baseline'}</div>
              </div>
            </div>
            <div class="tc">
              <div>
                <div class="lbl">Emotion language this week</div>
                <div class="cx">Words pulled from your writing this week, grouped with related words you didn't use.</div>
                <div class="space-y-3" style="margin-top: 10px;">
                  ${listEmos.map(emo => `
                    <div class="cr" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                      <span class="wu" style="background: var(--terracotta-rose); color: #7A3A28; font-size: 11px; padding: 3px 9px; border-radius: 20px; font-weight: 500;">${emo.expression} ×${emo.frequency}</span>
                      <span style="font-size: 12px; color: var(--text-secondary)">→</span>
                      ${(emo.related || []).slice(0, 3).map(rel => `<span class="wn" style="border: 1px solid var(--border-tertiary); font-size: 11px; padding: 3px 9px; border-radius: 20px; color: var(--text-secondary); margin-left: 4px;">${rel}</span>`).join('')}
                    </div>
                  `).join('')}
                </div>
                <div class="dv"></div>
                <div class="lbl">How the week moved</div>
                <div class="rpt-bars-container">
                  ${[0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                    const len = lengths[dayIdx] || 0;
                    const h = maxLen > 0 ? Math.round((len / maxLen) * 64) : 0;
                    const barColor = len === 0 ? '#ECEFF0' : h > 45 ? 'var(--terracotta-rose)' : h > 20 ? '#B8C8C6' : 'var(--ocean-sage)';
                    return `
                      <div class="rpt-bar-wrapper">
                        <span class="rpt-bar-value">${len > 0 ? len + 'w' : '—'}</span>
                        <div class="rpt-bar-element" style="height: ${Math.max(6, h)}px; background: ${barColor}"></div>
                        <span class="rpt-bar-label">D${dayIdx + 1}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
                <div class="arc-note" style="margin-top: 10px;">${data.writing_behaviour?.consistency || 'Writing patterns logged consistently.'}</div>
              </div>
              <div>
                <div class="lbl">What we saw</div>
                <div class="ws" style="font-family: Georgia, serif; font-size: 15.5px; line-height: 1.75; margin-bottom: 18px;">
                  ${data.week_narrative || reportData.body}
                </div>
                <div class="yl">Why this matters</div>
                <div class="yt" style="font-family: Georgia, serif; font-size: 13px; line-height: 1.65; padding: 12px; background: #F5F6F6; border-left: 2px solid var(--terracotta-rose); border-radius: 8px;">
                  ${reportData.why || 'Recognizing these dynamics helps map triggers.'}
                </div>
                ${data.pattern_evolution ? `
                  <div style="margin-top: 20px;">
                    <div class="lbl">Pattern Snapshots</div>
                    <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.6; margin-top: 6px;">
                      ${data.pattern_evolution.recurring_themes?.length > 0 ? `<div>• <strong>Theme:</strong> ${data.pattern_evolution.recurring_themes[0]}</div>` : ''}
                      ${data.pattern_evolution.repeated_stressors?.length > 0 ? `<div>• <strong>Stressor:</strong> ${data.pattern_evolution.repeated_stressors[0]}</div>` : ''}
                      ${data.pattern_evolution.coping_strategies?.length > 0 ? `<div>• <strong>Coping:</strong> ${data.pattern_evolution.coping_strategies[0]}</div>` : ''}
                    </div>
                  </div>
                ` : ''}
                ${data.vocabulary_evolution ? `
                  <div style="margin-top: 15px;">
                    <div class="lbl">Vocabulary Shift</div>
                    <div style="font-size: 11px; display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
                      ${data.vocabulary_evolution.new_expressions?.slice(0, 3).map(w => `<span style="background: rgba(184,168,212,0.15); color: #8a3020; border: 1px solid rgba(184,168,212,0.2); padding: 3px 7px; border-radius: 4px; font-weight: 500;">+${w}</span>`).join('')}
                      ${data.vocabulary_evolution.growing_expressions?.slice(0, 3).map(w => `<span style="background: rgba(224,168,152,0.15); color: #8a3020; border: 1px solid rgba(224,168,152,0.2); padding: 3px 7px; border-radius: 4px; font-weight: 500;">${w}</span>`).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
            ${data.crisis_review ? `
              <div style="margin-top: 20px; padding: 12px; background: rgba(30,42,46,0.03); border: 1px solid rgba(30,42,46,0.06); border-radius: 10px; text-align: center; font-size: 12px; color: var(--text-secondary);">
                ${data.crisis_review.occurred ? `<span style="color: #8a3020; font-weight: 600;">⚠️ Alert: ${data.crisis_review.summary}</span>` : 'No crisis indicators were detected this week.'}
              </div>
            ` : ''}
            <div class="cb" style="margin-top: 24px; background: var(--teal-black); padding: 20px; border-radius: 12px; color: white;">
              <div class="cq" style="font-family: Georgia, serif; font-size: 18px; font-style: italic; color: var(--terracotta-rose); margin-bottom: 8px;">"${data.growth_reflection || 'Reflecting on your logs helps align focus.'}"</div>
              <div class="co" style="font-size: 12px; color: rgba(236,239,240,0.55);">Carry Question: ${reportData.open_question || data.reflection_question}</div>
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
              <div class="logo">ingress <span>within</span></div>
              <div class="hdiv"></div>
              <div class="wl">Cycle ${cycleObj.cycle_number || 1} Assessment Report</div>
            </div>
            <div class="dr">${new Date(reportData.generated_at).toLocaleDateString('en-GB')}</div>
          </div>
          <div class="body">
            <h2 style="font-family: Georgia, serif; font-size: 20px; font-weight: normal; color: var(--teal-black); margin-bottom: 12px;">
              28 days of honest writing — here is what it showed.
            </h2>
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 24px;">
              ${reportData.entry_count} entries completed · ${reportData.path_assignment || 'Guided pathway'}
            </div>

            <div style="margin-bottom: 24px;">
              <div class="lbl">What this cycle showed</div>
              <p style="font-family: Georgia, serif; font-size: 15px; line-height: 1.75; color: var(--teal-black); padding: 16px; background: #FAFBFB; border: 1px solid var(--border-tertiary); border-radius: 12px; margin-top: 6px;">
                ${reportData.report_text || ''}
              </p>
            </div>

            <div class="cb" style="background: var(--teal-black); padding: 24px; border-radius: 12px; color: white;">
              <div class="lbl" style="color: var(--ocean-sage); font-size: 11px; text-transform: uppercase; margin-bottom: 8px;">Carry into Cycle ${Number(cycleObj.cycle_number || 1) + 1}</div>
              <p style="font-size: 13.5px; line-height: 1.6; color: #ECEFF0; margin-bottom: 16px;">
                Pathway assignment for your integration is: <strong>${reportData.path_assignment || 'second_cycle'}</strong>.<br/>
                Branch assignment code: <strong>${reportData.branch_assignment || 'A'}</strong>.
              </p>
              <div style="border-left: 2.5px solid rgba(224,168,152,0.4); padding-left: 16px;">
                <p style="font-family: Georgia, serif; font-size: 14.5px; font-style: italic; color: var(--terracotta-rose);">
                  " visibility is the first condition for change. Fix focus on agency."
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
              --teal-black: #1E2A2E;
              --mint-grey: #ECEFF0;
              --terracotta-rose: #E0A898;
              --ocean-sage: #8DBFB4;
              --soft-iris: #B8A8D4;
              --border-tertiary: rgba(30,42,46,0.12);
              --bg-secondary: #F5F6F6;
              --text-secondary: rgba(30,42,46,0.6);
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'DM Sans', sans-serif; background: #fff; padding: 40px; color: var(--teal-black); }
            .rpt { max-width: 820px; margin: 0 auto; background: #fff; }
            .hdr { background: var(--teal-black); padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; border-radius: 12px 12px 0 0; }
            .hl { display: flex; align-items: center; gap: 10px; }
            .logo { font-size: 14px; font-weight: 500; color: #ECEFF0; text-transform: lowercase; }
            .logo span { color: var(--ocean-sage); }
            .hdiv { width: 1px; height: 14px; background: rgba(236,239,240,0.2); }
            .wl { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--ocean-sage); font-weight: 500; }
            .dr { font-size: 12px; color: rgba(236,239,240,0.4); }
            .body { padding: 30px 24px; border: 1px solid var(--border-tertiary); border-top: none; border-radius: 0 0 12px 12px; }
            .sr { display: grid; grid-template-columns: 1fr 1fr 2.2fr; border: 1px solid var(--border-tertiary); border-radius: 10px; margin-bottom: 24px; overflow: hidden; }
            .sc { padding: 14px 16px; border-right: 1px solid var(--border-tertiary); }
            .sc:last-child { border-right: none; }
            .sl { font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 6px; }
            .sv { font-size: 26px; font-weight: 400; color: var(--teal-black); line-height: 1.1; }
            .sv sup { font-size: 13px; color: var(--text-secondary); }
            .ss { font-size: 11.5px; color: var(--text-secondary); margin-top: 3px; }
            .sw { font-size: 20px; font-weight: 400; color: var(--terracotta-rose); font-style: italic; }
            .st { font-size: 13px; color: var(--teal-black); line-height: 1.5; }
            .tc { display: grid; grid-template-columns: 1fr 1.3fr; gap: 30px; margin-bottom: 20px; }
            .lbl { font-size: 10.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--ocean-sage); margin-bottom: 12px; }
            .cx { font-size: 11.5px; color: var(--text-secondary); line-height: 1.55; padding: 8px 10px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 12px; }
            .cr { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
            .wu { background: var(--terracotta-rose); color: #7A3A28; font-size: 11.5px; padding: 3px 9px; border-radius: 20px; font-weight: 500; }
            .wn { border: 1px solid var(--border-tertiary); font-size: 11.5px; padding: 3px 9px; border-radius: 20px; color: var(--text-secondary); }
            .dv { border: none; border-top: 1px solid var(--border-tertiary); margin: 20px 0; }
            
            .rpt-bars-container { display: flex; align-items: flex-end; justify-content: space-between; height: 90px; margin-top: 16px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid var(--border-tertiary); }
            .rpt-bar-wrapper { display: flex; flex-direction: column; align-items: center; flex: 1; max-width: 38px; }
            .rpt-bar-value { font-size: 9px; font-weight: 600; color: var(--teal-black); margin-bottom: 4px; opacity: 0.85; font-family: monospace; }
            .rpt-bar-element { width: 100%; border-radius: 6px 6px 0 0; }
            .rpt-bar-label { font-size: 10px; font-weight: 600; color: var(--text-secondary); margin-top: 6px; }
            .arc-note { font-size: 11px; color: var(--text-secondary); line-height: 1.5; }

            .cb { background: var(--teal-black); border-radius: 10px; padding: 20px; color: white; }
            .cq { font-size: 18px; font-style: italic; color: var(--terracotta-rose); line-height: 1.5; margin-bottom: 8px; }
            .co { font-size: 12px; color: rgba(236,239,240,0.55); }

            @media print {
              body { padding: 0; }
              .hdr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .wu { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .cb { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .rpt-bar-element { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${contentHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans relative pb-20">
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --teal-black: #1E2A2E;
          --mint-grey: #ECEFF0;
          --terracotta-rose: #E0A898;
          --ocean-sage: #8DBFB4;
          --soft-iris: #B8A8D4;
          --border-tertiary: rgba(30,42,46,0.12);
          --bg-secondary: #F5F6F6;
          --text-secondary: rgba(30,42,46,0.6);
        }
        .rpt {
          max-width: 900px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid var(--border-tertiary);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(30,42,46,0.05);
        }
        .hdr {
          background: var(--teal-black);
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .hl {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo {
          font-size: 14px;
          font-weight: 500;
          color: #ECEFF0;
        }
        .logo span {
          color: var(--ocean-sage);
        }
        .hdiv {
          width: 1px;
          height: 14px;
          background: rgba(236,239,240,0.2);
        }
        .wl {
          font-size: 11px;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--ocean-sage);
          font-weight: 500;
        }
        .dr {
          font-size: 12px;
          color: rgba(236,239,240,0.4);
        }
        .body {
          padding: 24px;
        }
        .sr {
          display: grid;
          grid-template-columns: 1fr 1fr 2fr;
          border: 1px solid var(--border-tertiary);
          border-radius: 10px;
          margin-bottom: 24px;
          overflow: hidden;
        }
        .sc {
          padding: 12px 16px;
          border-right: 1px solid var(--border-tertiary);
        }
        .sc:last-child {
          border-right: none;
        }
        .sl {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .sv {
          font-size: 26px;
          font-weight: 400;
          color: var(--teal-black);
          line-height: 1.1;
        }
        .sv sup {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .ss {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .sw {
          font-size: 20px;
          font-weight: 400;
          color: var(--terracotta-rose);
          font-style: italic;
        }
        .st {
          font-size: 13px;
          color: var(--teal-black);
          line-height: 1.5;
        }
        .tc {
          display: grid;
          grid-template-columns: 1fr 1.4fr;
          gap: 24px;
          margin-bottom: 20px;
        }
        .lbl {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--ocean-sage);
          margin-bottom: 10px;
        }
        .cx {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.55;
          padding: 8px 10px;
          background: var(--bg-secondary);
          border-radius: 8px;
          margin-bottom: 10px;
        }
        .cr {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }
        .wu {
          background: var(--terracotta-rose);
          color: #7A3A28;
          font-size: 12px;
          padding: 3px 9px;
          border-radius: 20px;
          font-weight: 500;
        }
        .wn {
          border: 1px solid var(--border-tertiary);
          font-size: 12px;
          padding: 3px 9px;
          border-radius: 20px;
          color: var(--text-secondary);
        }
        .dv {
          border: none;
          border-top: 1px solid var(--border-tertiary);
          margin: 18px 0;
        }
        .rpt-bars-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 100px;
          margin-top: 16px;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid var(--border-tertiary);
        }
        .rpt-bar-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          max-width: 38px;
          position: relative;
        }
        .rpt-bar-value {
          font-size: 9px;
          font-weight: 600;
          color: var(--teal-black);
          margin-bottom: 4px;
          opacity: 0.85;
          font-family: monospace;
        }
        .rpt-bar-element {
          width: 100%;
          border-radius: 6px 6px 0 0;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .rpt-bar-element:hover {
          transform: scaleY(1.05);
          filter: brightness(1.05);
        }
        .rpt-bar-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-top: 6px;
          letter-spacing: 0.02em;
        }
        .arc-note {
          font-size: 11px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .ws {
          font-size: 16px;
          font-weight: 400;
          line-height: 1.75;
          color: var(--teal-black);
          margin-bottom: 18px;
        }
        .yl {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--ocean-sage);
          margin-bottom: 8px;
        }
        .yt {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.65;
          padding: 10px 12px;
          background: var(--bg-secondary);
          border-radius: 8px;
          border-left: 2px solid var(--terracotta-rose);
        }
        .eb {
          border: 1px solid var(--border-tertiary);
          border-radius: 10px;
          overflow: hidden;
        }
        .er {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-tertiary);
        }
        .er:last-child {
          border-bottom: none;
        }
        .ed {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--ocean-sage);
          margin-top: 5px;
          flex-shrink: 0;
        }
        .en {
          font-size: 12px;
          font-weight: 500;
          color: var(--teal-black);
          margin-bottom: 2px;
        }
        .el {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .cb {
          background: var(--teal-black);
          border-radius: 10px;
          padding: 20px;
        }
        .cq {
          font-size: 19px;
          font-style: italic;
          color: var(--terracotta-rose);
          line-height: 1.5;
          margin-bottom: 8px;
        }
        .co {
          font-size: 13px;
          color: rgba(236,239,240,0.55);
          line-height: 1.6;
        }
        .foot {
          background: var(--teal-black);
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 24px -24px -24px;
        }
        .foot-link {
          font-size: 11px;
          color: var(--ocean-sage);
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
            border-bottom: 1px solid var(--border-tertiary);
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
                  {reports.filter(r => r.status === 'ready').length}
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

                        {[1, 2, 3].map(weekNum => {
                          const report = cycleReports.find(r => r.week_number === weekNum);
                          const isWeekCompleted = (cycle.current_day || 1) >= (weekNum * 7);

                          if (!isWeekCompleted) {
                            // Calculate completion date based on cycle start_date
                            const startDate = cycle.start_date ? new Date(cycle.start_date) : new Date();
                            const completionDate = new Date(startDate.getTime() + (weekNum * 7) * 24 * 60 * 60 * 1000);
                            const formattedDate = completionDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

                            return (
                              <div key={`locked-week-${weekNum}`} className="p-3.5 flex items-center justify-between bg-white text-mid border-b border-[#1E2A2E]/5 last:border-b-0 opacity-70">
                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-mint-grey text-[#4A6A64]/70">
                                    Week {weekNum}
                                  </span>
                                  <div>
                                    <div className="text-[13px] font-semibold text-[#1E2A2E]/70">Week {weekNum} summary yet to complete</div>
                                    <div className="text-[11px] text-[#4A6A64]">
                                      Will compile automatically on {formattedDate} (Cycle Day {weekNum * 7}).
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
                                    <div className="text-[11px] text-[#4A6A64]">Preparing weekly writing analysis report...</div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (report.status === 'pending') {
                            return (
                              <div key={report.id} className="p-3.5 flex items-center justify-between bg-white text-mid border-b border-[#1E2A2E]/5 last:border-b-0">
                                <div className="flex items-center gap-3">
                                  <Loader2 className="animate-spin text-secondary" size={14} />
                                  <div>
                                    <div className="text-[13px] font-semibold text-primary">Week {weekNum} summary</div>
                                    <div className="text-[11px] text-[#4A6A64]">Generating report in background...</div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (report.status === 'failed') {
                            return (
                              <div key={report.id} className="p-3.5 flex items-center justify-between bg-white text-[#8a3020] border-b border-[#1E2A2E]/5 last:border-b-0">
                                <div className="flex items-center gap-3">
                                  <AlertCircle size={14} className="text-[#8a3020]" />
                                  <div>
                                    <div className="text-[13px] font-semibold text-[#8a3020]">Week {weekNum} summary compilation failed</div>
                                    <div className="text-[11px] text-[#4A6A64]">Click retry to restart processor</div>
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

                          const startDate = cycle.start_date ? new Date(cycle.start_date) : null;
                          const formattedDate = startDate
                            ? new Date(startDate.getTime() + (weekNum * 7) * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                            : (report.generated_at ? new Date(report.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Ready');

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
                                    {formattedDate}
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
                        })}
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
          <div className="space-y-4 max-w-[620px] mx-auto page-fade-enter-active">
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
                const listEmos = data.emotional_language || [];
                const lengths = data.writing_behaviour?.entry_lengths || [];
                const times = data.writing_behaviour?.writing_times || [];
                const maxLen = Math.max(...lengths, 1);

                return (
                  <div className="rpt">
                    <div className="hdr">
                      <div className="hl">
                        <div className="logo">ingress <span>within</span></div>
                        <div className="hdiv"></div>
                        <div className="wl">Week {selectedReport.week_number} — Pattern Summary</div>
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
                          <div className="sw">"{listEmos[0]?.expression || 'none'}"</div>
                          <div className="ss">appeared {listEmos[0]?.frequency || 0} times</div>
                        </div>
                        <div className="sc">
                          <div className="sl">Week tone</div>
                          <div className="st">{selectedReport.title || 'Neutral baseline'}</div>
                        </div>
                      </div>

                      <div className="tc">
                        {/* LEFT COLUMN */}
                        <div>
                          <div className="lbl">Emotion language this week</div>
                          <div className="cx">Words pulled from your writing this week, grouped with related words you didn't use.</div>
                          
                          <div className="space-y-3">
                            {listEmos.length === 0 ? (
                              <p className="text-xs text-mid italic">Insufficient emotional expressions detected.</p>
                            ) : (
                              listEmos.map((emo, index) => (
                                <div key={index} className="cr">
                                  <span className="wu">{emo.expression} ×{emo.frequency}</span>
                                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>→</span>
                                  {(emo.related || []).slice(0, 3).map((rel, rIdx) => (
                                    <span key={rIdx} className="wn">{rel}</span>
                                  ))}
                                </div>
                              ))
                            )}
                          </div>

                          <div className="dv"></div>

                          <div className="lbl">How the week moved</div>
                          <div className="rpt-bars-container">
                            {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                              const len = lengths[dayIdx] || 0;
                              // Scale to max height of 64px inside the 100px container
                              const h = maxLen > 0 ? Math.round((len / maxLen) * 64) : 0;
                              const barColor = len === 0 
                                ? '#ECEFF0' 
                                : h > 45 ? 'var(--terracotta-rose)' : h > 20 ? '#B8C8C6' : 'var(--ocean-sage)';
                              
                              return (
                                <div key={dayIdx} className="rpt-bar-wrapper group">
                                  {len > 0 ? (
                                    <span className="rpt-bar-value">{len}w</span>
                                  ) : (
                                    <span className="rpt-bar-value" style={{ opacity: 0.25 }}>—</span>
                                  )}
                                  <div 
                                    className="rpt-bar-element" 
                                    style={{ height: `${Math.max(6, h)}px`, background: barColor }} 
                                  />
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
                          <div className="ws font-serif text-[15.5px] leading-relaxed text-primary mb-4">
                            {data.week_narrative || selectedReport.body}
                          </div>

                          <div className="yl">Why this matters</div>
                          <div className="yt font-serif text-[13px] text-mid leading-[1.65] p-3 bg-secondary/5 rounded-lg border-l-2 border-accent">
                            {selectedReport.why || 'Recognizing these dynamics helps map triggers.'}
                          </div>

                          {data.pattern_evolution && (
                            <div className="mt-4 space-y-2">
                              <div className="lbl">Pattern Snapshots</div>
                              <div className="text-[12px] space-y-1 text-mid">
                                {data.pattern_evolution.recurring_themes?.length > 0 && (
                                  <div>• <strong>Theme:</strong> {data.pattern_evolution.recurring_themes[0]}</div>
                                )}
                                {data.pattern_evolution.repeated_stressors?.length > 0 && (
                                  <div>• <strong>Stressor:</strong> {data.pattern_evolution.repeated_stressors[0]}</div>
                                )}
                                {data.pattern_evolution.coping_strategies?.length > 0 && (
                                  <div>• <strong>Coping:</strong> {data.pattern_evolution.coping_strategies[0]}</div>
                                )}
                              </div>
                            </div>
                          )}

                          {data.vocabulary_evolution && (
                            <div className="mt-4 space-y-1">
                              <div className="lbl">Vocabulary Shift</div>
                              <div className="text-[11px] text-mid flex flex-wrap gap-1">
                                {data.vocabulary_evolution.new_expressions?.slice(0, 3).map((w, idx) => (
                                  <span key={idx} className="bg-supporting/15 text-supporting border border-supporting/20 px-2 py-0.5 rounded text-[10px]">
                                    +{w}
                                  </span>
                                ))}
                                {data.vocabulary_evolution.growing_expressions?.slice(0, 3).map((w, idx) => (
                                  <span key={idx} className="bg-[#e0a898]/15 text-[#8a3020] border border-[#e0a898]/20 px-2 py-0.5 rounded text-[10px]">
                                    {w} (growing)
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>



                      {/* CRISIS STATUS */}
                      {data.crisis_review && (
                        <div className="mt-4 p-3 bg-mint-grey/50 border border-[#1E2A2E]/5 rounded-xl text-center text-xs text-mid">
                          {data.crisis_review.occurred ? (
                            <span className="text-[#8a3020] font-semibold">⚠️ Alert: {data.crisis_review.summary}</span>
                          ) : (
                            <span>No crisis indicators were detected this week.</span>
                          )}
                        </div>
                      )}

                      <div className="cb mt-5">
                        <div className="cq font-serif text-[18px] text-accent font-light italic leading-relaxed mb-2.5">
                          "{data.growth_reflection || 'Reflecting on your logs helps align focus.'}"
                        </div>
                        <div className="co text-xs text-[#ECEFF0]/60">
                          Carry Question: {selectedReport.open_question || data.reflection_question}
                        </div>
                      </div>
                    </div>

                    <div className="foot">
                      <button 
                        onClick={() => setViewState('list')} 
                        className="foot-link border-none bg-transparent hover:text-primary transition-colors cursor-pointer text-secondary"
                      >
                        ← Back to progress
                      </button>
                      <div className="foot-center">Ingress Within · Week {selectedReport.week_number}</div>
                      <button 
                        onClick={() => window.navigateTo('/write')}
                        className="foot-link border-none bg-transparent hover:text-primary transition-colors cursor-pointer text-secondary"
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
