"use client";

import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
	NotificationContainer,
	type Notification,
	type NotificationType,
} from "@/components/common/Notification";
import {
	ConfirmDialogContainer,
	type ConfirmDialog,
	type ConfirmDialogType,
} from "@/components/common/ConfirmDialog";

interface NotificationContextType {
	showNotification: (
		type: NotificationType,
		message: string,
		duration?: number,
	) => void;
	showSuccess: (message: string, duration?: number) => void;
	showWarning: (message: string, duration?: number) => void;
	showError: (message: string, duration?: number) => void;
	showConfirm: (
		type: ConfirmDialogType,
		title: string,
		message: string,
		onConfirm: () => void,
		onCancel?: () => void,
		confirmLabel?: string,
		cancelLabel?: string,
	) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
	undefined,
);

export const useNotification = () => {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error(
			"useNotification must be used within a NotificationProvider",
		);
	}
	return context;
};

interface NotificationProviderProps {
	children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
	children,
}) => {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [confirmDialogs, setConfirmDialogs] = useState<ConfirmDialog[]>([]);

	const removeNotification = useCallback((id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
	}, []);

	const removeConfirmDialog = useCallback((id: string) => {
		setConfirmDialogs((prev) => prev.filter((d) => d.id !== id));
	}, []);

	const showNotification = useCallback(
		(type: NotificationType, message: string, duration?: number) => {
			const id = `notification-${Date.now()}-${Math.random()}`;
			const notification: Notification = {
				id,
				type,
				message,
				duration,
			};
			setNotifications((prev) => [...prev, notification]);
		},
		[],
	);

	const showSuccess = useCallback(
		(message: string, duration?: number) => {
			showNotification("success", message, duration);
		},
		[showNotification],
	);

	const showWarning = useCallback(
		(message: string, duration?: number) => {
			showNotification("warning", message, duration);
		},
		[showNotification],
	);

	const showError = useCallback(
		(message: string, duration?: number) => {
			showNotification("error", message, duration);
		},
		[showNotification],
	);

	const showConfirm = useCallback(
		(
			type: ConfirmDialogType,
			title: string,
			message: string,
			onConfirm: () => void,
			onCancel?: () => void,
			confirmLabel?: string,
			cancelLabel?: string,
		) => {
			const id = `confirm-${Date.now()}-${Math.random()}`;
			const dialog: ConfirmDialog = {
				id,
				type,
				title,
				message,
				confirmLabel,
				cancelLabel,
				onConfirm: () => {
					removeConfirmDialog(id);
					onConfirm();
				},
				onCancel: () => {
					removeConfirmDialog(id);
					onCancel?.();
				},
			};
			setConfirmDialogs((prev) => [...prev, dialog]);
		},
		[removeConfirmDialog],
	);

	return (
		<NotificationContext.Provider
			value={{
				showNotification,
				showSuccess,
				showWarning,
				showError,
				showConfirm,
			}}
		>
			{children}
			<NotificationContainer
				notifications={notifications}
				onClose={removeNotification}
			/>
			{typeof window !== "undefined" &&
				createPortal(
					<ConfirmDialogContainer dialogs={confirmDialogs} />,
					document.body,
				)}
		</NotificationContext.Provider>
	);
};
