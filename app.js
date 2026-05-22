const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3000';

const form = document.querySelector('#tariff-form');
const statusBox = document.querySelector('#status');
const resultBox = document.querySelector('#result');
const submitButton = document.querySelector('#submit-button');
const jsonOutput = document.querySelector('#json-output');
const queryModeFields = document.querySelectorAll('input[name="queryMode"]');
const calculationValue = document.querySelector('#calculationValue');
const calculationValueLabel = document.querySelector('#calculationValueLabel');

const queryModeConfig = {
  yearlyConsumptionKwh: {
    label: 'Consumo anual kWh',
    defaultValue: '12000',
  },
  annualCost: {
    label: 'Costo anual',
    defaultValue: '130000',
  },
};

const valueFields = {
  kWh: document.querySelector('#kwh'),
  totalCost: document.querySelector('#totalCost'),
  utilityRate: document.querySelector('#utilityRate'),
};

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 4,
});

function getSelectedQueryMode() {
  return document.querySelector('input[name="queryMode"]:checked').value;
}

function updateCalculationInput() {
  const selectedMode = getSelectedQueryMode();
  const config = queryModeConfig[selectedMode];

  calculationValueLabel.textContent = config.label;
  calculationValue.value = config.defaultValue;
}

function buildUrl(masterTariffId, queryMode, queryValue) {
  const url = new URL('/api/tariff', API_BASE_URL);
  url.searchParams.set('masterTariffId', masterTariffId);
  url.searchParams.set(queryMode, queryValue);
  return url;
}

function setStatus(message, type = 'info') {
  statusBox.className = `alert alert-${type}`;
  statusBox.textContent = message;
}

function renderResult(data) {
  valueFields.kWh.textContent = numberFormatter.format(data.kWh);
  valueFields.totalCost.textContent = currencyFormatter.format(data.totalCost);
  valueFields.utilityRate.textContent = numberFormatter.format(data.utilityRate);
  jsonOutput.textContent = JSON.stringify(data, null, 2);
  resultBox.classList.remove('d-none');
}

async function fetchTariff(masterTariffId, queryMode, queryValue) {
  const url = buildUrl(masterTariffId, queryMode, queryValue);

  resultBox.classList.add('d-none');
  submitButton.disabled = true;
  setStatus(`Consultando: ${url.toString()}`, 'info');
  jsonOutput.textContent = '{}';

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || `HTTP ${response.status}`);
    }

    renderResult(data);
    setStatus('Consulta completada correctamente.', 'success');
  } catch (error) {
    setStatus(`No se pudo consultar el backend Node.js. ${error.message}`, 'danger');
    jsonOutput.textContent = JSON.stringify({
      error: error.message,
      apiBaseUrl: API_BASE_URL,
    }, null, 2);
  } finally {
    submitButton.disabled = false;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  fetchTariff(
    formData.get('masterTariffId').trim(),
    formData.get('queryMode'),
    formData.get('calculationValue')
  );
});

queryModeFields.forEach((field) => {
  field.addEventListener('change', updateCalculationInput);
});

fetchTariff('20000000000000', 'yearlyConsumptionKwh', '12000');
