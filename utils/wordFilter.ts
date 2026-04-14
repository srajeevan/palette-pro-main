const BLOCKED_WORDS = [
    'fuck', 'shit', 'ass', 'bitch', 'damn', 'cunt', 'dick', 'cock',
    'nigger', 'nigga', 'faggot', 'retard', 'slut', 'whore',
    'kill yourself', 'kys',
];

export function containsBadWords(text: string): boolean {
    const lower = text.toLowerCase();
    return BLOCKED_WORDS.some((word) => lower.includes(word));
}
