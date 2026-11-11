import { m } from '#lib/paraglide/messages.js';
import { getLocale } from '#lib/paraglide/runtime.js';
import { formatDateTime, fromInputValue } from '#lib/time.ts';

export type RuleValue = Record<string, string>;

export type RuleInput =
	| { kind: 'none' }
	| { kind: 'money' }
	| { kind: 'number' }
	| { kind: 'text'; placeholder: () => string }
	| { kind: 'datetime' }
	| { kind: 'select'; options: { value: string; label: () => string }[] };

export type RuleContext = { currency: string; tz: string };

export type RuleDef = {
	type: string;
	icon: string;
	input: RuleInput;
	label: () => string;
	question: () => string;
	sentence: (value: RuleValue, ctx: RuleContext) => string;
	defaultValue: () => RuleValue;
	/** Asked in the creation questionnaire, and its default answer. */
	wizard: false | 'yes' | 'no';
};

const money = (amount: string, currency: string) => {
	const n = Number(amount);
	if (!Number.isFinite(n)) return `${amount} ${currency}`;
	try {
		return new Intl.NumberFormat(getLocale() === 'pl' ? 'pl-PL' : 'en-GB', {
			style: 'currency',
			currency,
			maximumFractionDigits: n % 1 === 0 ? 0 : 2
		}).format(n);
	} catch {
		return `${n} ${currency}`;
	}
};

const giftsWord = (n: number) => {
	const cat = new Intl.PluralRules(getLocale()).select(n);
	if (cat === 'one') return m.gift_one();
	if (cat === 'few') return m.gift_few();
	return m.gift_many();
};

export const RULES: RuleDef[] = [
	{
		type: 'gift_exchange',
		icon: '🎁',
		input: { kind: 'none' },
		label: m.rule_gift_exchange_label,
		question: m.rule_gift_exchange_q,
		sentence: () => m.rule_gift_exchange_s(),
		defaultValue: () => ({}),
		wizard: 'yes'
	},
	{
		type: 'max_cost',
		icon: '💰',
		input: { kind: 'money' },
		label: m.rule_max_cost_label,
		question: m.rule_max_cost_q,
		sentence: (v, ctx) => m.rule_max_cost_s({ amount: money(v.amount ?? '', ctx.currency) }),
		defaultValue: () => ({ amount: '100' }),
		wizard: 'yes'
	},
	{
		type: 'secrecy',
		icon: '🤫',
		input: {
			kind: 'select',
			options: [
				{ value: 'until_party', label: m.rule_secrecy_opt_until_party },
				{ value: 'forever', label: m.rule_secrecy_opt_forever }
			]
		},
		label: m.rule_secrecy_label,
		question: m.rule_secrecy_q,
		sentence: (v) =>
			v.option === 'forever' ? m.rule_secrecy_s_forever() : m.rule_secrecy_s_until_party(),
		defaultValue: () => ({ option: 'until_party' }),
		wizard: 'yes'
	},
	{
		type: 'ready_by',
		icon: '⏰',
		input: { kind: 'datetime' },
		label: m.rule_ready_by_label,
		question: m.rule_ready_by_q,
		sentence: (v, ctx) =>
			m.rule_ready_by_s({
				datetime: formatDateTime(fromInputValue(v.at, ctx.tz), getLocale(), ctx.tz) || '…'
			}),
		defaultValue: () => ({ at: '' }),
		wizard: 'yes'
	},
	{
		type: 'restrictions',
		icon: '🚫',
		input: { kind: 'text', placeholder: m.rule_restrictions_ph },
		label: m.rule_restrictions_label,
		question: m.rule_restrictions_q,
		sentence: (v) => m.rule_restrictions_s({ text: v.text || '…' }),
		defaultValue: () => ({ text: '' }),
		wizard: 'no'
	},
	{
		type: 'signed',
		icon: '✍️',
		input: {
			kind: 'select',
			options: [
				{ value: 'recipient', label: m.rule_signed_opt_recipient },
				{ value: 'giver', label: m.rule_signed_opt_giver },
				{ value: 'both', label: m.rule_signed_opt_both }
			]
		},
		label: m.rule_signed_label,
		question: m.rule_signed_q,
		sentence: (v) =>
			v.option === 'giver'
				? m.rule_signed_s_giver()
				: v.option === 'both'
					? m.rule_signed_s_both()
					: m.rule_signed_s_recipient(),
		defaultValue: () => ({ option: 'recipient' }),
		wizard: 'yes'
	},
	{
		type: 'wrapped',
		icon: '🎀',
		input: { kind: 'none' },
		label: m.rule_wrapped_label,
		question: m.rule_wrapped_q,
		sentence: () => m.rule_wrapped_s(),
		defaultValue: () => ({}),
		wizard: 'yes'
	},
	{
		type: 'follow_wishlist',
		icon: '📝',
		input: { kind: 'none' },
		label: m.rule_follow_wishlist_label,
		question: m.rule_follow_wishlist_q,
		sentence: () => m.rule_follow_wishlist_s(),
		defaultValue: () => ({}),
		wizard: 'yes'
	},
	{
		type: 'handmade_welcome',
		icon: '🧶',
		input: { kind: 'none' },
		label: m.rule_handmade_welcome_label,
		question: m.rule_handmade_welcome_q,
		sentence: () => m.rule_handmade_welcome_s(),
		defaultValue: () => ({}),
		wizard: 'no'
	},
	{
		type: 'gift_count',
		icon: '🔢',
		input: { kind: 'number' },
		label: m.rule_gift_count_label,
		question: m.rule_gift_count_q,
		sentence: (v) => {
			const n = Math.max(1, Math.floor(Number(v.n) || 1));
			return m.rule_gift_count_s({ n: String(n), gifts: giftsWord(n) });
		},
		defaultValue: () => ({ n: '1' }),
		wizard: 'no'
	},
	{
		type: 'theme',
		icon: '🎨',
		input: { kind: 'text', placeholder: m.rule_theme_ph },
		label: m.rule_theme_label,
		question: m.rule_theme_q,
		sentence: (v) => m.rule_theme_s({ text: v.text || '…' }),
		defaultValue: () => ({ text: '' }),
		wizard: 'no'
	},
	{
		type: 'handover',
		icon: '🎄',
		input: { kind: 'text', placeholder: m.rule_handover_ph },
		label: m.rule_handover_label,
		question: m.rule_handover_q,
		sentence: (v) => m.rule_handover_s({ text: v.text || '…' }),
		defaultValue: () => ({ text: '' }),
		wizard: 'no'
	},
	{
		type: 'guess_santa',
		icon: '🕵️',
		input: { kind: 'none' },
		label: m.rule_guess_santa_label,
		question: m.rule_guess_santa_q,
		sentence: () => m.rule_guess_santa_s(),
		defaultValue: () => ({}),
		wizard: 'no'
	},
	{
		type: 'no_regifting',
		icon: '♻️',
		input: { kind: 'none' },
		label: m.rule_no_regifting_label,
		question: m.rule_no_regifting_q,
		sentence: () => m.rule_no_regifting_s(),
		defaultValue: () => ({}),
		wizard: 'no'
	},
	{
		type: 'gift_receipt',
		icon: '🧾',
		input: { kind: 'none' },
		label: m.rule_gift_receipt_label,
		question: m.rule_gift_receipt_q,
		sentence: () => m.rule_gift_receipt_s(),
		defaultValue: () => ({}),
		wizard: 'no'
	},
	{
		type: 'dress_code',
		icon: '🧣',
		input: { kind: 'text', placeholder: m.rule_dress_code_ph },
		label: m.rule_dress_code_label,
		question: m.rule_dress_code_q,
		sentence: (v) => m.rule_dress_code_s({ text: v.text || '…' }),
		defaultValue: () => ({ text: '' }),
		wizard: 'no'
	},
	{
		type: 'potluck',
		icon: '🥧',
		input: { kind: 'text', placeholder: m.rule_potluck_ph },
		label: m.rule_potluck_label,
		question: m.rule_potluck_q,
		sentence: (v) => m.rule_potluck_s({ text: v.text || '…' }),
		defaultValue: () => ({ text: '' }),
		wizard: 'no'
	},
	{
		type: 'custom',
		icon: '✨',
		input: { kind: 'text', placeholder: m.rule_custom_ph },
		label: m.rule_custom_label,
		question: m.rule_custom_label,
		sentence: (v) => v.text || '…',
		defaultValue: () => ({ text: '' }),
		wizard: false
	}
];

