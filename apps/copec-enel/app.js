const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3000';
const ANALYZE_PATH = '/cl/enel/analyze-bill-and-solar-from-pdf';
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const form = document.querySelector('#tariff-form');
const statusBox = document.querySelector('#status');
const resultBox = document.querySelector('#result');
const chartsSection = document.querySelector('#charts-section');
const submitButton = document.querySelector('#submit-button');
const jsonOutput = document.querySelector('#json-output');
const modeInputs = Array.from(document.querySelectorAll('input[name="inputMode"]'));
const pdfPanel = document.querySelector('#pdf-panel');
const manualPanel = document.querySelector('#manual-panel');
const pdfFileInput = document.querySelector('#pdfFile');
const annualSolarProductionInput = document.querySelector('#annualSolarProductionKwh');
const solarSystemAnnualDegradationInput = document.querySelector('#solarSystemAnnualDegradation');
const termYearsInput = document.querySelector('#termYears');
const annualUtilityRateEscalatorInput = document.querySelector('#annualUtilityRateEscalator');
const tarifaInyeccionInput = document.querySelector('#tarifaInyeccion');
const annualInjectionTariffEscalatorInput = document.querySelector('#annualInjectionTariffEscalator');
const manualComunaInput = document.querySelector('#manualComuna');
const manualEtrInput = document.querySelector('#manualEtr');
const manualPeriodStartInput = document.querySelector('#manualPeriodStart');
const manualPeriodEndInput = document.querySelector('#manualPeriodEnd');
const manualTariffTypeInput = document.querySelector('#manualTariffType');
const manualMonthInputs = Array.from(document.querySelectorAll('[data-month-index]'))
  .sort((a, b) => Number(a.dataset.monthIndex) - Number(b.dataset.monthIndex));
const costChartCanvas = document.querySelector('#cost-chart');
const consumptionChartCanvas = document.querySelector('#consumption-chart');
const fullTermCostChartCanvas = document.querySelector('#full-term-cost-chart');
const fullTermEnergyChartCanvas = document.querySelector('#full-term-energy-chart');
const utilityRateChartCanvas = document.querySelector('#utility-rate-chart');

const valueFields = {
  masterTariffId: document.querySelector('#masterTariffId'),
  totalPeriodCost: document.querySelector('#totalPeriodCost'),
  annualSolarProduction: document.querySelector('#annualSolarProduction'),
  annualConsumptionTotal: document.querySelector('#annualConsumptionTotal'),
  estimatedFullTermTotalSavings: document.querySelector('#estimatedFullTermTotalSavings'),
  estimatedFullTermTotalNemCredit: document.querySelector('#estimatedFullTermTotalNemCredit'),
  utilityRateSchedule: document.querySelector('#utilityRateSchedule'),
};

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 4,
});

let costChart;
let consumptionChart;
let fullTermCostChart;
let fullTermEnergyChart;
let utilityRateChart;

function setStatus(message, type = 'info') {
  statusBox.className = `alert alert-${type}`;
  statusBox.textContent = message;
}

function buildAnalyzeUrl() {
  return new URL(ANALYZE_PATH, API_BASE_URL);
}

function getSelectedInputMode() {
  return modeInputs.find((input) => input.checked)?.value || 'pdf';
}

function updateModeUi() {
  const isPdfMode = getSelectedInputMode() === 'pdf';
  pdfPanel.classList.toggle('d-none', !isPdfMode);
  manualPanel.classList.toggle('d-none', isPdfMode);
  submitButton.textContent = isPdfMode
    ? 'Simular análisis de ahorros con boleta ENEL'
    : 'Simular análisis de ahorros con payload manual ENEL';
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo PDF.'));
    reader.readAsDataURL(file);
  });
}

