"use client";

import React, { useEffect } from "react";
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";
import Button from "@/components/common/Button";

export type ConfirmDialogType = "warning" | "info" | "danger";

export interface ConfirmDialog {
	id: string;
	type: ConfirmDialogType;
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

interface ConfirmDialogProps {
	dialog: ConfirmDialog;
}

const ConfirmDialogItem: React.FC<ConfirmDialogProps> = ({ dialog }) => {
	useEffect(() => {
		// ESCキーでキャンセル
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				dialog.onCancel();
			}
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [dialog]);

	const typeStyles = {
		warning: {
			icon: "mdi:alert",
			iconColor: "text-yellow-600",
			iconBg: "bg-yellow-50",
			border: "border-yellow-200",
		},
		info: {
			icon: "mdi:information",
			iconColor: "text-blue-600",
			iconBg: "bg-blue-50",
			border: "border-blue-200",
		},
		danger: {
			icon: "mdi:alert-circle",
			iconColor: "text-red-600",
			iconBg: "bg-red-50",
			border: "border-red-200",
		},
	};

	const styles = typeStyles[dialog.type];

	return (
		<div
			className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
			onClick={dialog.onCancel}
			style={{
				animation: "fadeIn 0.2s ease-out",
			}}
		>
			{/* Dialog */}
			<div
				className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all"
				onClick={(e) => e.stopPropagation()}
				style={{
					animation: "slideInScale 0.2s ease-out",
				}}
			>
				{/* Header */}
				<div className={`flex items-start gap-4 p-6 border-b ${styles.border}`}>
					<div
						className={`flex-shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}
					>
						<Icon
							icon={styles.icon}
							className={`${styles.iconColor} w-6 h-6`}
						/>
					</div>
					<div className="flex-1">
						<h3 className="text-lg font-semibold text-gray-900 mb-1">
							{dialog.title}
						</h3>
						<p className="text-sm text-gray-600">{dialog.message}</p>
					</div>
				</div>

				{/* Footer */}
				<div className="flex justify-end gap-3 p-6">
					<Button
						variant="secondary"
						onClick={dialog.onCancel}
						className="px-4 py-2"
					>
						{dialog.cancelLabel || "キャンセル"}
					</Button>
					<Button
						variant={dialog.type === "danger" ? "danger" : "primary"}
						onClick={dialog.onConfirm}
						className="px-4 py-2"
					>
						{dialog.confirmLabel || "確認"}
					</Button>
				</div>
			</div>
		</div>
	);
};

interface ConfirmDialogContainerProps {
	dialogs: ConfirmDialog[];
}

export const ConfirmDialogContainer: React.FC<ConfirmDialogContainerProps> = ({
	dialogs,
}) => {
	if (dialogs.length === 0) return null;

	return (
		<>
			{dialogs.map((dialog) => (
				<ConfirmDialogItem key={dialog.id} dialog={dialog} />
			))}
		</>
	);
};
