/**
 * One section of a record form (design S15): the title and a line about it on
 * the left, the fields on the right. On a narrow screen the title stacks above
 * its fields. Sections are stacked on one page — a record's fields are all
 * visible and reachable by scrolling, never hidden behind tabs (a person's form
 * used to be four tabs, with eight of its twelve fields out of sight).
 * `optionalLabel` marks a section nobody has to fill in.
 */
export function FormSection({
  title,
  description,
  optionalLabel,
  children,
  ...props
}: {
  title: string;
  description?: string;
  optionalLabel?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<'section'>, 'title'>) {
  return (
    <section className="grid gap-x-10 gap-y-4 md:grid-cols-[13rem_minmax(0,1fr)]" {...props}>
      <div>
        <h2 className="text-base leading-[22px]">
          {title}
          {optionalLabel ? (
            <span className="olv-overline ml-2 align-middle text-text-3">{optionalLabel}</span>
          ) : null}
        </h2>
        {description ? (
          <p className="mt-1 text-[13px] leading-[19px] text-text-3">{description}</p>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
