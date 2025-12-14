/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { UserService } from "./user.service";
import { createMockSupabaseClient } from "../../test/mocks/supabase.mock";

describe("UserService", () => {
  describe("getUserProfile", () => {
    it("should return user profile data when found", async () => {
      // Arrange
      const mockUserId = "user-123";
      const mockProfileData = {
        nickname: "TestUser",
        preferences: { theme: "dark", language: "pl" },
      };

      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: mockProfileData, error: null })),
            })),
          })),
        })),
      } as any);

      // Act
      const result = await UserService.getUserProfile(mockSupabase, mockUserId);

      // Assert
      expect(result).toEqual(mockProfileData);
      expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");

      // Assert Types
      expectTypeOf(result).toMatchTypeOf<any>();
      expectTypeOf(result?.nickname).toMatchTypeOf<string | undefined>();
    });

    it("should return null when profile is not found", async () => {
      // Arrange
      const mockUserId = "non-existent-user";
      const mockError = { code: "PGRST116", message: "Not found" };

      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: mockError })),
            })),
          })),
        })),
      } as any);

      // Act
      const result = await UserService.getUserProfile(mockSupabase, mockUserId);

      // Assert
      expect(result).toBeNull();
    });

    it("should throw error when database query fails", async () => {
      // Arrange
      const mockUserId = "user-123";
      const mockError = { code: "SOME_ERROR", message: "Database error" };

      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: mockError })),
            })),
          })),
        })),
      } as any);

      // Act & Assert
      await expect(UserService.getUserProfile(mockSupabase, mockUserId)).rejects.toThrow(
        "Failed to fetch user profile: Database error"
      );
    });

    it("should query with correct user id parameter", async () => {
      // Arrange
      const mockUserId = "user-456";
      const mockProfileData = { nickname: "Test", preferences: {} };

      const eqMock = vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: mockProfileData, error: null })),
      }));

      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: eqMock,
          })),
        })),
      } as any);

      // Act
      await UserService.getUserProfile(mockSupabase, mockUserId);

      // Assert
      expect(eqMock).toHaveBeenCalledWith("id", mockUserId);
    });
  });

  describe("deleteUser", () => {
    it("should successfully delete user when operation succeeds", async () => {
      // Arrange
      const mockUserId = "user-123";

      const mockSupabase = createMockSupabaseClient({
        auth: {
          admin: {
            deleteUser: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          },
        },
      } as any);

      // Act & Assert
      await expect(UserService.deleteUser(mockSupabase, mockUserId)).resolves.toBeUndefined();
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith(mockUserId);
    });

    it("should throw error when deletion fails", async () => {
      // Arrange
      const mockUserId = "user-123";
      const mockError = { message: "Failed to delete" };

      const mockSupabase = createMockSupabaseClient({
        auth: {
          admin: {
            deleteUser: vi.fn(() => Promise.resolve({ data: null, error: mockError })),
          },
        },
      } as any);

      // Act & Assert
      await expect(UserService.deleteUser(mockSupabase, mockUserId)).rejects.toThrow(
        "Failed to delete user: Failed to delete"
      );
    });

    it("should call admin deleteUser method with correct user ID", async () => {
      // Arrange
      const mockUserId = "user-789";
      const deleteUserMock = vi.fn(() => Promise.resolve({ data: {}, error: null }));

      const mockSupabase = createMockSupabaseClient({
        auth: {
          admin: {
            deleteUser: deleteUserMock,
          },
        },
      } as any);

      // Act
      await UserService.deleteUser(mockSupabase, mockUserId);

      // Assert
      expect(deleteUserMock).toHaveBeenCalledWith(mockUserId);
      expect(deleteUserMock).toHaveBeenCalledTimes(1);
    });
  });
});
