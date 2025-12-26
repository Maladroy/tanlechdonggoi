import React, { useMemo } from 'react';
import { VariantOption, VariantCombinationRule } from '../../types';
import { getAllPossibleCombinations } from '../../utils/variantUtils';
import { Check, X, AlertCircle } from 'lucide-react';

interface CombinationRulesManagerProps {
    variantOptions: VariantOption[];
    rules: VariantCombinationRule[];
    onChange: (rules: VariantCombinationRule[]) => void;
}

export default function CombinationRulesManager({
    variantOptions,
    rules,
    onChange
}: CombinationRulesManagerProps) {
    // Generate all possible combinations
    const combinations = useMemo(() => {
        return getAllPossibleCombinations(variantOptions);
    }, [variantOptions]);

    // Helper to find existing rule for a combination
    const getRuleForCombination = (combination: Record<string, string>) => {
        return rules.find(rule =>
            Object.entries(rule.combination).every(([key, value]) => combination[key] === value) &&
            Object.keys(rule.combination).length === Object.keys(combination).length
        );
    };

    // Helper to get display name for a combination
    const getCombinationLabel = (combination: Record<string, string>) => {
        return Object.entries(combination)
            .map(([key, valueId]) => {
                const option = variantOptions.find(o => o.name === key);
                const value = option?.values.find(v => v.id === valueId);
                return `${option?.name}: ${value?.label || 'Unknown'}`;
            })
            .join(', ');
    };

    const handleToggleAvailability = (combination: Record<string, string>, currentAvailable: boolean) => {
        const existingRuleIndex = rules.findIndex(rule =>
            Object.entries(rule.combination).every(([key, value]) => combination[key] === value) &&
            Object.keys(rule.combination).length === Object.keys(combination).length
        );

        let newRules = [...rules];

        if (existingRuleIndex >= 0) {
            // Update existing rule
            newRules[existingRuleIndex] = {
                ...newRules[existingRuleIndex],
                isAvailable: !currentAvailable,
                // Reset reason if becoming available
                reason: !currentAvailable ? undefined : newRules[existingRuleIndex].reason
            };
        } else {
            // Create new rule (default is available, so if we're toggling, it means we're making it unavailable or modifying it)
            // Actually, if no rule exists, it implies "available: true". 
            // So toggling means creating a rule with "available: false".

            // However, if we want to store explicit "available: true" rules (e.g. for custom price), we can.
            // But typically we only need rules for EXCEPTIONS.
            // Let's assume we store rules for any deviation from default (default is available, standard price).

            newRules.push({
                id: crypto.randomUUID(),
                combination,
                isAvailable: !currentAvailable
            });
        }

        onChange(newRules);
    };

    const handleUpdatePrice = (combination: Record<string, string>, price: number | undefined) => {
        const existingRuleIndex = rules.findIndex(rule =>
            Object.entries(rule.combination).every(([key, value]) => combination[key] === value) &&
            Object.keys(rule.combination).length === Object.keys(combination).length
        );

        let newRules = [...rules];

        if (existingRuleIndex >= 0) {
            newRules[existingRuleIndex] = {
                ...newRules[existingRuleIndex],
                customPriceAdjustment: price
            };
        } else {
            newRules.push({
                id: crypto.randomUUID(),
                combination,
                isAvailable: true,
                customPriceAdjustment: price
            });
        }
        onChange(newRules);
    };

    const handleUpdateReason = (combination: Record<string, string>, reason: string) => {
        const existingRuleIndex = rules.findIndex(rule =>
            Object.entries(rule.combination).every(([key, value]) => combination[key] === value) &&
            Object.keys(rule.combination).length === Object.keys(combination).length
        );

        let newRules = [...rules];

        if (existingRuleIndex >= 0) {
            newRules[existingRuleIndex] = {
                ...newRules[existingRuleIndex],
                reason
            };
        } else {
            newRules.push({
                id: crypto.randomUUID(),
                combination,
                isAvailable: false, // Assume if setting reason, it might be unavailable? Or maybe just informational? 
                // Usually reason matches unavailability.
                reason
            });
        }
        onChange(newRules);
    };

    if (combinations.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Combination Rules</h3>
                <span className="text-sm text-gray-500">
                    {combinations.length} possible combinations
                </span>
            </div>

            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Combination
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price Adjustment
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Note / Reason
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {combinations.map((combination, index) => {
                                const rule = getRuleForCombination(combination);
                                const isAvailable = rule ? rule.isAvailable : true;
                                const combinationId = JSON.stringify(combination); // Simple unique key

                                return (
                                    <tr key={combinationId} className={!isAvailable ? 'bg-gray-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {getCombinationLabel(combination)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleAvailability(combination, isAvailable)}
                                                className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded ${isAvailable
                                                    ? 'text-green-700 bg-green-100 hover:bg-green-200'
                                                    : 'text-red-700 bg-red-100 hover:bg-red-200'
                                                    }`}
                                            >
                                                {isAvailable ? (
                                                    <>
                                                        <Check size={14} className="mr-1" />
                                                        Available
                                                    </>
                                                ) : (
                                                    <>
                                                        <X size={14} className="mr-1" />
                                                        Unavailable
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <input
                                                type="number"
                                                placeholder="Default"
                                                value={rule?.customPriceAdjustment ?? ''}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? undefined : Number(e.target.value);
                                                    handleUpdatePrice(combination, val);
                                                }}
                                                className="border rounded px-2 py-1 w-24 text-sm"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {!isAvailable && (
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle size={16} className="text-orange-500" />
                                                    <input
                                                        type="text"
                                                        placeholder="Reason (e.g. Out of stock)"
                                                        value={rule?.reason || ''}
                                                        onChange={(e) => handleUpdateReason(combination, e.target.value)}
                                                        className="border rounded px-2 py-1 w-full text-sm"
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
