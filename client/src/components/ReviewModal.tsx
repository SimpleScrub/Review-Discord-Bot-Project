import type { Review } from '../hooks/useReviews';

const CATEGORY_COLORS: Record<string, string> = {
  Movies: '#e74c3c', Music: '#9b59b6', Food: '#e67e22',
  Experience: '#2ecc71', Game: '#3498db', Book: '#f1c40f', Other: '#95a5a6',
};

type Props = { review: Review; onClose: () => void };

export default function ReviewModal({ review, onClose }: Props) {
  const accent = CATEGORY_COLORS[review.category] ?? '#95a5a6';
  const date = new Date(review.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-[#2b2d31] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ borderTop: `4px solid ${accent}` }}
      >
        {review.imageUrl && (
          <img src={review.imageUrl} alt={review.subject} className="w-full max-h-64 object-cover" />
        )}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold text-[#f2f3f5] leading-tight">{review.subject}</h2>
            <button
              onClick={onClose}
              className="text-[#949ba4] hover:text-[#dbdee1] text-xl leading-none shrink-0 mt-0.5 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ background: accent }}>
              {review.category}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#5865f2] text-white">
              {review.rating}
            </span>
          </div>

          {review.comments && (
            <p className="text-sm text-[#dbdee1] leading-relaxed bg-[#1e1f22] rounded-lg p-3">
              {review.comments}
            </p>
          )}

          <p className="text-xs text-[#949ba4]">Review #{review.id} · {date}</p>
        </div>
      </div>
    </div>
  );
}
