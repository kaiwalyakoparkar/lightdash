import { validateGithubToken } from '@lightdash/common';

type FieldValidator<T> = (
    fieldName: string,
) => (value: T | undefined) => string | undefined;

export const isUppercase: FieldValidator<string> = (fieldName) => (value) =>
    !value || value === value.toUpperCase()
        ? undefined
        : `${fieldName} should be uppercase`;

export const hasNoWhiteSpaces: FieldValidator<string> =
    (fieldName) => (value) =>
        !value || value.indexOf(' ') <= 0
            ? undefined
            : `${fieldName} should not have white spaces`;

export const isGitRepository: FieldValidator<string> = (fieldName) => (value) =>
    !value || value.match(/.+\/.+/)
        ? undefined
        : `${fieldName} should match the pattern "org/project"`;

export const startWithSlash: FieldValidator<string> = (fieldName) => (value) =>
    !value || value.match(/^\/.*/)
        ? undefined
        : `${fieldName} should start with a "/"`;

export const startWithHTTPSProtocol: FieldValidator<string> =
    (fieldName) => (value) =>
        !value || value.match(/^https:\/\/.*/)
            ? undefined
            : `${fieldName} should start with a "https://"`;

export const isValidGithubToken: FieldValidator<string> =
    (_fieldName) => (value) => {
        if (value) {
            const [_isValid, error] = validateGithubToken(value);
            return error;
        }
    };

// Supports values: "1" "1,2,3" "1-3" "*/5" "*"
const cronValueRegex = new RegExp(
    /^(\*\/\d)|((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*)$/,
);
export const isInvalidCronExpression: FieldValidator<string> =
    (fieldName) => (value) => {
        if (value) {
            const cronValues = value.split(' ');
            if (cronValues.length !== 5) {
                return `${fieldName} should only have 5 values separated by a space.`;
            }
            const hasInvalidValues = cronValues.some(
                (item: string) => !item.match(cronValueRegex),
            );
            return hasInvalidValues
                ? `${fieldName} has invalid values. Example of valid values: "1", "1,2,3", "1-3", "*/5" and "*".`
                : undefined;
        }
    };

const VALID_EMAIL_DOMAIN_REGEX = /^[a-zA-Z0-9][\w\.-]+\.\w{2,4}/g;
export const isValidEmailDomain = (value: string) =>
    value.match(VALID_EMAIL_DOMAIN_REGEX);
