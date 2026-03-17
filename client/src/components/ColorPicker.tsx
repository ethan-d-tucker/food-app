export const COLORS = ['#E07A5F', '#81B29A', '#F2CC8F', '#A8B5C8', '#C89EB8', '#7FBCD2'];

export default function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-3 justify-center">
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className="w-10 h-10 rounded-full btn-press transition-transform"
          style={{
            backgroundColor: c,
            boxShadow: value === c ? `0 0 0 3px ${c}40, 0 0 0 5px ${c}` : 'none',
          }}
        />
      ))}
    </div>
  );
}
