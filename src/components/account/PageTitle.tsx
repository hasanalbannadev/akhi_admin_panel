export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-xl font-bold md:text-2xl">{title}</h1>
      {sub && <p className="text-sm text-muted">{sub}</p>}
    </div>
  );
}
