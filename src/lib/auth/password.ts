import "server-only";

/**
 * Server-only facade for password hashing (scrypt, §38).
 *
 * "server-only" makes any client-component import a build-time error — this is
 * exactly the bug that crashed /sign-in when the demo credentials lived here.
 * Node scripts (seed/verify) import `./hash` directly instead.
 */
export { hashPassword, verifyPassword } from "./hash";