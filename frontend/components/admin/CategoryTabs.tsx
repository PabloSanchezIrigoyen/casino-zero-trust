"use client";

type Tab = {
  id: string;
  label: string;
};

export function CategoryTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--card)] p-1.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`shrink-0 rounded-xl px-3 py-2 text-sm ${
            value === tab.id ? "bg-[var(--gold)] font-semibold text-black" : "text-[var(--muted)] hover:bg-white/5"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
