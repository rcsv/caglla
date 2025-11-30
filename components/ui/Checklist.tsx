"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";

interface ChecklistItem {
	id: string;
	title: string;
	done: boolean;
}

interface ChecklistProps {
	title?: string;
}

export default function Checklist({ title = "Checklist" }: ChecklistProps) {
	const [items, setItems] = useState<ChecklistItem[]>([
		{ id: "passport", title: "パスポート", done: false },
		{ id: "tickets", title: "航空券/チケット", done: false },
		{ id: "cash", title: "現金/カード", done: false },
	]);
	const [input, setInput] = useState("");

	const toggle = (id: string) => {
		setItems((prev) =>
			prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
		);
	};

	const addItem = () => {
		const t = input.trim();
		if (!t) return;
		setItems((prev) => [
			...prev,
			{ id: `${Date.now()}`, title: t, done: false },
		]);
		setInput("");
	};

	const remove = (id: string) =>
		setItems((prev) => prev.filter((i) => i.id !== id));

	return (
		<div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm">
			<div className="p-4 border-b border-gray-200 flex items-center justify-between">
				<h2 className="text-lg font-semibold text-gray-900">{title}</h2>
			</div>
			<div className="p-4 flex items-center gap-2">
				<input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={t("checklist.addItem")}
					className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<button
					onClick={addItem}
					className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
				>
					追加
				</button>
			</div>
			<div className="px-4 pb-4 overflow-y-auto flex-1">
				<ul className="space-y-2">
					{items.map((item) => (
						<li key={item.id} className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={item.done}
								onChange={() => toggle(item.id)}
								className="w-4 h-4"
							/>
							<span
								className={`flex-1 ${item.done ? "line-through text-gray-400" : "text-gray-800"}`}
							>
								{item.title}
							</span>
							<button
								onClick={() => remove(item.id)}
								className="text-xs text-gray-500 hover:text-red-600"
							>
								削除
							</button>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
