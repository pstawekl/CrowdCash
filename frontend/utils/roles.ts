// Enum ról zgodny z backendem (id z bazy)
// id 1 = "investor"
// id 2 = "entrepreneur"
// id 3 = "admin"
export const UserRoleEnum = {
    investor: 1,
    entrepreneur: 2,
    admin: 3,
} as const;

export type UserRoleEnum = typeof UserRoleEnum[keyof typeof UserRoleEnum];
