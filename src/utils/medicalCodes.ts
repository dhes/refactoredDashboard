export function getCodeSystem(code: string): string {
  return /^[A-Za-z]/.test(code)
    ? "http://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets"
    : "http://www.ama-assn.org/go/cpt";
}

export function getCodeDisplay(code: string): string {
  const codeDisplayMap: Record<string, string> = {
    // HCPCS codes
    "G0438": "Annual wellness visit; includes a personalized prevention plan of service (pps), initial visit",
    "G0439": "Annual wellness visit, includes a personalized prevention plan of service (pps), subsequent visit",
    // CPT codes
    "99201": "Office or other outpatient visit for E/M of a new patient, 10 minutes",
    "99202": "Office or other outpatient visit for E/M of a new patient, 20 minutes",
    "99203": "Office or other outpatient visit for E/M of a new patient, 30 minutes",
    "99204": "Office or other outpatient visit for E/M of a new patient, 45 minutes",
    "99205": "Office or other outpatient visit for E/M of a new patient, 60 minutes",
    "99211": "Office or other outpatient visit for E/M of an established patient, 5 minutes",
    "99212": "Office or other outpatient visit for E/M of an established patient, 10 minutes",
    "99213": "Office or other outpatient visit for E/M of an established patient, 15 minutes",
    "99214": "Office or other outpatient visit for E/M of an established patient, 25 minutes",
    "99215": "Office or other outpatient visit for E/M of an established patient, 40 minutes",
    "99384": "Initial comprehensive preventive medicine E/M, 12-17 years",
    "99385": "Initial comprehensive preventive medicine E/M, 18-39 years",
    "99394": "Periodic comprehensive preventive medicine E/M, 12-17 years",
    "99395": "Periodic comprehensive preventive medicine E/M, 18-39 years",
  };
  
  return codeDisplayMap[code] || `${/^[A-Za-z]/.test(code) ? 'HCPCS' : 'CPT'} ${code}`;
}

export function isHCPCSCode(code: string): boolean {
  return /^[A-Za-z]/.test(code);
}

export function isCPTCode(code: string): boolean {
  return /^[0-9]/.test(code);
}