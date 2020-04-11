"use strict";
const $q = document.querySelector.bind(document);
const $qa = document.querySelectorAll.bind(document);

/* covid19ImpactEstimator function */
// Function to normalize months, weeks into days
const normalizeDays = (types) => {
  let days;
  switch (types) {
    case 'months':
      days = 30;
      break;
    case 'weeks':
      days = 7;
      break;
    default:
      days = 1;
      break;
  }
  return days;
};

// Infection estimator
const estimateInfected = (infection, pTypes, period) => {
  let estimatedInfection;
  let factor;
  let day = period;
  if (day === 1 || day === 2) {
    if (pTypes === 'months' || pTypes === 'weeks') {
      day *= normalizeDays(pTypes);
      // console.log(day);
      factor = 2 ** Math.trunc(day / 3);
      estimatedInfection = infection * factor;
    } else {
      estimatedInfection = infection * day;
    }
  } else {
    day *= normalizeDays(pTypes);
    factor = 2 ** Math.trunc(day / 3);
    estimatedInfection = infection * factor;
  }
  return estimatedInfection;
};

// Challenge 2: total number of available bed spaces
const estimateAvailableBeds = (totalHospBeds, severeCasesReqByTime) => {
  const bedAvailable = 0.35 * totalHospBeds;
  const hospBedsByReqTime = bedAvailable - severeCasesReqByTime;
  return Math.trunc(hospBedsByReqTime);
};

//  challenge 3: Loss to economy
const estimateLossToEconomy = (infectedByReqTime, data) => {
  const {
    region: { avgDailyIncomeInUSD: income, avgDailyIncomePopulation: population },
    periodType,
    timeToElapse: time
  } = data;
  const period = normalizeDays(periodType) * time;
  const dollarsInFlight = Math.trunc((infectedByReqTime * income * population) / period);
  return dollarsInFlight;
};


const covid19ImpactEstimator = (data) => {
  const input = data;
  const impact = {};
  const severeImpact = {};
  impact.currentlyInfected = input.reportedCases * 10;
  severeImpact.currentlyInfected = input.reportedCases * 50;

  impact.infectionsByRequestedTime = estimateInfected(impact.currentlyInfected,
    input.periodType, input.timeToElapse);
  severeImpact.infectionsByRequestedTime = estimateInfected(severeImpact.currentlyInfected,
    input.periodType, input.timeToElapse);
  // challenge 2
  impact.severeCasesByRequestedTime = 0.15 * impact.infectionsByRequestedTime;
  severeImpact.severeCasesByRequestedTime = 0.15 * severeImpact.infectionsByRequestedTime;
  // estimate Beds space available
  impact.hospitalBedsByRequestedTime = estimateAvailableBeds(
    input.totalHospitalBeds, impact.severeCasesByRequestedTime
  );
  severeImpact.hospitalBedsByRequestedTime = estimateAvailableBeds(
    input.totalHospitalBeds, severeImpact.severeCasesByRequestedTime
  );

  // challenge 3
  // ICU
  impact.casesForICUByRequestedTime = Math.trunc(
    0.05 * impact.infectionsByRequestedTime
  );
  severeImpact.casesForICUByRequestedTime = Math.trunc(
    0.05 * severeImpact.infectionsByRequestedTime
  );

  // Ventilator
  impact.casesForVentilatorsByRequestedTime = Math.trunc(
    0.02 * impact.infectionsByRequestedTime
  );
  severeImpact.casesForVentilatorsByRequestedTime = Math.trunc(
    0.02 * severeImpact.infectionsByRequestedTime
  );

  // Lose to economy
  impact.dollarsInFlight = estimateLossToEconomy(
    impact.infectionsByRequestedTime, input
  );
  severeImpact.dollarsInFlight = estimateLossToEconomy(
    severeImpact.infectionsByRequestedTime, input
  );

  return {
    input,
    impact,
    severeImpact
  };
};

// export default covid19ImpactEstimator;
/* end of covid19ImpactEstimator function */

// Proccess and validate user inputs;
const goEstimate = $q("[data-go-estimate]");

