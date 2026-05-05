import type { Review } from '../hooks/useReviews';

const CATEGORY_COLORS: Record<string, string> = {
  Movies: 'bg-red-500',
  Music: 'bg-purple-500',
  Food: 'bg-orange-500',
  Experience: 'bg-green-500',
  Game: 'bg-blue-500',
  Book: 'bg-yellow-500',
  Other: 'bg-gray-500',
};

type Props = { review: Review; onClick: () => void };

export default function ReviewCard({ review, onClick }: Props) {
  const dot = CATEGORY_COLORS[review.category] ?? 'bg-gray-500';

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#2b2d31] hover:bg-[#35373c] rounded-xl overflow-hidden transition-colors duration-150 flex flex-col"
    >
      {review.imageUrl ? (
        <img
          src={review.imageUrl}
          alt={review.subject}
          className="w-full h-40 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="w-full h-40 bg-[#1e1f22] flex items-center justify-center text-4xl text-[#4e5058]">
          {review.category === 'Movies' ? '🎬' : review.category === 'Music' ? '🎵' :
           review.category === 'Food' ? '🍕' : review.category === 'Game' ? '🎮' :
           review.category === 'Book' ? '📚' : review.category === 'Experience' ? '✨' : '📝'}
        </div>
      )}

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
          <span className="text-xs text-[#949ba4] uppercase tracking-wide font-medium">{review.category}</span>
        </div>
        <p className="font-semibold text-[#dbdee1] text-sm leading-tight line-clamp-2">{review.subject}</p>
        <p className="text-[#5865f2] font-bold text-sm">{review.rating}</p>
        {review.comments && (
          <p className="text-xs text-[#949ba4] line-clamp-2 leading-relaxed">{review.comments}</p>
        )}
      </div>
    </button>
  );
}
