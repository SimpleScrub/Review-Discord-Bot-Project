import { useState, useDeferredValue, useEffect } from 'react';
import FilterBar from './components/FilterBar';
import ReviewCard from './components/ReviewCard';
import ReviewModal from './components/ReviewModal';
import CreateReviewModal from './components/CreateReviewModal';
import { useReviews, type Review } from './hooks/useReviews';
import { initDiscord, type AuthUser } from './lib/discord';

export default function App() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Review | null>(null);
  const [creating, setCreating] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    initDiscord()
      .then((u) => setUser(u))
      .catch(() => {});
  }, []);

  const deferredSearch = useDeferredValue(search);

  const { data, loading, error, refetch } = useReviews({
    category,
    search: deferredSearch,
    page,
  });

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  function handleCategory(v: string) {
    setCategory(v);
    setPage(1);
  }

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-[#1e1f22] flex flex-col">
      {/* Header */}
      <header className="bg-[#2b2d31] border-b border-[#1e1f22] px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#5865f2] rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0">
          R
        </div>
        <h1 className="text-[#f2f3f5] font-bold text-lg tracking-tight">AnyReview</h1>
        <div className="ml-auto flex items-center gap-3">
          {data && (
            <span className="text-xs text-[#949ba4]">{data.total} review{data.total !== 1 ? 's' : ''}</span>
          )}
          <button
            onClick={() => setCreating(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#5865f2] hover:bg-[#4752c4] text-white transition-colors"
          >
            + Write Review
          </button>
          {user && (
            <img
              src={user.avatar
                ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`
                : `https://cdn.discordapp.com/embed/avatars/0.png`}
              alt={user.username}
              title={user.username}
              className="w-8 h-8 rounded-full"
            />
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-3xl w-full mx-auto flex flex-col gap-5">
        <FilterBar
          search={search}
          category={category}
          onSearch={handleSearch}
          onCategory={handleCategory}
        />

        {loading && (
          <div className="flex-1 flex items-center justify-center text-[#949ba4] text-sm">
            Loading...
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm text-center py-8">Failed to load reviews.</div>
        )}

        {!loading && !error && data?.reviews.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-16 text-[#949ba4]">
            <span className="text-4xl">📭</span>
            <p className="text-sm">No reviews found</p>
          </div>
        )}

        {!loading && data && data.reviews.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.reviews.map((r) => (
              <ReviewCard key={r.id} review={r} onClick={() => setSelected(r)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg text-xs bg-[#2b2d31] text-[#949ba4] disabled:opacity-40 hover:bg-[#35373c] hover:text-[#dbdee1] disabled:hover:bg-[#2b2d31] transition-colors"
            >
              ← Prev
            </button>
            <span className="text-xs text-[#949ba4]">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg text-xs bg-[#2b2d31] text-[#949ba4] disabled:opacity-40 hover:bg-[#35373c] hover:text-[#dbdee1] disabled:hover:bg-[#2b2d31] transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {selected && (
        <ReviewModal review={selected} onClose={() => setSelected(null)} />
      )}

      {creating && (
        <CreateReviewModal
          user={user}
          onClose={() => setCreating(false)}
          onCreated={() => { refetch(); setCreating(false); }}
        />
      )}
    </div>
  );
}
