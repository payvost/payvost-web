

export interface BusinessSecuritySettings {
    enforceMfa: boolean;
    sessionExpiry: number; // in minutes
    idleTimeout: number; // in minutes
    ipWhitelist?: string; // newline-separated IPs or CIDR blocks
}
