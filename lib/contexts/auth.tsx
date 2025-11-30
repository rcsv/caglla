"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import logger from "@/lib/core/logger";
import {
	User,
	onAuthStateChanged,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { getBrowserInfo } from "@/lib/utils/browser";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";

import type { AuthContextType } from "@/lib/core/types";

const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: true,
	signInWithGoogle: async () => {},
	logout: async () => {},
});

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			setUser(user);
			setLoading(false);

			// ユーザーがログインした場合、ユーザー情報を作成/更新
			if (user) {
				await createOrUpdateUser(user);
			}
		});

		return () => unsubscribe();
	}, []);

	const createOrUpdateUser = async (firebaseUser: User) => {
		try {
			// ブラウザ情報を取得
			const browserInfo = await getBrowserInfo();

			// 既存ユーザーかどうかをチェック
			const existingUserResponse = await makeAuthenticatedRequest(
				"/api/users",
				{
					method: "GET",
				},
			);

			if (existingUserResponse.ok) {
				// 既存ユーザーの場合：preferencesのみ更新（Google情報は送信しない）
				const userData = {
					preferences: {
						currency: browserInfo.currency,
						timezone: browserInfo.timezone,
						language: browserInfo.language,
						home_address: browserInfo.homeAddress,
						theme: "light" as const,
						notifications: true,
					},
				};

				logger.info("Updating existing user preferences");
				await makeAuthenticatedRequest("/api/users", {
					method: "POST",
					body: JSON.stringify(userData),
				});
			} else {
				// 新規ユーザーの場合のみ：Google情報を含めてユーザーを作成
				const userData = {
					name:
						firebaseUser.displayName ||
						firebaseUser.email?.split("@")[0] ||
						"ユーザー",
					email: firebaseUser.email || "",
					profile_image_url: firebaseUser.photoURL || "",
					preferences: {
						currency: browserInfo.currency,
						timezone: browserInfo.timezone,
						language: browserInfo.language,
						home_address: browserInfo.homeAddress,
						theme: "light" as const,
						notifications: true,
					},
				};

				logger.info("Creating new user with Google authentication");
				await makeAuthenticatedRequest("/api/users", {
					method: "POST",
					body: JSON.stringify(userData),
				});
			}
		} catch (error) {
			logger.error("Error creating/updating user:", error);
		}
	};

	const signInWithGoogle = async () => {
		const provider = new GoogleAuthProvider();
		try {
			await signInWithPopup(auth, provider);
		} catch (error) {
			logger.error("Error signing in with Google:", error);
		}
	};

	const logout = async () => {
		try {
			await signOut(auth);
		} catch (error) {
			logger.error("Error signing out:", error);
		}
	};

	const value = {
		user,
		loading,
		signInWithGoogle,
		logout,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
