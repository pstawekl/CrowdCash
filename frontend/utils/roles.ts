// Enum ról zgodny z backendem (id z bazy)
export const UserRoleEnum = {
    admin: 1,
    investor: 2,
    entrepreneur: 3,
} as const;

export type UserRoleEnum = typeof UserRoleEnum[keyof typeof UserRoleEnum];
