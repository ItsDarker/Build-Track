"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDisposableEmail = isDisposableEmail;
exports.isLikelySpamDomain = isLikelySpamDomain;
const disposable_domains_json_1 = __importDefault(require("../data/disposable_domains.json"));
function isDisposableEmail(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain)
        return false;
    return disposable_domains_json_1.default.includes(domain);
}
const SUSPICIOUS_TLDS = [
    '.tk', '.ml', '.ga', '.cf', '.gq',
    '.xyz', '.top', '.work', '.click', '.link'
];
const SPAM_KEYWORDS = [
    'spam', 'junk', 'fake', 'temp', 'trash', 'disposable',
    'throwaway', 'burner', 'temporary'
];
function isLikelySpamDomain(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain)
        return false;
    const hasSuspiciousTLD = SUSPICIOUS_TLDS.some(tld => domain.endsWith(tld));
    const hasSpamKeyword = SPAM_KEYWORDS.some(keyword => domain.includes(keyword));
    const numberCount = (domain.match(/\d/g) || []).length;
    const hasExcessiveNumbers = numberCount > 4;
    return hasSuspiciousTLD || hasSpamKeyword || hasExcessiveNumbers;
}
