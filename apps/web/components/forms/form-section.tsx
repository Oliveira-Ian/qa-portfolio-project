/**
 * One section of a record form (design S15): the title and a line about it on
 * the left, the fields on the right. On a narrow screen the title stacks above
 * its fields. A form with several sections puts each on its own tab; a short one
 * (an access profile) just stacks them.
 */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-x-10 gap-y-4 md:grid-cols-[13rem_minmax(0,1fr)]">
      <div>
        <h2 className="text-base leading-[22px]">{title}</h2>
        {description ? (
          <p className="mt-1 text-[13px] leading-[19px] text-text-3">{description}</p>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
