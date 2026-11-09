import { FitnessWorkspace } from "@/components/fitness/fitness-workspace";
import { PageHeader } from "@/components/page-header";
import { getMockFitnessPlan } from "@/lib/mock-data";

export const metadata = { title: "Fitness" };

export default function Page() {
  return <><PageHeader eyebrow="Personal training" title="Fitness planner" description="Three protected lifts, intelligently fitted around your week."/><FitnessWorkspace initialPlan={getMockFitnessPlan()}/></>;
}
