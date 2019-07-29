import { Page, WindowDimensions } from '../model';

export const pagination = (page: Page, windowDimensions: WindowDimensions): number[] => {

    let pages: number[] = [];

    const maxSize = windowDimensions ? windowDimensions.width < 576 ? 1 : windowDimensions.width < 768 ? 3 : 5 : 3;

    for (let i = 1; i <= page.totalPages; i++) {
        pages.push(i);
    }

    // apply maxSize if necessary
    if (maxSize > 0 && page.totalPages > maxSize) {
        let start = 0;
        let end = page.totalPages;

        const leftOffset = Math.floor(maxSize / 2);
        const rightOffset = maxSize % 2 === 0 ? leftOffset - 1 : leftOffset;

        if (page.number <= leftOffset) {
            // very beginning, no rotation -> [0..maxSize]
            end = maxSize;
        } else if (page.totalPages - page.number < leftOffset) {
            // very end, no rotation -> [len-maxSize..len]
            start = page.totalPages - maxSize;
        } else {
            // rotate
            start = page.number - leftOffset - 1;
            end = page.number + rightOffset;
        }

        pages = pages.slice(start, end);

        if (start > 0) {
            if (start > 1) {
                pages.unshift(-1);
            }
            pages.unshift(1);
        }
        if (end < page.totalPages) {
            if (end < (page.totalPages - 1)) {
                pages.push(-1);
            }
            pages.push(page.totalPages);
        }
    }

    return pages;
};
