/** Trusted static HTML from build-time assets (legacy DOM compatibility). */
export function RawHtml({
  html,
  className,
  id,
}: {
  html: string;
  className?: string;
  id?: string;
}) {
  return (
    <div
      className={className}
      id={id}
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