export const RULES_BY_TYPE = new Map(RULES.map((r) => [r.type, r]));

export type RuleEntry = { type: string; value: RuleValue };

/** Validates untrusted rule input; drops unknown types and cleans values. */
export function sanitizeRules(input: unknown): RuleEntry[] {
	if (!Array.isArray(input)) return [];
	const out: RuleEntry[] = [];
	for (const raw of input.slice(0, 50)) {
		if (!raw || typeof raw !== 'object') continue;
		const def = RULES_BY_TYPE.get(String((raw as { type?: unknown }).type));
		if (!def) continue;
		const rv = ((raw as { value?: unknown }).value ?? {}) as Record<string, unknown>;
		const str = (k: string, max = 500) =>
			String(rv[k] ?? '')
				.trim()
				.slice(0, max);
		let value: RuleValue = {};
		switch (def.input.kind) {
			case 'none':
				break;
			case 'money': {
				const n = Number(str('amount').replace(',', '.'));
				if (!Number.isFinite(n) || n <= 0) continue;
				value = { amount: String(Math.round(n * 100) / 100) };
				break;
			}
			case 'number': {
				const n = Math.floor(Number(str('n')));
				if (!Number.isFinite(n) || n < 1 || n > 99) continue;
				value = { n: String(n) };
				break;
			}
			case 'text':
				if (!str('text')) continue;
				value = { text: str('text') };
				break;
			case 'datetime':
				if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str('at', 16))) continue;
				value = { at: str('at', 16) };
				break;
			case 'select': {
				const option = str('option', 50);
				const valid = def.input.options.some((o) => o.value === option);
				value = { option: valid ? option : def.input.options[0].value };
				break;
			}
		}
		out.push({ type: def.type, value });
	}
	return out;
}

export function ruleSentence(entry: RuleEntry, ctx: RuleContext): string {
	const def = RULES_BY_TYPE.get(entry.type);
	return def ? def.sentence(entry.value, ctx) : '';
}
