import { useState, useEffect, useCallback } from 'react';

export type Review = {
  id: number;
  subject: string;
  category: string;
  rating: string;
  imageUrl: string | null;
  comments: string | null;
  authorId: string;
  createdAt: string;
};

type ReviewsResponse = {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
};

export type Filters = {
  category: string;
  search: string;
  page: number;
};

export function useReviews(filters: Filters) {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(filters.page), limit: '12' });
      if (filters.category) params.set('category', filters.category);
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`/api/reviews?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      setData(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.search, filters.page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}
