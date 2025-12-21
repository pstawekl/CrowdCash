export const UserRoleEnum = {
    investor: 1,
    entrepreneur: 2,
    admin: 3,
} as const;

export type UserRoleEnum = typeof UserRoleEnum[keyof typeof UserRoleEnum];