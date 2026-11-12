import { MorningBriefWorkspace } from "@/components/morning-brief/morning-brief-workspace";
import { loadTaskSnapshot, loadWeatherSnapshot } from "@/data/morning-brief";

export const metadata = { title: "Morning Brief" };

export default async function MorningBriefPage() {
  const renderedAt = new Date().toISOString();
  const [tasks, weather] = await Promise.all([loadTaskSnapshot(), loadWeatherSnapshot()]);
  return <MorningBriefWorkspace renderedAt={renderedAt} tasks={tasks} weather={weather}/>;
}