const showAlert = (className, message) => {
	const div = document.createElement("div");
	div.className = `alert alert-${className}`;
	div.innerHTML = `${message}`;
	document.body.appendChild(div);
	setTimeout(() => div.remove(), 3500);
};

goEstimate.addEventListener("click", (event) => {
	event.preventDefault();

	// input data
	const pType = $q("[data-period-type]");
	const tmToElapse = $q("[data-time-to-elapse]");
	const rCases = $q("[data-reported-cases]");
	const populatn = $q("[data-population]");
	const tHospitalBeds = $q("[data-total-hospital-beds]");

	const periodType = pType.value;
	const timeToElapse = parseInt(tmToElapse.value);
	const reportedCases = parseInt(rCases.value);
	const population = parseInt(populatn.value);
	const totalHospitalBeds = parseInt(tHospitalBeds.value);

	if (
		!periodType ||
		!timeToElapse ||
		!reportedCases ||
		!population ||
		!totalHospitalBeds
	) {
		showAlert("error", "Oops! Please fill all fields.");
	} else {
		goEstimate.disabled = true;

		const input = {
			region: {
				name: "Africa",
				avgAge: 19.7,
				avgDailyIncomeInUSD: 5,
				avgDailyIncomePopulation: 0.71,
			},
			periodType,
			timeToElapse,
			reportedCases,
			population,
			totalHospitalBeds,
		};
		const covid19 = covid19ImpactEstimator(input);
		const impact = covid19.impact;
		const severeImpact = covid19.severeImpact;
		const impactUI = $q("#impact");
		const severeImpactUI = $q("#severeImpact");
		const impactsContainner = $q(".impacts");
		impactUI.innerHTML = `
      <tr>
        <th>Currently Infected</th>
        <td>${impact.currentlyInfected}</td>
      </tr>
      <tr>
        <th>Infections By Requested Time</th>
        <td>${impact.infectionsByRequestedTime}</td>
      </tr>
      <tr>
        <th>Severe Cases By Requested Time</th>
        <td>${impact.severeCasesByRequestedTime}</td>
      </tr>
      <tr>
        <th>Hospital Beds By Requested Time</th>
        <td>${impact.hospitalBedsByRequestedTime}</td>
      </tr>
      <tr>
        <th>Cases For ICU By Requested Time</th>
        <td>${impact.casesForICUByRequestedTime}</td>
      </tr>
      <tr>
        <th>Cases For Ventilators By Requested Time</th>
        <td>${impact.casesForVentilatorsByRequestedTime}</td>
      </tr>
      <tr>
        <th>Dollars In Flight</th>
        <td>${impact.dollarsInFlight}</td>
      </tr>
    `;

		severeImpactUI.innerHTML = `
      <tr>
        <th>Currently Infected</th>
        <td>${severeImpact.currentlyInfected}</td>
      </tr>
      <tr>
        <th>Infections By Requested Time</th>
        <td>${severeImpact.infectionsByRequestedTime}</td>
      </tr>
      <tr>
        <th>Severe Cases By Requested Time</th>
        <td>${severeImpact.severeCasesByRequestedTime}</td>
      </tr>
      <tr>
        <th>Hospital Beds By Requested Time</th>
        <td>${severeImpact.hospitalBedsByRequestedTime}</td>
      </tr>
      <tr>
        <th>Cases For ICU By Requested Time</th>
        <td>${severeImpact.casesForICUByRequestedTime}</td>
      </tr>
      <tr>
        <th>Cases For Ventilators By Requested Time</th>
        <td>${severeImpact.casesForVentilatorsByRequestedTime}</td>
      </tr>
      <tr>
        <th>Dollars In Flight</th>
        <td>${severeImpact.dollarsInFlight}</td>
      </tr>
    `;

		showAlert(
			"success",
			"Data Submitted, scroll down to view impact analysis."
		);
		impactsContainner.classList.remove("is-hidden");
		goEstimate.disabled = false;
		pType.value = "";
		tmToElapse.value = "";
		rCases.value = "";
		populatn.value = "";
		tHospitalBeds.value = "";
	}
});


document.addEventListener('DOMContentLoaded', () => $q('#population').focus());