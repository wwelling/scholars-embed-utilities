import { compile, registerHelper } from 'handlebars/dist/handlebars';

import { formalize } from './formalize.utility';

const cache: Map<number, any> = new Map<number, any>();

const hashCode = (value) => {
    let hash;
    for (let i = 0; i < value.length; i++) {
        // tslint:disable-next-line: no-bitwise
        hash = Math.imul(31, hash) + value.charCodeAt(i) | 0;
    }
    return hash;
};

const compileTemplate = (template) => {
    if (template && template.length > 0) {
        const hash = hashCode(template);
        let templateFunction = cache.get(hash);
        if (templateFunction === undefined) {
            templateFunction = compile(template);
            cache.set(hash, templateFunction);
        }
        return templateFunction;
    }
    return (context) => '';
};

const renderTemplate = (template, resource) => {
    const templateFunction = compileTemplate(template);
    return templateFunction(resource);
};

const getTemplateFunction = (template: string, additionalContext: any = {}) => (resource: any) => {
    resource = Object.assign(resource, additionalContext);
    return renderTemplate(template, resource);
};

const getParsedTemplateFunction = (template: string, additionalContext: any = {}) => {
    compileTemplate(template);
    return getTemplateFunction(template, additionalContext);
};

const initializeTemplateHelpers = (mapping: any = {}) => {
    registerHelper('formalize', (value) => formalize(value, mapping));

    registerHelper('replace', (value, arg1, arg2) => {
        if (Array.isArray(value)) {
            const values = [];
            for (const entry of value) {
                values.push(entry.replace(arg1, arg2));
            }
            return values;
        }
        return value.replace(arg1, arg2);
    });

    registerHelper('toYear', (value) => {
        if (value !== undefined) {
            const date = new Date(value);
            date.setDate(date.getDate() + 1);
            value = date.getFullYear();
        }
        return value;
    });

    registerHelper('toDate', (value) => value !== undefined ? new Date(value).toISOString() : value);

    registerHelper('workByStudent', (workByStudent, options) => {
        if (workByStudent.label) {
            const parts = workByStudent.label.match(/(^.*\)\.) (.*?\.) ([Master's|Doctoral].*\.$)/);
            if (parts) {
                if (parts.length > 1) {
                    workByStudent.authorAndDate = parts[1];
                }
                if (parts.length > 2) {
                    workByStudent.title = parts[2];
                }
                if (parts.length > 3) {
                    workByStudent.degree = parts[3];
                    if (workByStudent.degree.endsWith('.')) {
                        workByStudent.degree = workByStudent.degree.substring(0, workByStudent.degree.length - 1);
                    }
                }
            }
        }
        return options.fn(workByStudent);
    });

    registerHelper('showPositionForPreferredTitle', (positions, preferredTitle, options) => {
        const positionsCount = positions.length;
        let organizationForTitle;
        for (let i = 0; i < positionsCount; i++) {
            const position = positions[i];
            if (position.label === preferredTitle) {
                organizationForTitle = position.organizations[0];
                break;
            }
        }
        return options.fn(organizationForTitle);
    });

    registerHelper('eachSortedPosition', (positions, hrJobTitle, options) => {
        const positionSorter = (labelCheck) => {
            return (a, b) => {
                if (a.label === labelCheck) {
                    return -1;
                } else if (b.label === labelCheck) {
                    return 1;
                }
                return 0;
            };
        };
        positions = positions.sort(positionSorter(hrJobTitle));
        let out = '';
        for (const i in positions) {
            if (positions.hasOwnProperty(i)) {
                out += options.fn(positions[i]);
            }
        }
        return out;
    });

    registerHelper('subsectionPage', (resources, page, options) => {
        const pageStart = (page.number - 1) * page.size;
        const pageEnd = pageStart + page.size;
        resources = resources.slice(pageStart, pageEnd);
        let out = '';
        for (const i in resources) {
            if (resources.hasOwnProperty(i)) {
                out += options.fn(resources[i]);
            }
        }
        return out;
    });

    registerHelper('subsectionItem', (resource, subsection) => {
        const renderSubsection = compile(subsection.template);
        return renderSubsection(resource);
    });

    registerHelper('when', function (leftOperand, operator, rightOperand, options) {
        const operators = {
            '==': (l, r) => l === r,
            '!=': (l, r) => l !== r,
            '>': (l, r) => Number(l) > Number(r),
            '<': (l, r) => Number(l) < Number(r),
            '>=': (l, r) => Number(l) >= Number(r),
            '<=': (l, r) => Number(l) <= Number(r)
        };
        const result = operators[operator](leftOperand, rightOperand);
        if (result) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    registerHelper('increment', (value) => Number(value) + 1);

    registerHelper('decrement', (value) => Number(value) - 1);
};

export {
    compileTemplate,
    getTemplateFunction,
    getParsedTemplateFunction,
    initializeTemplateHelpers
};
