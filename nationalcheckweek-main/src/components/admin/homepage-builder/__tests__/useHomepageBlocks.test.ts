/**
 * Unit Tests for useHomepageBlocks Hook
 * 
 * Tests all CRUD operations, error handling, and optimistic updates.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useHomepageBlocks } from '../hooks/useHomepageBlocks';
import { adminFetch } from '@/lib/adminFetch';
import type { HomepageBlock } from '@/types/homepage-blocks';

// Mock adminFetch
vi.mock('@/lib/adminFetch');
const mockAdminFetch = adminFetch as ReturnType<typeof vi.fn>;

describe('useHomepageBlocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('fetchBlocks', () => {
    it('should fetch blocks successfully', async () => {
      const mockBlocks = [
        { id: '1', block_type: 'hero', title: 'Hero', content: {}, display_order: 1, is_visible: true },
        { id: '2', block_type: 'stats', title: 'Stats', content: {}, display_order: 2, is_visible: true },
      ];

      mockAdminFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ blocks: mockBlocks }),
      } as Response);

      const { result } = renderHook(() => useHomepageBlocks());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.blocks).toEqual(mockBlocks);
      expect(result.current.error).toBe('');
    });

    it('should handle fetch errors', async () => {
      mockAdminFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useHomepageBlocks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.blocks).toEqual([]);
    });

    it('should abort pending requests on unmount', async () => {
      const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

      mockAdminFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { unmount } = renderHook(() => useHomepageBlocks());

      unmount();

      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe('updateBlockOrder', () => {
    it('should update block order with optimistic update', async () => {
      const mockBlocks = [
        { id: '1', block_type: 'hero', title: 'Hero', content: {}, display_order: 1, is_visible: true },
        { id: '2', block_type: 'stats', title: 'Stats', content: {}, display_order: 2, is_visible: true },
      ];

      mockAdminFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ blocks: mockBlocks }) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as Response);

      const { result } = renderHook(() => useHomepageBlocks());

      await waitFor(() => expect(result.current.loading).toBe(false));

      const reorderedBlocks = ([mockBlocks[1], mockBlocks[0]] as HomepageBlock[]).map((b, i) => ({ ...b, display_order: i + 1 }));

      await act(async () => {
        await result.current.updateBlockOrder(reorderedBlocks);
      });

      expect(result.current.blocks).toEqual(reorderedBlocks);
      expect(result.current.success).toBe('Block order updated!');
    });

    it('should rollback on update failure', async () => {
      const mockBlocks = [
        { id: '1', block_type: 'hero', title: 'Hero', content: {}, display_order: 1, is_visible: true },
      ];

      mockAdminFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ blocks: mockBlocks }) } as Response)
        .mockRejectedValueOnce(new Error('Update failed'));

      const { result } = renderHook(() => useHomepageBlocks());

      await waitFor(() => expect(result.current.loading).toBe(false));

      const originalBlocks = [...result.current.blocks];
      const updatedBlocks = [{ ...mockBlocks[0], display_order: 2 }] as HomepageBlock[];

      await act(async () => {
        await result.current.updateBlockOrder(updatedBlocks);
      });

      // Should rollback to original
      expect(result.current.blocks).toEqual(originalBlocks);
      expect(result.current.error).toContain('Update failed');
    });
  });

  describe('toggleVisibility', () => {
    it('should toggle visibility with optimistic update', async () => {
      const mockBlocks = [
        { id: '1', block_type: 'hero', title: 'Hero', content: {}, display_order: 1, is_visible: true },
      ];

      mockAdminFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ blocks: mockBlocks }) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as Response);

      const { result } = renderHook(() => useHomepageBlocks());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggleVisibility('1', true);
      });

      expect(result.current.blocks[0].is_visible).toBe(false);
      expect(result.current.success).toBe('Block hidden');
    });
  });

  describe('deleteBlock', () => {
    it('should delete block with confirmation', async () => {
      global.confirm = vi.fn(() => true);

      const mockBlocks = [
        { id: '1', block_type: 'hero', title: 'Hero', content: {}, display_order: 1, is_visible: true },
        { id: '2', block_type: 'stats', title: 'Stats', content: {}, display_order: 2, is_visible: true },
      ];

      mockAdminFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ blocks: mockBlocks }) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as Response);

      const { result } = renderHook(() => useHomepageBlocks());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteBlock('1', 'Hero');
      });

      expect(result.current.blocks).toHaveLength(1);
      expect(result.current.blocks[0].id).toBe('2');
      expect(result.current.success).toBe('Block deleted successfully!');
    });

    it('should not delete if user cancels', async () => {
      global.confirm = vi.fn(() => false);

      const mockBlocks = [
        { id: '1', block_type: 'hero', title: 'Hero', content: {}, display_order: 1, is_visible: true },
      ];

      mockAdminFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ blocks: mockBlocks }) } as Response);

      const { result } = renderHook(() => useHomepageBlocks());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteBlock('1', 'Hero');
      });

      expect(result.current.blocks).toHaveLength(1);
    });
  });

  describe('message auto-dismiss', () => {
    it('should auto-dismiss success message after 3 seconds', async () => {
      const { result } = renderHook(() => useHomepageBlocks());

      act(() => {
        result.current.showSuccess('Test success');
      });

      expect(result.current.success).toBe('Test success');

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.success).toBe('');
    });

    it('should auto-dismiss error message after 5 seconds', async () => {
      const { result } = renderHook(() => useHomepageBlocks());

      act(() => {
        result.current.showError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.error).toBe('');
    });
  });
});
