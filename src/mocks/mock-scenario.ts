export const MOCK_SCENARIO_IDS = [
  "lab",
  "biology",
  "deep",
  "many",
  "empty",
  "network-failure",
] as const

export type MockScenarioId = (typeof MOCK_SCENARIO_IDS)[number]

export const MOCK_SCENARIO_OPTIONS: {
  id: MockScenarioId
  label: string
}[] = [
  { id: "lab", label: "Top Hat sample" },
  { id: "biology", label: "Biology" },
  { id: "deep", label: "Deep hierarchy" },
  { id: "many", label: "Large result set" },
  { id: "empty", label: "Empty" },
  { id: "network-failure", label: "Network failure" },
]

const DEFAULT_SCENARIO: MockScenarioId = "lab"

let selectedScenario: MockScenarioId = DEFAULT_SCENARIO

export function getMockScenario(): MockScenarioId {
  return selectedScenario
}

export function setMockScenario(scenario: MockScenarioId): void {
  selectedScenario = scenario
}

export function getMockScenarioLabel(scenario: MockScenarioId): string {
  return (
    MOCK_SCENARIO_OPTIONS.find((option) => option.id === scenario)?.label ??
    scenario
  )
}
