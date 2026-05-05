import { useState } from 'react';
import type { AuthUser } from '../lib/discord';

const CATEGORIES = ['Movies', 'Music', 'Food', 'Experience', 'Game', 'Book', 'Other'];

type Props = {
  user: AuthUser | null;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateReviewModal({ user, onClose, onCreated }: Props) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Movies');
  const [rating, setRating] = useState('');
  const [comments, setComments] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          category,
          rating,
          comments: comments || undefined,
          imageUrl: imageUrl || undefined,
          authorId: user?.id ?? 'anonymous',
          guildId: user?.guildId ?? '0',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create review');
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-[#2b2d31] rounded-2xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#f2f3f5]">Write a Review</h2>
            <button
              onClick={onClose}
              className="text-[#949ba4] hover:text-[#dbdee1] text-xl leading-none transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs text-[#949ba4] font-semibold uppercase tracking-wide">Subject</label>
                <input
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What are you reviewing?"
                  className="bg-[#1e1f22] text-[#dbdee1] placeholder-[#4e5058] border border-[#3f4147] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5865f2] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#949ba4] font-semibold uppercase tracking-wide">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-[#1e1f22] text-[#dbdee1] border border-[#3f4147] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5865f2] transition-colors"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#949ba4] font-semibold uppercase tracking-wide">Rating</label>
              <input
                required
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="e.g. 8/10, S-tier, Great"
                className="bg-[#1e1f22] text-[#dbdee1] placeholder-[#4e5058] border border-[#3f4147] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5865f2] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#949ba4] font-semibold uppercase tracking-wide">Comments <span className="normal-case font-normal">(optional)</span></label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="bg-[#1e1f22] text-[#dbdee1] placeholder-[#4e5058] border border-[#3f4147] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5865f2] transition-colors resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#949ba4] font-semibold uppercase tracking-wide">Image URL <span className="normal-case font-normal">(optional)</span></label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="bg-[#1e1f22] text-[#dbdee1] placeholder-[#4e5058] border border-[#3f4147] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5865f2] transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
            >
              {submitting ? 'Posting...' : 'Post Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
