/**
 * User（ユーザー）スキーマ
 *
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from "zod";

/**
 * Gender スキーマ
 */
const GenderSchema = z.enum(["male", "female", "other", "prefer_not_to_say"]);

/**
 * ユーザー作成・更新リクエストスキーマ
 *
 * `app/api/users/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 */
export const CreateUserSchema = z.object({
	name: z.string().optional(),
	email: z.string().email().optional(),
	profile_image_url: z.string().url().optional().or(z.literal("")),
	bio: z.string().optional(),
	gender: GenderSchema.optional(),
	preferences: z.record(z.any()).optional(),
});

/**
 * ユーザー更新リクエストスキーマ
 *
 * `app/api/users/[userSlug]/route.ts` PUT エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{...}>(request)
 * if (Object.keys(updateData).length === 0) {
 *   return badRequest('No fields to update')
 * }
 * ```
 *
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // 少なくとも1つのフィールドが更新されることを検証
 * ```
 */
export const UpdateUserSchema = z
	.object({
		name: z.string().optional(),
		profile_image_url: z.string().url().optional().or(z.literal("")),
		bio: z.string().optional(),
		gender: GenderSchema.optional(),
		preferences: z.record(z.any()).optional(),
	})
	.refine(
		(data) => {
			// 少なくとも1つのフィールドが更新される必要がある
			return Object.keys(data).length > 0;
		},
		{
			message: "At least one field must be provided for update",
			path: [],
		},
	);

/**
 * 型推論
 */
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
