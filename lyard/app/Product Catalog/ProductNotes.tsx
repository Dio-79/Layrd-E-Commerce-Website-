import Icon, { type IconName } from "@/app/components/Icon";

export type ProductNote = { icon: IconName; text: string };

export default function ProductNotes({ items, className = "" }: { items: ProductNote[]; className?: string }) {
  return (
    <ul className={`grid gap-6 border-t-2 border-line-strong pt-4 ${className}`}>
      {items.map((note) => (
        <li key={note.text} className="flex items-start gap-4 text-note text-muted">
          <Icon name={note.icon} size={20} className="shrink-0 text-foreground" />
          <span>{note.text}</span>
        </li>
      ))}
    </ul>
  );
}
