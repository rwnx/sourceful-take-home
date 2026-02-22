export const getFilledArray = <T extends object>(total: number, item: T): T[] => new Array(total).fill(item)

export const SLASHID_COOKIE = `@slashid/USER_TOKEN/${process.env.NEXT_PUBLIC_ORG_ID}`