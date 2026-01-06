import type {
	LegacyVariantOption,
	VariantCombinationRule,
	VariantOption,
	VariantValue,
} from "./types";

/**
 * Calculates the similarity between two strings using Levenshtein distance.
 * Returns a value between 0 (no match) and 1 (perfect match).
 */
export function calculateSimilarity(s1: string, s2: string): number {
	const longer = s1.length > s2.length ? s1 : s2;
	const shorter = s1.length > s2.length ? s2 : s1;

	if (longer.length === 0) {
		return 1.0;
	}

	const dist = levenshteinDistance(longer, shorter);
	return (longer.length - dist) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
	const m = s1.length;
	const n = s2.length;
	const dp: number[][] = [];

	for (let i = 0; i <= m; i++) {
		dp[i] = [];
		for (let j = 0; j <= n; j++) {
			if (i === 0) {
				dp[i][j] = j;
			} else if (j === 0) {
				dp[i][j] = i;
			} else {
				dp[i][j] = 0;
			}
		}
	}

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (s1[i - 1].toLowerCase() === s2[j - 1].toLowerCase()) {
				dp[i][j] = dp[i - 1][j - 1];
			} else {
				dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
			}
		}
	}

	return dp[m][n];
}

/**
 * Strips markdown formatting from a string.
 */
