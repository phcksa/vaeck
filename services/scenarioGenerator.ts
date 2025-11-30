import { Diagnosis } from '../types';

export interface DailyData {
  day: number;
  minPeep: number;
  minFio2: number;
  tempMax: number;
  wbc: number;
  antibiotic: string | null;
}

export interface LabResult {
  specimenType: "Endotracheal Aspirate (ETA)" | "Bronchoalveolar Lavage (BAL)" | "Sputum";
  collectionDate: number; // Day number
  cultureResult: string;
  quantification?: string; // e.g., "10^5 CFU/ml"
  gramStain: string; // Purulence criteria
}

export interface Scenario {
  id: string;
  data: DailyData[];
  lab: LabResult;
  diagnosis: Diagnosis;
  reason: string;
}

const NHSN_ANTIBIOTICS = ["Meropenem", "Vancomycin", "Piperacillin/Tazo", "Cefepime", "Levofloxacin"];
const PATHOGENS = ["Pseudomonas aeruginosa", "Acinetobacter baumannii", "Klebsiella pneumoniae", "Staphylococcus aureus (MRSA)"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(1));
}

export function generateScenario(): Scenario {
  const diagnosis: Diagnosis = ["No VAE", "VAC", "IVAC", "PVAP"][randomInt(0, 3)] as Diagnosis;
  const days = Array.from({ length: 10 }, (_, i) => i + 1);
  const basePeep = randomInt(5, 8);
  const baseFio2 = 0.30; // 30%
  
  // 1. Base Data Generation (Stable)
  let data: DailyData[] = days.map(day => ({
    day,
    minPeep: Math.max(5, basePeep + randomInt(-1, 1)), // Noise
    minFio2: Math.max(0.30, parseFloat((baseFio2 + randomFloat(-0.05, 0.05)).toFixed(2))),
    tempMax: randomFloat(36.5, 37.5),
    wbc: randomInt(6000, 10000),
    antibiotic: null
  }));

  let reason = "";
  let vacStartDay = 0;

  // 2. Apply VAE Logic (VAC)
  if (diagnosis !== "No VAE") {
    vacStartDay = randomInt(3, 5); // Event starts around day 4-6 (needs 2 days stability before)
    const trigger = Math.random() > 0.5 ? "PEEP" : "FiO2";
    
    // Create Stability (2 days before)
    data[vacStartDay - 2].minPeep = basePeep; data[vacStartDay - 2].minFio2 = baseFio2;
    data[vacStartDay - 3].minPeep = basePeep; data[vacStartDay - 3].minFio2 = baseFio2;

    // Apply Increase (Sustained for 2 days)
    const peepIncrease = 3; 
    const fio2Increase = 0.20;

    for (let i = vacStartDay - 1; i < 10; i++) {
      if (trigger === "PEEP") data[i].minPeep = basePeep + peepIncrease + randomInt(0, 2);
      else data[i].minFio2 = baseFio2 + fio2Increase + randomFloat(0, 0.1);
    }
    reason = `VAC met: Sustained increase in ${trigger} starting Day ${vacStartDay}.`;
  } else {
    reason = "No sustained deterioration in PEEP or FiO2 meeting VAC criteria.";
  }

  // 3. Apply IVAC Logic (Temp/WBC + Antibiotics)
  if (diagnosis === "IVAC" || diagnosis === "PVAP") {
    const abx = NHSN_ANTIBIOTICS[randomInt(0, NHSN_ANTIBIOTICS.length - 1)];
    const signStart = vacStartDay - 1; // Signs usually around the event
    
    // Add Antibiotic for >= 4 days
    for (let i = signStart; i < Math.min(signStart + 5, 10); i++) {
      data[i].antibiotic = abx;
    }

    // Add Signs (Temp > 38 OR WBC abnormality)
    for (let i = signStart; i < Math.min(signStart + 3, 10); i++) {
        if (Math.random() > 0.5) data[i].tempMax = randomFloat(38.5, 39.5);
        else data[i].wbc = randomInt(13000, 18000);
    }
    reason += " IVAC met: Temp/WBC abnormality + New Antibiotic for >4 days.";
  } else if (diagnosis === "VAC") {
      // VAC ONLY: Maybe add antibiotic for 2 days then stop (trick)
      if (Math.random() > 0.5) {
          data[vacStartDay].antibiotic = "Vancomycin";
          data[vacStartDay+1].antibiotic = "Vancomycin";
          reason += " (Antibiotic started but stopped < 4 days, so NOT IVAC).";
      }
  }

  // 4. Lab Results (The Decider for PVAP)
  const isPVAP = diagnosis === "PVAP";
  const specimen = Math.random() > 0.5 ? "Endotracheal Aspirate (ETA)" : "Bronchoalveolar Lavage (BAL)";
  const bug = PATHOGENS[randomInt(0, PATHOGENS.length - 1)];
  
  let lab: LabResult = {
      specimenType: specimen,
      collectionDate: vacStartDay + 1, // Collected around the event
      cultureResult: "No growth",
      gramStain: "< 10 WBCs/LPF, > 10 Epithelial cells/LPF (Non-purulent)",
      quantification: "N/A"
  };

  if (isPVAP) {
      // Positive Criteria
      lab.cultureResult = `Positive for ${bug}`;
      // Thresholds based on NHSN Table 5
      if (specimen === "Endotracheal Aspirate (ETA)") {
          lab.quantification = `> 10^5 CFU/ml`; // Threshold for ETA
      } else {
          lab.quantification = `> 10^4 CFU/ml`; // Threshold for BAL
      }
      lab.gramStain = "> 25 WBCs/LPF, < 10 Epithelial cells/LPF (Purulent)";
      reason += " PVAP met: Positive quantitative culture meeting threshold.";
  } else if (diagnosis === "IVAC") {
      // Negative Criteria (IVAC only)
      if (Math.random() > 0.5) {
          lab.cultureResult = "No growth";
      } else {
          // Trick: Growth but below threshold
          lab.cultureResult = `Positive for ${bug}`;
          if (specimen === "Endotracheal Aspirate (ETA)") {
              lab.quantification = `< 10^4 CFU/ml`; // Below threshold
              reason += " NOT PVAP: Growth is below threshold (10^5 required for ETA).";
          } else {
              lab.cultureResult = "Normal flora";
              lab.quantification = "Semi-quantitative: Moderate";
              reason += " NOT PVAP: Normal flora is excluded.";
          }
      }
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    data,
    lab,
    diagnosis,
    reason
  };
}