/*
 * Radar Conformité - Looker Studio Community Visualization
 * Bundled: dscc (via CDN) + Chart.js 4.4.1
 * Usage: map Phase (dim), Conformité % (metric), Planifié (metric), Réel (metric)
 */

(function() {
  'use strict';

  /* ── Load Chart.js dynamically ── */
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

  /* ── Inject base styles ── */
  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      'body { margin: 0; padding: 0; font-family: sans-serif; background: transparent; }',
      '#radar-container { width: 100%; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box; padding: 12px; }',
      '#radar-canvas-wrap { position: relative; width: 100%; max-width: 520px; height: 340px; }',
      '#legend { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 8px; font-size: 11px; color: #666; }',
      '.legend-item { display: flex; align-items: center; gap: 5px; }',
      '.legend-dot { width: 10px; height: 10px; border-radius: 2px; }',
      '#subtitle { font-size: 10px; color: #999; margin-top: 4px; text-align: center; }'
    ].join('');
    document.head.appendChild(style);
  }

  /* ── Build DOM skeleton ── */
  function buildDOM() {
    document.body.innerHTML = '';
    var container = document.createElement('div');
    container.id = 'radar-container';

    var wrap = document.createElement('div');
    wrap.id = 'radar-canvas-wrap';

    var canvas = document.createElement('canvas');
    canvas.id = 'radarCanvas';
    wrap.appendChild(canvas);

    var legend = document.createElement('div');
    legend.id = 'legend';
    legend.innerHTML = [
      '<span class="legend-item"><span class="legend-dot" id="leg-radar"></span>Conformité (%)</span>',
      '<span class="legend-item"><span class="legend-dot" id="leg-target" style="background:#639922;"></span>Cible 100%</span>'
    ].join('');

    var subtitle = document.createElement('div');
    subtitle.id = 'subtitle';
    subtitle.textContent = 'Conformité > 100% = plus rapide que prévu  ·  < 100% = dépassement';

    container.appendChild(wrap);
    container.appendChild(legend);
    container.appendChild(subtitle);
    document.body.appendChild(container);
  }

  /* ── Determine point color based on conformity value ── */
  function pointColor(val) {
    if (val >= 100) return '#639922';
    if (val === 0)  return '#A32D2D';
    return '#D85A30';
  }

  /* ── Draw the radar chart ── */
  var chartInstance = null;

  function drawRadar(data) {
    var rows    = data.tables.DEFAULT;
    var style   = data.style;

    /* Extract style overrides */
    var radarHex  = (style.radarColor  && style.radarColor.value  && style.radarColor.value.color)  || '#D85A30';
    var targetHex = (style.targetColor && style.targetColor.value && style.targetColor.value.color) || '#639922';
    var maxScale  = parseInt((style.maxScale  && style.maxScale.value)  || '260', 10) || 260;
    var showTarget = (style.showTarget && style.showTarget.value) !== false;

    /* Parse rows */
    var labels  = [];
    var confVals = [];
    var planned = [];
    var actual  = [];

    rows.forEach(function(row) {
      labels.push(row['dimID'][0]);

      var c = parseFloat(row['metricConformite'] && row['metricConformite'][0]);
      confVals.push(isNaN(c) ? 0 : Math.min(c, maxScale));

      var p = parseFloat(row['metricPlanned'] && row['metricPlanned'][0]);
      planned.push(isNaN(p) ? 0 : p);

      var a = parseFloat(row['metricActual'] && row['metricActual'][0]);
      actual.push(isNaN(a) ? 0 : a);
    });

    /* Update legend dot color */
    var legRadar = document.getElementById('leg-radar');
    if (legRadar) legRadar.style.background = radarHex;
    var legTarget = document.getElementById('leg-target');
    if (legTarget) legTarget.style.background = targetHex;

    /* Convert hex to rgba */
    function hexToRgba(hex, alpha) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(function(c){ return c+c; }).join('');
      var r = parseInt(hex.substring(0,2),16);
      var g = parseInt(hex.substring(2,4),16);
      var b = parseInt(hex.substring(4,6),16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }

    /* Destroy previous chart if any */
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    var canvas  = document.getElementById('radarCanvas');
    var ctx     = canvas.getContext('2d');

    var datasets = [
      {
        label: 'Conformité (%)',
        data: confVals,
        backgroundColor: hexToRgba(radarHex, 0.18),
        borderColor: radarHex,
        borderWidth: 2,
        pointBackgroundColor: confVals.map(function(_, i) {
          return pointColor(parseFloat(rows[i] && rows[i]['metricConformite'] && rows[i]['metricConformite'][0]) || 0);
        }),
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ];

    if (showTarget) {
      datasets.push({
        label: 'Cible (100%)',
        data: labels.map(function() { return 100; }),
        backgroundColor: hexToRgba(targetHex, 0.06),
        borderColor: targetHex,
        borderWidth: 1.5,
        borderDash: [5, 4],
        pointRadius: 0
      });
    }

    chartInstance = new Chart(ctx, {
      type: 'radar',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: maxScale,
            ticks: {
              stepSize: Math.round(maxScale / 5),
              color: '#888',
              font: { size: 10 },
              backdropColor: 'transparent',
              callback: function(v) { return v + '%'; }
            },
            grid: { color: 'rgba(136,135,128,0.2)' },
            angleLines: { color: 'rgba(136,135,128,0.25)' },
            pointLabels: { font: { size: 12 }, color: '#444' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                if (ctx.datasetIndex !== 0) return null;
                var i = ctx.dataIndex;
                var rawConf = parseFloat(rows[i] && rows[i]['metricConformite'] && rows[i]['metricConformite'][0]) || 0;
                return [
                  ' Conformité : ' + rawConf.toFixed(1) + '%',
                  ' Planifié   : ' + (planned[i] || 0) + ' j',
                  ' Réel       : ' + (actual[i]   || 0) + ' j'
                ];
              }
            }
          }
        }
      }
    });
  }

  /* ── Entry point ── */
  function init() {
    injectStyles();
    buildDOM();

    loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
      function() {
        /* Subscribe to Looker Studio data updates */
        dscc.subscribeToData(drawRadar, { transform: dscc.objectTransform });
      }
    );
  }

  /* dscc is injected by Looker Studio runtime — wait for it */
  if (typeof dscc !== 'undefined') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      if (typeof dscc !== 'undefined') {
        init();
      } else {
        /* Fallback: poll until dscc is available */
        var attempts = 0;
        var poll = setInterval(function() {
          attempts++;
          if (typeof dscc !== 'undefined') {
            clearInterval(poll);
            init();
          } else if (attempts > 20) {
            clearInterval(poll);
            document.body.innerHTML = '<p style="color:red;font-family:sans-serif;padding:1rem;">Erreur : dscc non disponible. Ce fichier doit être utilisé dans Looker Studio uniquement.</p>';
          }
        }, 200);
      }
    });
  }

})();
