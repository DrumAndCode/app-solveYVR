interface TimelineEvent {
  date: string;
  label: string;
  detail?: string;
  completed: boolean;
}

export function StatusTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="flex flex-col gap-0">
      {events.map((event, i) => (
        <div key={i} className="flex gap-3">
          {/* Dot + line */}
          <div className="flex flex-col items-center">
            <div
              className={`mt-1 h-2.5 w-2.5 rounded-full ${
                event.completed
                  ? "bg-primary"
                  : "border-2 border-muted-foreground/30 bg-background"
              }`}
            />
            {i < events.length - 1 && (
              <div className="w-px flex-1 bg-border" />
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col gap-0.5 pb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium">{event.date}</span>
              <span className="text-xs text-muted-foreground">
                {event.label}
              </span>
            </div>
            {event.detail && (
              <span className="text-xs text-muted-foreground">
                {event.detail}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
