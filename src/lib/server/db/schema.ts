import { integer, primaryKey, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

const ts = (name: string) => integer(name, { mode: 'timestamp_ms' });
const bool = (name: string) => integer(name, { mode: 'boolean' });

export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});

export const parties = sqliteTable('parties', {
	id: text('id').primaryKey(),
	code: text('code').notNull(),
	codeNorm: text('code_norm').notNull().unique(),
	name: text('name').notNull(),
	description: text('description').notNull().default(''),
	isPublic: bool('is_public').notNull().default(false),
	partyAt: ts('party_at'),
	location: text('location').notNull().default(''),
	drawAt: ts('draw_at'),
	drawnAt: ts('drawn_at'),
	drawError: text('draw_error'),
	archivedAt: ts('archived_at'),
	currency: text('currency').notNull().default('PLN'),
	createdAt: ts('created_at')
		.notNull()
		.$defaultFn(() => new Date())
});

export const members = sqliteTable(
	'members',
	{
		id: text('id').primaryKey(),
		partyId: text('party_id')
			.notNull()
			.references(() => parties.id, { onDelete: 'cascade' }),
		firstName: text('first_name').notNull().default(''),
		lastName: text('last_name').notNull().default(''),
		nickname: text('nickname').notNull().default(''),
		passcodeHash: text('passcode_hash'),
		wishlist: text('wishlist').notNull().default(''),
		avatar: text('avatar'),
		isAdmin: bool('is_admin').notNull().default(false),
		participates: bool('participates').notNull().default(true),
		createdAt: ts('created_at')
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => [index('members_party_idx').on(t.partyId)]
);

export const exclusions = sqliteTable(
	'exclusions',
	{
		id: text('id').primaryKey(),
		partyId: text('party_id')
			.notNull()
			.references(() => parties.id, { onDelete: 'cascade' }),
		requesterId: text('requester_id')
			.notNull()
			.references(() => members.id, { onDelete: 'cascade' }),
		targetId: text('target_id')
			.notNull()
			.references(() => members.id, { onDelete: 'cascade' }),
		status: text('status', { enum: ['pending', 'accepted', 'declined'] })
			.notNull()
			.default('pending'),
		createdAt: ts('created_at')
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => [index('exclusions_party_idx').on(t.partyId)]
);

export const assignments = sqliteTable(
	'assignments',
	{
		partyId: text('party_id')
			.notNull()
			.references(() => parties.id, { onDelete: 'cascade' }),
		giverId: text('giver_id')
			.notNull()
			.references(() => members.id, { onDelete: 'cascade' }),
		receiverId: text('receiver_id')
			.notNull()
			.references(() => members.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.partyId, t.giverId] })]
);

export const rules = sqliteTable(
	'rules',
	{
		id: text('id').primaryKey(),
		partyId: text('party_id')
			.notNull()
			.references(() => parties.id, { onDelete: 'cascade' }),
		type: text('type').notNull(),
		value: text('value', { mode: 'json' }).$type<Record<string, string>>().notNull(),
		position: integer('position').notNull()
	},
	(t) => [index('rules_party_idx').on(t.partyId)]
);

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	memberId: text('member_id').references(() => members.id, { onDelete: 'cascade' }),
	isSiteAdmin: bool('is_site_admin').notNull().default(false),
	expiresAt: ts('expires_at').notNull()
});

export type Party = typeof parties.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Exclusion = typeof exclusions.$inferSelect;
export type Rule = typeof rules.$inferSelect;
