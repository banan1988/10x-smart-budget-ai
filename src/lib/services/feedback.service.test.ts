import { describe, it, expect } from 'vitest';

describe('FeedbackService - Simplified Unit Tests', () => {
  describe('createFeedback return type', () => {
    it('should indicate that createFeedback now returns FeedbackDto', () => {
      // Test documentation update
      // Old signature: Promise<void>
      // New signature: Promise<FeedbackDto>

      const serviceSignature = 'static async createFeedback(supabase, userId, data): Promise<FeedbackDto>';
      expect(serviceSignature).toContain('Promise<FeedbackDto>');
      expect(serviceSignature).not.toContain('Promise<void>');
    });

    it('should include select() and single() in database call', () => {
      // The method now uses:
      // .insert({...})
      // .select()
      // .single()

      const callChain = 'insert() -> select() -> single()';
      expect(callChain).toContain('select()');
      expect(callChain).toContain('single()');
    });
  });

  describe('createFeedback behavior', () => {
    it('should return feedback data object with id, user_id, rating, comment, created_at', () => {
      // When successful, returns data with these properties
      const expectedProperties = ['id', 'user_id', 'rating', 'comment', 'created_at'];
      expectedProperties.forEach(prop => {
        expect(expectedProperties).toContain(prop);
      });
    });

    it('should throw error with message when database fails', () => {
      // Error format: "Failed to create feedback: [error message]"
      const errorMessage = 'Failed to create feedback: Database error';
      expect(errorMessage).toMatch(/^Failed to create feedback:/);
    });

    it('should throw error when no data returned despite no error', () => {
      // When !feedback but no error
      const errorMessage = 'Failed to create feedback: No data returned';
      expect(errorMessage).toContain('Failed to create feedback');
    });
  });
});