export function stripMarkdown(markdown: string): string {
	if (!markdown) return "";

	// Remove headers
	let text = markdown.replace(/^#+\s+/gm, "");

	// Remove bold/italic (handle **text**, __text__, *text*, _text_)
	text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
	text = text.replace(/(\*|_)(.*?)\1/g, "$2");

	// Remove images ![alt](url) -> ""
	text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

	// Remove links [text](url) -> text
	text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

	// Remove code blocks
	text = text.replace(/`{1,3}(.*?)`{1,3}/g, "$1");

	// Remove blockquotes
	text = text.replace(/^>\s+/gm, "");

	// Remove list markers
	text = text.replace(/^[-*+]\s+/gm, "");

	// Remove horizontal rules
	text = text.replace(/^-{3,}/gm, "");

	return text.trim();
}

// ===== Variant System Utilities =====

/**
 * Generates a unique ID for variant options and values.
 */
export function generateVariantId(): string {
	return `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculates the final price based on selected variants.
 * @param basePrice - The base price of the product
 * @param selectedVariants - Record of variantOptionId -> variantValueId
 * @param variantOptions - Array of variant options with their values
 * @param combinationRules - Optional rules for combination-specific pricing
 * @returns The final calculated price
 */
export function calculateVariantPrice(
	basePrice: number,
	selectedVariants: Record<string, string>,
	variantOptions: VariantOption[],
	combinationRules?: VariantCombinationRule[],
): number {
	let totalPrice = basePrice;

	// Check for combination-specific custom price adjustment
	if (combinationRules && combinationRules.length > 0) {
		const matchingRule = findMatchingCombinationRule(
			selectedVariants,
			combinationRules,
		);
		if (matchingRule?.customPriceAdjustment !== undefined) {
			return basePrice + matchingRule.customPriceAdjustment;
		}
	}

	// Calculate price by summing all variant price changes
	for (const [optionId, valueId] of Object.entries(selectedVariants)) {
		const option = variantOptions.find((opt) => opt.id === optionId);
		if (option) {
			const value = option.values.find((v) => v.id === valueId);
			if (value) {
				totalPrice += value.priceChange;
			}
		}
	}

	// Ensure price doesn't go below 0
	return Math.max(0, totalPrice);
}

/**
 * Finds a matching combination rule for the selected variants.
 */
export function findMatchingCombinationRule(
	selectedVariants: Record<string, string>,
	rules: VariantCombinationRule[],
): VariantCombinationRule | null {
	if (!rules || rules.length === 0) return null;

	for (const rule of rules) {
		const isMatch = Object.entries(rule.combination).every(
			([optionId, valueId]) => selectedVariants[optionId] === valueId,
		);
		if (isMatch) return rule;
	}

	return null;
}

/**
 * Checks if a variant combination is available.
 * @param selectedVariants - Record of variantOptionId -> variantValueId
 * @param rules - Array of combination rules
 * @returns Object with availability status and optional reason
 */
export function isVariantCombinationAvailable(
	selectedVariants: Record<string, string>,
	rules?: VariantCombinationRule[],
): { available: boolean; reason?: string } {
	if (!rules || rules.length === 0) {
		return { available: true };
	}

	const matchingRule = findMatchingCombinationRule(selectedVariants, rules);

	if (matchingRule) {
		return {
			available: matchingRule.isAvailable,
			reason: matchingRule.reason,
		};
	}

	// No explicit rule means it's available by default
	return { available: true };
}

/**
 * Generates all possible variant combinations.
 * @param variantOptions - Array of variant options
 * @returns Array of all possible combinations as Record<optionId, valueId>
 */
export function getAllPossibleCombinations(
	variantOptions: VariantOption[],
): Record<string, string>[] {
	if (!variantOptions || variantOptions.length === 0) {
		return [];
	}

	// Filter to only required variants or all if none are required
	const relevantOptions = variantOptions.filter((opt) => opt.values.length > 0);

	if (relevantOptions.length === 0) {
		return [];
	}

	// Start with combinations from the first option
	let combinations: Record<string, string>[] = relevantOptions[0].values.map(
		(value) => ({
			[relevantOptions[0].id]: value.id,
		}),
	);

	// Add each subsequent option's values
	for (let i = 1; i < relevantOptions.length; i++) {
		const option = relevantOptions[i];
		const newCombinations: Record<string, string>[] = [];

		for (const existing of combinations) {
			for (const value of option.values) {
				newCombinations.push({
					...existing,
					[option.id]: value.id,
				});
			}
		}

		combinations = newCombinations;
	}

	return combinations;
}

/**
 * Gets a variant value by its ID from variant options.
 * @param variantOptions - Array of variant options
 * @param optionId - The ID of the variant option
 * @param valueId - The ID of the variant value
 * @returns The variant value or null if not found
 */
export function getVariantValueById(
	variantOptions: VariantOption[],
	optionId: string,
	valueId: string,
): VariantValue | null {
	const option = variantOptions.find((opt) => opt.id === optionId);
	if (!option) return null;

	const value = option.values.find((v) => v.id === valueId);
	return value || null;
}

/**
 * Gets the variant option by its ID.
 */
export function getVariantOptionById(
	variantOptions: VariantOption[],
	optionId: string,
): VariantOption | null {
	return variantOptions.find((opt) => opt.id === optionId) || null;
}

/**
 * Formats a price change for display.
 * @param priceChange - The price change amount
 * @returns Formatted string like "+5,000₫" or "-2,000₫" or "" for 0
 */
export function formatPriceChange(priceChange: number): string {
	if (priceChange === 0) return "";
	const sign = priceChange > 0 ? "+" : "";
	return `${sign}${priceChange.toLocaleString("vi-VN")}₫`;
}

/**
 * Gets display text for selected variants.
 * @param selectedVariants - Record of optionId -> valueId
 * @param variantOptions - Array of variant options
 * @returns Formatted string like "Size: M, Color: Red"
 */
export function getVariantsDisplayText(
	selectedVariants: Record<string, string>,
	variantOptions: VariantOption[],
): string {
	const parts: string[] = [];

	for (const [optionId, valueId] of Object.entries(selectedVariants)) {
		const option = variantOptions.find((opt) => opt.id === optionId);
		if (option) {
			const value = option.values.find((v) => v.id === valueId);
			if (value) {
				parts.push(`${option.name}: ${value.label}`);
			}
		}
	}

	return parts.join(", ");
}

/**
 * Gets the image URL for selected variants.
 * Returns the first variant value's image that has one.
 */
export function getVariantImageUrl(
	selectedVariants: Record<string, string>,
	variantOptions: VariantOption[],
	defaultImage: string,
): string {
	for (const [optionId, valueId] of Object.entries(selectedVariants)) {
		const option = variantOptions.find((opt) => opt.id === optionId);
		if (option) {
			const value = option.values.find((v) => v.id === valueId);
			if (value?.imageUrl) {
				return value.imageUrl;
			}
		}
	}
	return defaultImage;
}

/**
 * Migrates old variant data structure to new format.
 * @param oldVariants - Array of legacy variant options (name + string[] values)
 * @param variantImages - Optional map of value labels to image URLs
 * @returns Array of new VariantOption format
 */
export function migrateOldVariantData(
	oldVariants: LegacyVariantOption[],
	variantImages?: Record<string, string>,
): VariantOption[] {
	if (!oldVariants || oldVariants.length === 0) {
		return [];
	}

	return oldVariants.map((oldOption, optionIndex) => ({
		id: generateVariantId(),
		name: oldOption.name,
		order: optionIndex,
		required: true,
		values: oldOption.values.map((label, valueIndex) => ({
			id: generateVariantId(),
			label: label,
			priceChange: 0,
			order: valueIndex,
			imageUrl: variantImages?.[label],
		})),
	}));
}

/**
 * Checks if variants are in the new format (have id field).
 */
export function isNewVariantFormat(
	variants: VariantOption[] | LegacyVariantOption[] | undefined,
): variants is VariantOption[] {
	if (!variants || variants.length === 0) return true; // Empty is considered new format
	return "id" in variants[0];
}

/**
 * Ensures variants are in the new format, migrating if necessary.
 */
export function ensureNewVariantFormat(
	variants: VariantOption[] | LegacyVariantOption[] | undefined,
	variantImages?: Record<string, string>,
): VariantOption[] {
	if (!variants || variants.length === 0) return [];

	if (isNewVariantFormat(variants)) {
		return variants;
	}

	return migrateOldVariantData(
		variants as LegacyVariantOption[],
		variantImages,
	);
}

/**
 * Validates variant options structure.
 * Returns array of error messages, empty if valid.
 */
export function validateVariantOptions(
	variantOptions: VariantOption[],
): string[] {
	const errors: string[] = [];

	if (!variantOptions || variantOptions.length === 0) {
		return errors;
	}

	const optionNames = new Set<string>();

	for (const option of variantOptions) {
		// Check for duplicate option names
		if (optionNames.has(option.name.toLowerCase())) {
			errors.push(`Tên biến thể "${option.name}" bị trùng lặp`);
		}
		optionNames.add(option.name.toLowerCase());

		// Check for empty values
		if (option.values.length === 0) {
			errors.push(`Biến thể "${option.name}" phải có ít nhất một giá trị`);
		}

		// Check for duplicate value labels within option
		const valueLabels = new Set<string>();
		for (const value of option.values) {
			if (valueLabels.has(value.label.toLowerCase())) {
				errors.push(
					`Giá trị "${value.label}" trong "${option.name}" bị trùng lặp`,
				);
			}
			valueLabels.add(value.label.toLowerCase());

			// Check for empty labels
			if (!value.label.trim()) {
				errors.push(`Biến thể "${option.name}" có giá trị rỗng`);
			}
		}
	}

	return errors;
}

/**
 * Creates a new empty variant option.
 */
export function createEmptyVariantOption(order: number): VariantOption {
	return {
		id: generateVariantId(),
		name: "",
		values: [],
		order,
		required: true,
	};
}

/**
 * Creates a new empty variant value.
 */
export function createEmptyVariantValue(order: number): VariantValue {
	return {
		id: generateVariantId(),
		label: "",
		priceChange: 0,
		order,
	};
}
