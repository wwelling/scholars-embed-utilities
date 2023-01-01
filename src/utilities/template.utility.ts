import * as Handlebars from 'handlebars/dist/handlebars';

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
            templateFunction = Handlebars.compile(template);
            cache.set(hash, templateFunction);
        }
        return templateFunction;
    }
    return () => '';
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

const getTags = (taggable: any): any[] => {
    const tags = [];
    for (const i in taggable) {
        if (taggable.hasOwnProperty(i) && taggable[i].tags) {
            for (const j in taggable[i].tags) {
                if (taggable[i].tags.hasOwnProperty(j) && tags.indexOf(taggable[i].tags[j]) < 0) {
                    tags.push(taggable[i].tags[j]);
                }
            }
        }
    }
    tags.sort((t1, t2) => Number(t1.split(' ')[0]) > Number(t2.split(' ')[0]) ? 1 : -1);
    return tags;
};

const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

const initializeTemplateHelpers = (mapping: any = {}) => {
    Handlebars.registerHelper('formalize', (value) => formalize(value, mapping));

    Handlebars.registerHelper('inArray', (array, value, options) => {
        // fallback...
        array = (array instanceof Array) ? array : [array];
        return (array.indexOf(value) >= 0)
            ? options.fn(this)
            : options.inverse(this);
    });

    Handlebars.registerHelper('replace', (value, arg1, arg2) => {
        if (Array.isArray(value)) {
            const values = [];
            for (const entry of value) {
                values.push(entry.replace(arg1, arg2));
            }
            return values;
        }
        return value.replace(arg1, arg2);
    });

    Handlebars.registerHelper('toYear', (value) => {
        if (value !== undefined) {
            const date = new Date(value);
            value = Number(date.getUTCFullYear());
        }
        return value;
    });

    Handlebars.registerHelper('toLocaleDateString', (value) => {
        if (value !== undefined) {
            const date = new Date(value);
            value = date.toLocaleDateString();
        }
        return value;
    });

    Handlebars.registerHelper('toDateString', (value) => {
        if (value !== undefined) {
            const date = new Date(value);
            value = date.toDateString();
        }
        return value;
    });

    Handlebars.registerHelper('toSimpleDate', (value) => {
        if (value !== undefined) {
            const date = new Date(value);
            value = months[date.getUTCMonth()] + ' ' + date.getUTCDate() + ', ' + date.getFullYear();
        }
        return value;
    });

    Handlebars.registerHelper('snippet', (snippet, value) => {
        if (snippet !== undefined) {
            if (snippet.length < (value !== undefined ? value.length : 80)) {
                snippet = snippet + ' ...';
            }
            if (snippet.substring(0, 5) !== value.substring(0, 5) && snippet.indexOf('<') >= 5) {
                snippet = '...' + snippet;
            }
        }
        return snippet;
    });

    Handlebars.registerHelper('truncate', (value, length) => {
        if (value !== undefined) {
            if (value.length > length !== undefined ? length : 80) {
                value = value.substring(0, length - 1) + ' ...';
            }
        }
        return value;
    });

    Handlebars.registerHelper('toDate', (value) => value !== undefined ? new Date(value).toISOString() : value);

    Handlebars.registerHelper('workByStudent', (workByStudent, options) => {
        if (workByStudent.label) {
            const parts = workByStudent.label.match(/(^.*\)\.) (.*?\.) ([Master's|Doctoral|Capstone].*\.$)/);
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

    Handlebars.registerHelper('showPositionForPreferredTitle', (positions, preferredTitle, options) => {
        const positionsCount = positions.length;
        let organizationForTitle;
        for (let i = 0; i < positionsCount; i++) {
            const position = positions[i];
            if (position.label.startsWith(preferredTitle)) {
                organizationForTitle = position.organizations[0];
                break;
            }
        }
        return options.fn(organizationForTitle);
    });

    Handlebars.registerHelper('eachSortedPosition', (positions, hrJobTitle, options) => {
        let positionsClone = positions.slice();
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
        positionsClone = positionsClone.sort(positionSorter(hrJobTitle));
        let out = '';
        for (let i = positionsClone.length - 1; i >= 0; i--) {
            if (positionsClone.hasOwnProperty(i)) {
                out += options.fn(positionsClone[i]);
            }
        }
        return out;
    });

    Handlebars.registerHelper('eachSorted', (resources, field, direction, isDate, options) => {
        direction = (direction && direction.toLowerCase() === 'asc') ? [1, -1] : [-1, 1];
        resources = resources.sort((r1, r2) => {
            const v1 = isDate ? new Date(r1[field]) : r1[field];
            const v2 = isDate ? new Date(r2[field]) : r2[field];
            if (v1 > v2) {
                return direction[0];
            }
            if (v1 < v2) {
                return direction[1];
            }
            return 0;
        });
        let out = '';
        for (const i in resources) {
            if (resources.hasOwnProperty(i)) {
                out += options.fn(resources[i]);
            }
        }
        return out;
    });

    Handlebars.registerHelper('tags', (taggable, options) => {
        const tags = getTags(taggable);
        let out = '';
        for (const i in tags) {
            if (tags.hasOwnProperty(i)) {
                out += options.fn(tags[i]);
            }
        }
        return out;
    });

    Handlebars.registerHelper('hasTags', function (taggable, options) {
        const tags = getTags(taggable);
        if (tags.length > 0) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    Handlebars.registerHelper('toUNGoal', (value) => {
        if (value !== undefined) {
            return 'SDG ' + value.split(' ')[0];
        }
        return value;
    });

    Handlebars.registerHelper('toUNGoalBadge', (value) => {
        if (value !== undefined) {
            return 'badge-sdg-' + value.split(' ')[0];
        }
        return value;
    });

    Handlebars.registerHelper('sectionPage', (resources, page, options) => {
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

    Handlebars.registerHelper('sectionItem', (resource, section) => {
        const renderSection = Handlebars.compile(section.template);
        return renderSection(resource);
    });

    Handlebars.registerHelper('when', function (leftOperand, operator, rightOperand, options) {
        const operators = {
            '==': (l, r) => l === r,
            '!=': (l, r) => l !== r,
            '>': (l, r) => Number(l) > Number(r),
            '<': (l, r) => Number(l) < Number(r),
            '>=': (l, r) => Number(l) >= Number(r),
            '<=': (l, r) => Number(l) <= Number(r),
            '~': (l, r) => l.indexOf(r) >= 0,
            '!~': (l, r) => l.indexOf(r) < 0
        };
        const result = operators[operator](leftOperand, rightOperand);
        if (result) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    Handlebars.registerHelper('increment', (value) => Number(value) + 1);

    Handlebars.registerHelper('decrement', (value) => Number(value) - 1);
};

export {
    compileTemplate,
    getTemplateFunction,
    getParsedTemplateFunction,
    initializeTemplateHelpers
};
