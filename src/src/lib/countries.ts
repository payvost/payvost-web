
export interface Country {
    name: string;
    code: string;
    flag: string; // e.g., 'NG.png' or 'globe'
}

export const countries: Country[] = [
    { name: "Global", code: "global", flag: "globe" },
    { name: "Nigeria", code: "NG", flag: "NG.png" },
    { name: "United States", code: "US", flag: "US.png" },
    { name: "United Kingdom", code: "GB", flag: "GB.png" },
];