function renderResult(data, annualSolarProductionKwh) {
  if (valueFields.masterTariffId) {
    valueFields.masterTariffId.textContent = data.masterTariffId ?? '--';
  }
  if (valueFields.totalPeriodCost) {
    valueFields.totalPeriodCost.textContent = currencyFormatter.format(data.costo_total_periodo_kwh ?? 0);
  }
  valueFields.annualSolarProduction.textContent = `${numberFormatter.format(annualSolarProductionKwh)} kWh`;
  valueFields.annualConsumptionTotal.textContent = `${numberFormatter.format(data.consumo_total_anual_kwh ?? 0)} kWh`;
  valueFields.estimatedFullTermTotalSavings.textContent = formatClpSummary(data.estimatedFullTermTotalSavings ?? 0);
  valueFields.estimatedFullTermTotalNemCredit.textContent = formatClpSummary(data.estimatedFullTermTotalNemCredit ?? 0);
  valueFields.utilityRateSchedule.textContent = data.utilityRateSchedule ?? '--';
  jsonOutput.textContent = JSON.stringify(data, null, 2);
  resultBox.classList.remove('d-none');
  renderCharts(data);
}

function monthLabels(length) {
  return Array.from({ length }, (_, index) => MONTH_NAMES[index] || `Mes ${index + 1}`);
}

function destroyCharts() {
  if (costChart) {
    costChart.destroy();
    costChart = null;
  }

  if (consumptionChart) {
    consumptionChart.destroy();
    consumptionChart = null;
  }

  if (fullTermCostChart) {
    fullTermCostChart.destroy();
    fullTermCostChart = null;
  }

  if (fullTermEnergyChart) {
    fullTermEnergyChart.destroy();
    fullTermEnergyChart = null;
  }

  if (utilityRateChart) {
    utilityRateChart.destroy();
    utilityRateChart = null;
  }
}

