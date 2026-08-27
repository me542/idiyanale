"use client";

export type MinorTaskItem = {
  id: string;
  label: string;
  done?: boolean;
};

export function MinorTask({ tasks = [] }: { tasks?: MinorTaskItem[] }) {
  return (
    <div className="min-h-[300px] w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-700">Minor Task</h3>

      <div className="mt-6">
        {tasks.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <p className="text-sm font-medium text-slate-300">
              No minor tasks yet
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-2 text-sm text-slate-600"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    task.done ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
                <span className={task.done ? "text-slate-400 line-through" : ""}>
                  {task.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}