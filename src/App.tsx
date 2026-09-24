import { lazy, Suspense } from "react"

import { CourseSearch } from "@/components/course-search"

const useMockApi = import.meta.env.VITE_USE_MOCK_API === "true"

const MockScenarioPicker = useMockApi
  ? lazy(async () => {
      const module = await import("@/mocks/mock-scenario-picker")
      return { default: module.MockScenarioPicker }
    })
  : null

function App() {
  return (
    <main>
      {MockScenarioPicker ? (
        <Suspense fallback={null}>
          <MockScenarioPicker />
        </Suspense>
      ) : null}
      <CourseSearch />
    </main>
  )
}

export default App
