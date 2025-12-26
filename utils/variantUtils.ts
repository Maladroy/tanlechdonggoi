import type { VariantOption, VariantValue, VariantCombinationRule } from '../types';

/**
 * Calculate the final price of a product based on selected variants
 * @param basePrice The base price of the product/combo
 * @param selectedVariants Record of selected variant option names and value IDs { "Size": "size-id-123" }
 * @param variantOptions The list of variant options available for the product
 * @param rules Optional combination rules that might override prices
 * @returns The calculated final price
 */
export const calculateVariantPrice = (
    basePrice: number,
    selectedVariants: Record<string, string>,
    variantOptions: VariantOption[],
    rules?: VariantCombinationRule[]
): number => {
    let finalPrice = basePrice;

    if (!selectedVariants || Object.keys(selectedVariants).length === 0) {
        return finalPrice;
    }

    // Check if there's a custom price rule for this combination
    const matchingRule = rules?.find(rule => {
        // Check if rule matches all selected variants
        return Object.entries(rule.combination).every(([key, value]) =>
            selectedVariants[key] === value
        ) &&
            // And rule has same number of keys (exact match)
            Object.keys(rule.combination).length === Object.keys(selectedVariants).length;
    });

    if (matchingRule && matchingRule.customPriceAdjustment !== undefined) {
        // If rule has custom price adjustment, use it
        // Note: The logic could be interpreted as "add this adjustment" or "override price". 
        // Based on "customPriceAdjustment", let's assume it's an adjustment added to base.
        // Or if it's meant to be the TOTAL price, the name would be different.
        // The instructions say "Optional override for combination-specific pricing". 
        // Let's assume it replaces the standard variant calculation if present, 
        // effectively becoming (base + adjustment).
        return basePrice + matchingRule.customPriceAdjustment;
    }

    // Otherwise calculate sum of individual variant price changes
    for (const [optionName, valueId] of Object.entries(selectedVariants)) {
        const option = variantOptions.find(o => o.name === optionName);
        if (option) {
            const value = option.values.find(v => v.id === valueId);
            if (value) {
                finalPrice += value.priceChange;
            }
        }
    }

    return Math.max(0, finalPrice); // Ensure price never goes below 0
};

/**
 * Check if a variant combination is available
 * @param selectedVariants Record of selected variant option names and value IDs
 * @param rules List of combination rules
 * @returns Object containing availability status and reason
 */
export const isVariantCombinationAvailable = (
    selectedVariants: Record<string, string>,
    rules?: VariantCombinationRule[]
): { available: boolean; reason?: string } => {
    if (!rules || rules.length === 0) {
        return { available: true };
    }

    // Find a rule that matches the current selection
    // Note: We might be matching partial selections too if needed, but usually 
    // rules define full combinations. 
    // However, if we want to disable "Small + Red", we check if the selection *contains* this.

    // Strategy: Find any rule that matches the subset of selected variants and says "not available"
    const matchingRule = rules.find(rule => {
        // Check if the rule's combination matches the selected variants
        const ruleMatches = Object.entries(rule.combination).every(([key, value]) =>
            selectedVariants[key] === value
        );

        return ruleMatches && !rule.isAvailable;
    });

    if (matchingRule) {
        return {
            available: false,
            reason: matchingRule.reason || 'This combination is not available'
        };
    }

    return { available: true };
};

/**
 * Generate all possible combinations of variants
 */
export const getAllPossibleCombinations = (
    variantOptions: VariantOption[]
): Record<string, string>[] => {
    if (!variantOptions || variantOptions.length === 0) {
        return [];
    }

    // Recursive function to generate permutations
    const generate = (
        index: number,
        current: Record<string, string>
    ): Record<string, string>[] => {
        if (index === variantOptions.length) {
            return [current];
        }

        const option = variantOptions[index];
        const combinations: Record<string, string>[] = [];

        for (const value of option.values) {
            combinations.push(
                ...generate(index + 1, {
                    ...current,
                    [option.name]: value.id
                })
            );
        }

        return combinations;
    };

    return generate(0, {});
};

/**
 * Migrate old variant data structure to new structure
 * @param oldVariants Array of variants in old format or new format
 * @returns Array of variants in new format
 */
export const migrateOldVariantData = (oldVariants: any[]): VariantOption[] => {
    if (!oldVariants || oldVariants.length === 0) return [];

    // Check if already in new format (check for 'id' and 'values' being objects)
    const isNewFormat = oldVariants.every(v =>
        v.id && Array.isArray(v.values) && (v.values.length === 0 || typeof v.values[0] === 'object')
    );

    if (isNewFormat) return oldVariants as VariantOption[];

    // Convert old format
    return oldVariants.map((v, index) => ({
        id: crypto.randomUUID(),
        name: v.name,
        order: index,
        required: true,
        values: Array.isArray(v.values)
            ? v.values.map((val: string | any, valIndex: number) => {
                if (typeof val === 'string') {
                    return {
                        id: crypto.randomUUID(),
                        label: val,
                        priceChange: 0,
                        order: valIndex
                    } as VariantValue;
                }
                return val as VariantValue;
            })
            : []
    }));
};
