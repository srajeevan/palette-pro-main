export function isVersionLessThan(current: string, latest: string): boolean {
    const parse = (v: string) => v.split('.').map(Number);
    const [cMajor, cMinor = 0, cPatch = 0] = parse(current);
    const [lMajor, lMinor = 0, lPatch = 0] = parse(latest);

    if (cMajor !== lMajor) return cMajor < lMajor;
    if (cMinor !== lMinor) return cMinor < lMinor;
    return cPatch < lPatch;
}
