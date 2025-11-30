"use client";
import logger from "@/lib/core/logger";

import { useState, useRef } from "react";
import Image from "next/image";
import { imageUploadHelpers } from "@/lib/storage/image-upload";
import { t } from "@/lib/i18n";

interface AvatarUploadProps {
	currentImageUrl?: string;
	onImageChange: (imageUrl: string | null) => void;
	userId: string;
	disabled?: boolean;
}

export default function AvatarUpload({
	currentImageUrl,
	onImageChange,
	userId,
	disabled,
}: AvatarUploadProps) {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validate file
		const validation = imageUploadHelpers.validateImageFile(file);
		if (!validation.valid) {
			setError(validation.error || t("profile.image.invalid"));
			return;
		}

		setError(null);
		setUploading(true);

		try {
			logger.debug(
				"Starting avatar upload for file:",
				file.name,
				"Size:",
				file.size,
			);

			// Generate path for the avatar image
			const path = imageUploadHelpers.generateAvatarImagePath(
				userId,
				file.name,
			);
			logger.debug("Upload path:", path);

			// Upload image
			const imageUrl = await imageUploadHelpers.uploadImage(
				file,
				path,
				userId,
				undefined,
				true,
			);
			logger.debug("Upload successful, URL:", imageUrl);

			onImageChange(imageUrl.downloadURL);
		} catch (error) {
			logger.error("Detailed upload error:", error);
			setError(
				`${t("profile.image.uploadFailed")}: ${error instanceof Error ? error.message : t("profile.image.unknownError")}`,
			);
		} finally {
			setUploading(false);
		}
	};

	const handleRemoveImage = async () => {
		if (currentImageUrl) {
			try {
				await imageUploadHelpers.deleteImage(currentImageUrl);
				onImageChange(null);
			} catch (error) {
				logger.error("Error deleting image:", error);
				setError(t("profile.image.deleteFailed"));
			}
		}
	};

	const handleButtonClick = () => {
		if (!disabled) {
			fileInputRef.current?.click();
		}
	};

	return (
		<div className="space-y-4">
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					{t("profile.image.title")}
				</label>

				<div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
					{/* Avatar Display */}
					<div className="relative self-center sm:self-auto">
						{currentImageUrl ? (
							<div className="relative">
								<Image
									src={currentImageUrl}
									alt={t("profile.image.alt")}
									width={80}
									height={80}
									className="w-20 h-20 object-cover rounded-full border-2 border-gray-300"
								/>
								{!disabled && (
									<button
										type="button"
										onClick={handleRemoveImage}
										className="absolute -top-3 -right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition duration-200"
										disabled={uploading}
									>
										<svg
											className="w-3.5 h-3.5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								)}
							</div>
						) : (
							<div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
								<svg
									className="w-8 h-8 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
							</div>
						)}
					</div>

					{/* Upload Button */}
					<div className="flex-1">
						<button
							type="button"
							onClick={handleButtonClick}
							disabled={uploading || disabled}
							className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-4 py-3 sm:py-2 rounded-lg transition duration-200 disabled:cursor-not-allowed min-h-[44px]"
						>
							{uploading
								? t("profile.image.uploading")
								: currentImageUrl
									? t("profile.image.change")
									: t("profile.image.upload")}
						</button>
						<p className="text-gray-500 text-xs mt-1">
							{t("profile.image.formats")}
						</p>
					</div>
				</div>

				<input
					ref={fileInputRef}
					type="file"
					accept="image/jpeg,image/jpg,image/png,image/webp"
					onChange={handleFileSelect}
					className="hidden"
					disabled={disabled}
				/>
			</div>

			{error && <div className="text-red-600 text-sm">{error}</div>}
		</div>
	);
}
