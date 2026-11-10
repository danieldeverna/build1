import { PageHeader } from "@/components/page-header";
import { WorkBoard } from "@/components/work/work-board";
import { listTasksForCurrentViewer } from "@/data/tasks";

export const metadata = { title: "Work" };

export default async function Page() {
  const tasks = await listTasksForCurrentViewer();
  return <><PageHeader eyebrow="Work hub" title="Everything in motion." description="Academic work, recruiting, and personal projects—organized without forcing every task onto a calendar."/><WorkBoard initialTasks={tasks}/></>;
}
