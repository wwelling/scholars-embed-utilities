export const formalize = (input: string | string[], mapping: any = {}) => {
    if (Array.isArray(input)) {
        const formalValues = [];
        for (let i = 0; i <= input.length; i++) {
            const entry = input[i]
            if (entry !== undefined) {
                formalValues.push(formalize(entry, mapping));
            }
        }
        return formalValues;
    }
    for (const key in mapping) {
        if (mapping.hasOwnProperty(key) && input === key) {
            input = mapping[key];
        }
    }
    return input ? (input as string)
        .replace(/([a-z])([A-Z][a-z])/g, '$1 $2')
        .replace(/([A-Z][a-z])([A-Z])/g, '$1 $2')
        .replace(/([a-z])([A-Z]+[a-z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z][a-z])/g, '$1 $2')
        .replace(/([a-z]+)([A-Z0-9]+)/g, '$1 $2')

        .replace(/([A-Z]+)([A-Z][a-rt-z][a-z]*)/g, '$1 $2')
        .replace(/([0-9])([A-Z][a-z]+)/g, '$1 $2')

        .replace(/([A-Z]{2,})([0-9]{2,})/g, '$1 $2')
        .replace(/([0-9]{2,})([A-Z]{2,})/g, '$1 $2')

        .replace('_date_facets', '')
        .replace('_nested_facets', '')
        .replace('_facets', '')

        .replace(/^./, (match) => match.toUpperCase())
        .trim() : '';
};
