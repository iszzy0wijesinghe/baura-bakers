type Props = {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
};

export default function Section({ title, eyebrow, children }: Props) {
  return (
    <section className="space-y-4">
      {(eyebrow || title) && (
        <header className="space-y-2">
          {eyebrow && (
            <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {title}
            </h2>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