function formatCurrencyTooltip(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function formatNumberTooltip(value, suffix) {
  return `${numberFormatter.format(Number(value) || 0)} ${suffix}`;
}

function formatClpSummary(value) {
  const formatted = currencyFormatter.format(Number(value) || 0);
  return formatted.startsWith('$') ? `CLP${formatted}` : `CLP ${formatted}`;
}

function termLabels(length) {
  return Array.from({ length }, (_, index) => `Año ${index + 1}`);
}

function renderCharts(data) {
  const costSeries = data.costo_ultimos_12_meses || [];
  const costWithSolarSeries = data.costo_con_solar_ultimos_12_meses || [];
  const savingsSeries = data.ahorros_con_solar_ultimos_12_meses || [];
  const consumptionSeries = data.consumo_ultimos_12_meses || [];
  const consumptionWithSolarSeries = data.consumo_con_solar_ultimos_12_meses || [];
  const solarProductionSeries = data.produccion_solar_12_meses || Array(consumptionSeries.length).fill(0);
  const gridExportMonthlySeries = data.gridExportMonthly || Array(consumptionSeries.length).fill(0);
  const fullTermSolarProductionSeries = data.estimatedFullTermSolarAnnualProduction || [];
  const fullTermConsumptionWithoutSolarSeries = data.estimatedFullTermConsumptionWithoutSolar || [];
  const fullTermConsumptionWithSolarSeries = data.estimatedFullTermConsumptionWithSolar || [];
  const fullTermGridExportAnnualSeries = data.estimatedFullTermGridExportAnnual || [];
  const fullTermUtilityRateSeries = data.estimatedFullTermUtilityRate || [];
  const fullTermSavingsSeries = data.estimatedFullTermSavings || [];
  const fullTermNemCreditAnnualSeries = data.estimatedFullTermNemCreditAnnual || [];
  const utilityRateSeries = data.utility_rate || [];
  const utilityRatePostSolarSeries = data.utility_rate_post_solar || [];

  if (!costSeries.length || !consumptionSeries.length) {
    chartsSection.classList.add('d-none');
    destroyCharts();
    return;
  }

  destroyCharts();

  const labels = monthLabels(costSeries.length);

  costChart = new Chart(costChartCanvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Ahorros con solar',
          data: savingsSeries,
          backgroundColor: 'rgba(25, 135, 84, 0.75)',
          borderColor: 'rgba(25, 135, 84, 1)',
          borderWidth: 1,
        },
        {
          label: 'Costo con solar',
          data: costWithSolarSeries,
          backgroundColor: 'rgba(255, 193, 7, 0.75)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 1,
        },
        {
          label: 'Costo sin solar',
          data: costSeries,
          backgroundColor: 'rgba(13, 110, 253, 0.75)',
          borderColor: 'rgba(13, 110, 253, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${formatCurrencyTooltip(context.raw)}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback(value) {
              return currencyFormatter.format(value);
            },
          },
        },
      },
    },
  });

  consumptionChart = new Chart(consumptionChartCanvas, {
    type: 'bar',
    data: {
      labels: monthLabels(consumptionSeries.length),
      datasets: [
        {
          label: 'Producción solar',
          data: solarProductionSeries,
          backgroundColor: 'rgba(255, 193, 7, 0.75)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 1,
        },
        {
          label: 'Consumo con solar',
          data: consumptionWithSolarSeries,
          backgroundColor: 'rgba(111, 66, 193, 0.75)',
          borderColor: 'rgba(111, 66, 193, 1)',
          borderWidth: 1,
        },
        {
          label: 'Exportación a red',
          data: gridExportMonthlySeries,
          backgroundColor: 'rgba(220, 53, 69, 0.75)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 1,
        },
        {
          label: 'Consumo sin solar',
          data: consumptionSeries,
          backgroundColor: 'rgba(32, 201, 151, 0.75)',
          borderColor: 'rgba(32, 201, 151, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${formatNumberTooltip(context.raw, 'kWh')}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback(value) {
              return formatNumberTooltip(value, 'kWh');
            },
          },
        },
      },
    },
  });

  fullTermCostChart = new Chart(fullTermCostChartCanvas, {
    data: {
      labels: termLabels(fullTermSavingsSeries.length),
      datasets: [
        {
          type: 'bar',
          label: 'Ahorro estimado anual',
          data: fullTermSavingsSeries,
          backgroundColor: 'rgba(25, 135, 84, 0.75)',
          borderColor: 'rgba(25, 135, 84, 1)',
          borderWidth: 1,
          yAxisID: 'ySavings',
        },
        {
          type: 'line',
          label: 'Utility rate estimado',
          data: fullTermUtilityRateSeries,
          borderColor: 'rgba(13, 110, 253, 1)',
          backgroundColor: 'rgba(13, 110, 253, 0.15)',
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 5,
          yAxisID: 'yRate',
        },
        {
          type: 'bar',
          label: 'Crédito NEM estimado anual',
          data: fullTermNemCreditAnnualSeries,
          backgroundColor: 'rgba(255, 193, 7, 0.75)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 1,
          yAxisID: 'ySavings',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label(context) {
              if (context.dataset.yAxisID === 'yRate') {
                return `${context.dataset.label}: ${numberFormatter.format(Number(context.raw) || 0)}`;
              }
              return `${context.dataset.label}: ${formatCurrencyTooltip(context.raw)}`;
            },
          },
        },
      },
      scales: {
        ySavings: {
          type: 'linear',
          position: 'left',
          ticks: {
            callback(value) {
              return currencyFormatter.format(value);
            },
          },
        },
        yRate: {
          type: 'linear',
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            callback(value) {
              return numberFormatter.format(value);
            },
          },
        },
      },
    },
  });

  fullTermEnergyChart = new Chart(fullTermEnergyChartCanvas, {
    data: {
      labels: termLabels(fullTermSolarProductionSeries.length),
      datasets: [
        {
          type: 'bar',
          label: 'Producción solar estimada anual',
          data: fullTermSolarProductionSeries,
          backgroundColor: 'rgba(255, 193, 7, 0.75)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 1,
        },
        {
          type: 'line',
          label: 'Consumo estimado anual sin solar',
          data: fullTermConsumptionWithoutSolarSeries,
          borderColor: 'rgba(13, 110, 253, 1)',
          backgroundColor: 'rgba(13, 110, 253, 0.15)',
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          type: 'line',
          label: 'Consumo estimado anual con solar',
          data: fullTermConsumptionWithSolarSeries,
          borderColor: 'rgba(111, 66, 193, 1)',
          backgroundColor: 'rgba(111, 66, 193, 0.15)',
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          type: 'line',
          label: 'Exportación anual estimada a red',
          data: fullTermGridExportAnnualSeries,
          borderColor: 'rgba(220, 53, 69, 1)',
          backgroundColor: 'rgba(220, 53, 69, 0.15)',
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${formatNumberTooltip(context.raw, 'kWh')}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback(value) {
              return formatNumberTooltip(value, 'kWh');
            },
          },
        },
      },
    },
  });

  utilityRateChart = new Chart(utilityRateChartCanvas, {
    type: 'line',
    data: {
      labels: monthLabels(utilityRateSeries.length),
      datasets: [
        {
          label: 'Utility rate sin solar',
          data: utilityRateSeries,
          borderColor: 'rgba(13, 110, 253, 1)',
          backgroundColor: 'rgba(13, 110, 253, 0.15)',
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Utility rate con solar',
          data: utilityRatePostSolarSeries,
          borderColor: 'rgba(25, 135, 84, 1)',
          backgroundColor: 'rgba(25, 135, 84, 0.15)',
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${numberFormatter.format(Number(context.raw) || 0)}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback(value) {
              return numberFormatter.format(value);
            },
          },
        },
      },
    },
  });

  chartsSection.classList.remove('d-none');
}

