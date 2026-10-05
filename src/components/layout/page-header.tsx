import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-end justify-between gap-4 pt-6 pb-5 lg:pt-10", className)}>
      <div className="min-w-0">
        <h1 className="text-[20px] font-semibold tracking-tight text-text sm:text-[24px]">{title}</h1>
        {description ? <p className="mt-1 text-[13px] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** Main content column: 720 px wide, 16 px gutters on phones. */
export function PageColumn({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-[720px] px-4 sm:px-6", className)} {...props} />;
}
