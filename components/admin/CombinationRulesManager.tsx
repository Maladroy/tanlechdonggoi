import { AlertCircle, Check, Search, X } from "lucide-react";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import type { VariantCombinationRule, VariantOption } from "../../types";
import {
	generateVariantId,
	getAllPossibleCombinations,
	getVariantValueById,
} from "../../utils";

interface CombinationRulesManagerProps {
	variantOptions: VariantOption[];
	rules: VariantCombinationRule[];
	onChange: (rules: VariantCombinationRule[]) => void;
}

export const CombinationRulesManager: React.FC<
	CombinationRulesManagerProps
> = ({ variantOptions, rules, onChange }) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [showOnlyDisabled, setShowOnlyDisabled] = useState(false);

	// Generate all possible combinations
	const allCombinations = useMemo(() => {
		return getAllPossibleCombinations(variantOptions);
	}, [variantOptions]);

	// Get rule for a specific combination or create default
	const getRuleForCombination = useCallback(
		(combination: Record<string, string>): VariantCombinationRule => {
			const existingRule = rules.find((rule) => {
				return Object.entries(combination).every(
					([optionId, valueId]) => rule.combination[optionId] === valueId,
				);
			});

			if (existingRule) return existingRule;

			return {
				id: generateVariantId(),
				combination,
				isAvailable: true,
				reason: "",
			};
		},
		[rules],
	);

	// Get display text for a combination
	const getCombinationDisplayText = useCallback(
		(combination: Record<string, string>): string => {
			return Object.entries(combination)
				.map(([optionId, valueId]) => {
					const value = getVariantValueById(variantOptions, optionId, valueId);
					return value?.label || valueId;
				})
				.join(" + ");
		},
		[variantOptions],
	);

	// Filter combinations based on search
	const filteredCombinations = useMemo(() => {
		let filtered = allCombinations;

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter((combo) => {
				const displayText = getCombinationDisplayText(combo).toLowerCase();
				return displayText.includes(query);
			});
		}

		if (showOnlyDisabled) {
			filtered = filtered.filter((combo) => {
				const rule = getRuleForCombination(combo);
				return !rule.isAvailable;
			});
		}

		return filtered;
	}, [
		allCombinations,
		searchQuery,
		showOnlyDisabled,
		getCombinationDisplayText,
		getRuleForCombination,
	]);

	// Update a rule
	const updateRule = (
		combination: Record<string, string>,
		updates: Partial<VariantCombinationRule>,
	) => {
		const existingIndex = rules.findIndex((rule) => {
			return Object.entries(combination).every(
				([optionId, valueId]) => rule.combination[optionId] === valueId,
			);
		});

		if (existingIndex >= 0) {
			const updated = [...rules];
			updated[existingIndex] = { ...updated[existingIndex], ...updates };
			onChange(updated);
		} else {
			const newRule: VariantCombinationRule = {
				id: generateVariantId(),
				combination,
				isAvailable: true,
				...updates,
			};
			onChange([...rules, newRule]);
		}
	};

	// Toggle availability
	const toggleAvailability = (combination: Record<string, string>) => {
		const rule = getRuleForCombination(combination);
		updateRule(combination, { isAvailable: !rule.isAvailable });
	};

	// Bulk enable all
	const enableAll = () => {
		onChange(rules.map((rule) => ({ ...rule, isAvailable: true })));
	};

	// Bulk disable all filtered
	const disableAllFiltered = () => {
		const newRules = [...rules];
		for (const combo of filteredCombinations) {
			const existingIndex = newRules.findIndex((rule) => {
				return Object.entries(combo).every(
					([optionId, valueId]) => rule.combination[optionId] === valueId,
				);
			});

			if (existingIndex >= 0) {
				newRules[existingIndex] = {
					...newRules[existingIndex],
					isAvailable: false,
				};
			} else {
				newRules.push({
					id: generateVariantId(),
					combination: combo,
					isAvailable: false,
				});
			}
		}
		onChange(newRules);
	};

	// Count disabled rules
	const disabledCount = rules.filter((r) => !r.isAvailable).length;

	if (variantOptions.length === 0 || allCombinations.length === 0) {
		return null;
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<span className="block text-sm font-bold text-slate-700">
					Quản lý kết hợp biến thể
					{disabledCount > 0 && (
						<span className="ml-2 text-xs text-red-500 font-normal">
							({disabledCount} đã tắt)
						</span>
					)}
				</span>
			</div>

			{/* Search and Filters */}
			<div className="flex flex-wrap gap-2 items-center">
				<div className="relative flex-1 min-w-[200px]">
					<Search
						size={14}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
					/>
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Tìm kết hợp..."
						className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
					/>
				</div>

				<label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
					<input
						type="checkbox"
						checked={showOnlyDisabled}
						onChange={(e) => setShowOnlyDisabled(e.target.checked)}
						className="w-3.5 h-3.5 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
					/>
					Chỉ hiện đã tắt
				</label>

				<div className="flex gap-1">
					<button
						type="button"
						onClick={enableAll}
						className="text-xs px-3 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition"
						title="Bật tất cả"
					>
						<Check size={14} />
					</button>
					<button
						type="button"
						onClick={disableAllFiltered}
						className="text-xs px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition"
						title="Tắt đang lọc"
					>
						<X size={14} />
					</button>
				</div>
			</div>

			{/* Combinations List */}
			<div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl bg-white">
				{filteredCombinations.length === 0 ? (
					<div className="p-4 text-center text-slate-400 text-sm">
						{searchQuery
							? "Không tìm thấy kết hợp nào"
							: "Không có kết hợp biến thể"}
					</div>
				) : (
					<div className="divide-y divide-slate-100">
						{filteredCombinations.map((combo) => {
							const rule = getRuleForCombination(combo);
							const displayText = getCombinationDisplayText(combo);
							const comboKey = Object.values(combo).join("-");

							return (
								<div
									key={comboKey}
									className={`flex items-center gap-3 p-3 hover:bg-slate-50 transition ${
										!rule.isAvailable ? "bg-red-50/50" : ""
									}`}
								>
									<button
										type="button"
										onClick={() => toggleAvailability(combo)}
										className={`w-5 h-5 rounded flex items-center justify-center transition ${
											rule.isAvailable
												? "bg-green-500 text-white"
												: "bg-red-500 text-white"
										}`}
									>
										{rule.isAvailable ? <Check size={12} /> : <X size={12} />}
									</button>

									<span
										className={`flex-1 text-sm ${
											!rule.isAvailable
												? "text-slate-400 line-through"
												: "text-slate-700"
										}`}
									>
										{displayText}
									</span>

									{!rule.isAvailable && (
										<input
											type="text"
											value={rule.reason || ""}
											onChange={(e) =>
												updateRule(combo, { reason: e.target.value })
											}
											placeholder="Lý do (VD: Hết hàng)"
											className="w-32 px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
										/>
									)}

									{rule.customPriceAdjustment !== undefined && (
										<span className="text-xs text-blue-600">
											+{rule.customPriceAdjustment.toLocaleString("vi-VN")}₫
										</span>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Info */}
			{allCombinations.length > 10 && (
				<div className="text-xs text-slate-500 bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex items-start gap-2">
					<AlertCircle size={14} className="shrink-0 mt-0.5 text-yellow-600" />
					<span>
						Có {allCombinations.length} kết hợp biến thể. Chỉ tắt các kết hợp
						không khả dụng (hết hàng, ngừng sản xuất...).
					</span>
				</div>
			)}
		</div>
	);
};

export default CombinationRulesManager;
