import { parsePhoneNumber, PhoneNumber } from 'libphonenumber-js';

export const normalizePhoneNumber = (input: string): string | null => {
    if (!input) return null;

    try {
        // If input has no plus sign and looks like a US number (10 digits), assume US (+1)
        // We can use 'US' as the default country for parsing
        let phoneNumber: PhoneNumber | undefined;

        // Check if it starts with +
        if (input.trim().startsWith('+')) {
            phoneNumber = parsePhoneNumber(input);
        } else {
            // logic to handle assumptions if needed, but parsePhoneNumber with default country 'US' works well
            // If the user inputs "3122856729", treating it as US
            phoneNumber = parsePhoneNumber(input, 'US');
        }

        if (phoneNumber && phoneNumber.isValid()) {
            return phoneNumber.number; // Returns E.164 (e.g., +13122856729)
        }

        return null;
    } catch (error) {
        return null; // Invalid number
    }
};

export const formatPhoneNumber = (input: string | null | undefined): string => {
    if (!input) return '';

    try {
        const phoneNumber = parsePhoneNumber(input);
        if (phoneNumber) {
            return phoneNumber.formatInternational(); // Returns +1 312 285 6334
        }
        return input;
    } catch (error) {
        return input;
    }
};