function buildCommonAnalyzePayload({
  annualSolarProductionKwh,
  tarifaInyeccion,
  annualInjectionTariffEscalator,
  solarSystemAnnualDegradation,
  termYears,
  annualUtilityRateEscalator,
}) {
  return {
    annualSolarProductionKwh: Number(annualSolarProductionKwh),
    tarifa_inyeccion: Number(tarifaInyeccion),
    annualInjectionTariffEscalator: Number(annualInjectionTariffEscalator),
    SOLAR_SYSTEM_ANNUAL_DEGRADATION: Number(solarSystemAnnualDegradation),
    termYears: Number(termYears),
    annualUtilityRateEscalator: Number(annualUtilityRateEscalator),
  };
}

function parseManualDateParts(dateValue) {
  const normalized = String(dateValue || '').trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (isoMatch) {
    return {
      year: isoMatch[1],
      month: isoMatch[2],
      day: isoMatch[3],
    };
  }

  const clMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalized);
  if (clMatch) {
    return {
      year: clMatch[3],
      month: clMatch[2],
      day: clMatch[1],
    };
  }

  throw new Error('Selecciona una fecha válida para el periodo de lectura.');
}

function formatManualDateForApi(dateValue) {
  const { day, month, year } = parseManualDateParts(dateValue);
  return `${day}/${month}/${year}`;
}

function extractMonthFromDateValue(dateValue) {
  const { month } = parseManualDateParts(dateValue);
  return Number(month);
}

function calendarSeriesToPeriodSeries(calendarValues, periodStartValue) {
  const anchorMonth = extractMonthFromDateValue(periodStartValue);
  return [
    ...calendarValues.slice(anchorMonth),
    ...calendarValues.slice(0, anchorMonth),
  ];
}

function buildManualAnalyzePayload(commonPayload) {
  const comuna = manualComunaInput.value.trim();
  const etr = manualEtrInput.value.trim();
  const periodoLecturaInicio = manualPeriodStartInput.value.trim();
  const periodoLecturaFin = manualPeriodEndInput.value.trim();
  const tipoTarifa = manualTariffTypeInput.value.trim();

  if (!comuna) {
    throw new Error('Selecciona una comuna para el payload manual.');
  }

  if (!etr) {
    throw new Error('Selecciona un ETR para el payload manual.');
  }

  if (!periodoLecturaInicio) {
    throw new Error('Selecciona periodo_lectura_inicio para el payload manual.');
  }

  if (!periodoLecturaFin) {
    throw new Error('Selecciona periodo_lectura_fin para el payload manual.');
  }

  const calendarConsumptions = manualMonthInputs.map((input, index) => {
    const value = input.value.trim();
    if (!value) {
      throw new Error(`Ingresa el consumo de ${MONTH_NAMES[index]} antes de enviar.`);
    }
    return Number(value);
  });

  return {
    ...commonPayload,
    comuna,
    etr,
    periodo_lectura_inicio: formatManualDateForApi(periodoLecturaInicio),
    periodo_lectura_fin: formatManualDateForApi(periodoLecturaFin),
    tipo_tarifa: tipoTarifa,
    consumo_ultimos_12_meses: calendarSeriesToPeriodSeries(
      calendarConsumptions,
      periodoLecturaInicio,
    ),
  };
}

