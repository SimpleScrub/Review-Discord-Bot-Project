const CATEGORIES = ['', 'Movies', 'Music', 'Food', 'Experience', 'Game', 'Book', 'Other'];

type Props = {
  search: string;
  category: string;
  onSearch: (v: string) => void;
  onCategory: (v: string) => void;
};

export default function FilterBar({ search, category, onSearch, onCategory }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Search reviews..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="w-full bg-[#1e1f22] text-[#dbdee1] placeholder-[#4e5058] border border-[#3f4147] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#5865f2] transition-colors"
      />
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c || 'all'}
            onClick={() => onCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              category === c
                ? 'bg-[#5865f2] text-white'
                : 'bg-[#2b2d31] text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
            }`}
          >
            {c || 'All'}
          </button>
        ))}
      </div>
    </div>
  );
}
