import { useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getMockScenario,
  getMockScenarioLabel,
  MOCK_SCENARIO_OPTIONS,
  setMockScenario,
  type MockScenarioId,
} from "@/mocks/mock-scenario"

export function MockScenarioPicker() {
  const [scenario, setScenario] = useState<MockScenarioId>(() => getMockScenario())

  function handleScenarioChange(value: MockScenarioId | null) {
    if (!value) return

    setScenario(value)
    setMockScenario(value)
  }

  return (
    <div
      className="fixed right-6 top-5 z-50 flex items-center gap-2 text-xs"
      data-testid="mock-scenario-picker"
    >
      <span className="font-medium uppercase tracking-wider text-muted-foreground/60">
        Mock
      </span>

      <Select value={scenario} onValueChange={handleScenarioChange}>
        <SelectTrigger
          size="sm"
          className="h-auto min-h-0 border-0 bg-transparent px-0 py-0 text-xs text-muted-foreground shadow-none hover:bg-transparent focus-visible:ring-0"
        >
          <SelectValue>{getMockScenarioLabel(scenario)}</SelectValue>
        </SelectTrigger>
        <SelectContent align="end" alignItemWithTrigger={false} className="min-w-40">
          {MOCK_SCENARIO_OPTIONS.map((option) => (
            <SelectItem key={option.id} value={option.id} className="text-xs">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
