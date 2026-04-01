type Tag = { id: string; name: string };

type Props = {
  tags: Tag[];
  onRemove: (id: string) => void;
};

export function OptimizeExcludeTags({ tags, onRemove }: Props) {
  return (
    <>
      {tags.map((t) => (
        <span key={t.id} className="opt-exclude-tag">
          {t.name}
          <span
            className="opt-exclude-x"
            data-id={t.id}
            onClick={() => onRemove(t.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onRemove(t.id);
              }
            }}
            role="button"
            tabIndex={0}
          >
            ×
          </span>
        </span>
      ))}
    </>
  );
}