async function buildPdfAnalyzePayload(file, commonPayload) {
  const pdfBase64 = await fileToBase64(file);
  return {
    ...commonPayload,
    filename: file.name,
    pdfBase64,
  };
}

async function submitAnalyzeRequest(payload, annualSolarProductionKwh) {
  const url = buildAnalyzeUrl();

  resultBox.classList.add('d-none');
  chartsSection.classList.add('d-none');
  submitButton.disabled = true;
  setStatus(`Enviando boleta a: ${url.toString()}`, 'info');
  // setStatus(`Enviando parametros`, 'info');
  jsonOutput.textContent = '{}';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || `HTTP ${response.status}`);
    }

    renderResult(data, annualSolarProductionKwh);
    setStatus('Analisis completado correctamente.', 'success');
  } catch (error) {
    setStatus(`No se pudo analizar la boleta ENEL. ${error.message}`, 'danger');
    jsonOutput.textContent = JSON.stringify({
      error: error.message,
      apiBaseUrl: API_BASE_URL,
      endpoint: ANALYZE_PATH,
    }, null, 2);
  } finally {
    submitButton.disabled = false;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const mode = getSelectedInputMode();
  const file = pdfFileInput.files?.[0];
  const annualSolarProductionKwh = annualSolarProductionInput.value.trim();
  const tarifaInyeccion = tarifaInyeccionInput.value.trim();
  const annualInjectionTariffEscalator = annualInjectionTariffEscalatorInput.value.trim();
  const solarSystemAnnualDegradation = solarSystemAnnualDegradationInput.value.trim();
  const termYears = termYearsInput.value.trim();
  const annualUtilityRateEscalator = annualUtilityRateEscalatorInput.value.trim();

  if (!annualSolarProductionKwh) {
    setStatus('Ingresa annualSolarProductionKwh antes de enviar.', 'warning');
    return;
  }

  if (!solarSystemAnnualDegradation) {
    setStatus('Ingresa SOLAR_SYSTEM_ANNUAL_DEGRADATION antes de enviar.', 'warning');
    return;
  }

  if (!tarifaInyeccion) {
    setStatus('Ingresa tarifa_inyeccion antes de enviar.', 'warning');
    return;
  }

  if (!annualInjectionTariffEscalator) {
    setStatus('Ingresa annualInjectionTariffEscalator antes de enviar.', 'warning');
    return;
  }

  if (!termYears) {
    setStatus('Ingresa termYears antes de enviar.', 'warning');
    return;
  }

  if (!annualUtilityRateEscalator) {
    setStatus('Ingresa annualUtilityRateEscalator antes de enviar.', 'warning');
    return;
  }

  const commonPayload = buildCommonAnalyzePayload({
    annualSolarProductionKwh,
    tarifaInyeccion,
    annualInjectionTariffEscalator,
    solarSystemAnnualDegradation,
    termYears,
    annualUtilityRateEscalator,
  });

  try {
    let payload;

    if (mode === 'pdf') {
      if (!file) {
        setStatus('Selecciona un archivo PDF antes de enviar.', 'warning');
        return;
      }
      payload = await buildPdfAnalyzePayload(file, commonPayload);
    } else {
      payload = buildManualAnalyzePayload(commonPayload);
    }

    await submitAnalyzeRequest(payload, annualSolarProductionKwh);
  } catch (error) {
    setStatus(`No se pudo preparar el request ENEL. ${error.message}`, 'danger');
  }
});

modeInputs.forEach((input) => {
  input.addEventListener('change', updateModeUi);
});

updateModeUi();
