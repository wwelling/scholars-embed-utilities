export const formalize = (input: string | string[], mapping: any = {}) => {
    if (Array.isArray(input)) {
        const formalValues = [];
        for (const entry of input) {
            formalValues.push(formalize(entry, mapping));
        }
        return formalValues;
    }
    for (const key in mapping) {
        if (mapping.hasOwnProperty(key) && input === key) {
            input = mapping[key];
        }
    }
    return (input as string).replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
};
