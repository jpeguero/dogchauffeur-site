export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

export const IS_LLC_ACTIVE = false; // Set to true once the LLC is officially filed/approved