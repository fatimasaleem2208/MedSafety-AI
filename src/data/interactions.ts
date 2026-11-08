export type Severity = "none" | "moderate" | "major";

export type Interaction = {
  a: string;
  b: string;
  severity: Severity;
  description: string;
  clinicalEffect: string;
  recommendation: string;
  monitoring: string;
};

export const INTERACTIONS: Interaction[] = [
  {
    a: "metformin",
    b: "ciprofloxacin",
    severity: "moderate",
    description: "Fluoroquinolones may disturb glucose regulation in people taking antidiabetic medicines.",
    clinicalEffect: "Blood glucose may rise or fall unpredictably, including episodes of hypoglycaemia.",
    recommendation: "Continue both only if the antibiotic is clinically necessary and follow your prescriber's advice.",
    monitoring: "Check blood glucose more frequently during the antibiotic course and for a few days after.",
  },
  {
    a: "warfarin",
    b: "ciprofloxacin",
    severity: "major",
    description: "Ciprofloxacin inhibits warfarin metabolism and alters gut flora that produce vitamin K.",
    clinicalEffect: "INR can rise sharply with a significant risk of bleeding.",
    recommendation: "Prescriber should consider an alternative antibiotic or plan close anticoagulation review.",
    monitoring: "INR within 3–5 days of starting and after stopping; watch for bruising or bleeding.",
  },
  {
    a: "warfarin",
    b: "ibuprofen",
    severity: "major",
    description: "NSAIDs add antiplatelet effects and gastric mucosal injury on top of anticoagulation.",
    clinicalEffect: "Markedly increased risk of gastrointestinal and other bleeding.",
    recommendation: "Avoid the combination where possible; paracetamol is usually preferred for pain.",
    monitoring: "INR, haemoglobin, and symptoms of bleeding such as black stools.",
  },
  {
    a: "warfarin",
    b: "paracetamol",
    severity: "moderate",
    description: "Regular high-dose paracetamol can potentiate the anticoagulant effect of warfarin.",
    clinicalEffect: "Gradual rise in INR with prolonged daily use.",
    recommendation: "Occasional doses are usually fine; tell your anticoagulation clinic about regular use.",
    monitoring: "INR if paracetamol is used at ≥2 g/day for more than a few days.",
  },
  {
    a: "omeprazole",
    b: "amoxicillin",
    severity: "none",
    description: "These are frequently prescribed together as part of H. pylori eradication regimens.",
    clinicalEffect: "No clinically significant negative interaction expected.",
    recommendation: "Take as prescribed.",
    monitoring: "Routine follow-up only.",
  },
  {
    a: "amlodipine",
    b: "atorvastatin",
    severity: "moderate",
    description: "Amlodipine modestly increases atorvastatin exposure via CYP3A4.",
    clinicalEffect: "Slightly higher risk of muscle-related side effects at high statin doses.",
    recommendation: "Usually safe; prescribers may limit the statin dose in some patients.",
    monitoring: "Report unexplained muscle pain, tenderness or weakness.",
  },
  {
    a: "sertraline",
    b: "ibuprofen",
    severity: "moderate",
    description: "SSRIs reduce platelet serotonin, and NSAIDs irritate the gastric mucosa.",
    clinicalEffect: "Increased risk of gastrointestinal bleeding.",
    recommendation: "Prefer paracetamol where suitable, or discuss gastric protection with your prescriber.",
    monitoring: "Watch for indigestion, black stools or unusual bruising.",
  },
  {
    a: "sertraline",
    b: "warfarin",
    severity: "major",
    description: "SSRIs can increase bleeding risk and may raise INR with warfarin.",
    clinicalEffect: "Higher bleeding risk, sometimes with elevated INR.",
    recommendation: "Combination is used when necessary but requires anticoagulation review.",
    monitoring: "More frequent INR checks after starting or changing the dose.",
  },
  {
    a: "ciprofloxacin",
    b: "cetirizine",
    severity: "none",
    description: "No clinically significant interaction is expected between these medicines.",
    clinicalEffect: "None expected at usual doses.",
    recommendation: "No specific action needed.",
    monitoring: "Routine care.",
  },
  {
    a: "salbutamol",
    b: "amlodipine",
    severity: "none",
    description: "No clinically significant pharmacokinetic interaction is expected.",
    clinicalEffect: "Occasional additive palpitations at high salbutamol doses.",
    recommendation: "No routine action needed.",
    monitoring: "Report persistent palpitations.",
  },
  {
    a: "cetirizine",
    b: "sertraline",
    severity: "moderate",
    description: "Additive sedation may occur when a sedating antihistamine is combined with an SSRI.",
    clinicalEffect: "Drowsiness, reduced alertness.",
    recommendation: "Take the antihistamine at night and avoid alcohol.",
    monitoring: "Assess alertness before driving or operating machinery.",
  },
  {
    a: "metformin",
    b: "ibuprofen",
    severity: "moderate",
    description: "NSAIDs can reduce renal function, which affects metformin clearance.",
    clinicalEffect: "Rare risk of metformin accumulation and lactic acidosis, especially with dehydration.",
    recommendation: "Use NSAIDs sparingly and stay well hydrated.",
    monitoring: "Renal function if NSAIDs are used regularly.",
  },
];

export function findInteraction(idA: string, idB: string) {
  return INTERACTIONS.find(
    (i) => (i.a === idA && i.b === idB) || (i.a === idB && i.b === idA),
  );
}

export const severityLabel: Record<Severity, string> = {
  none: "No significant interaction",
  moderate: "Moderate",
  major: "Major",
};
