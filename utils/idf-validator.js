// Île-de-France postal code validator
// Departments: 75 (Paris), 77, 78, 91, 92, 93, 94, 95

const IDF_DEPARTMENTS = ['75', '77', '78', '91', '92', '93', '94', '95'];

const IDF_CITIES = [
    // Paris
    'paris',
    // Hauts-de-Seine (92)
    'nanterre', 'boulogne-billancourt', 'colombes', 'asnieres-sur-seine', 'courbevoie',
    'levallois-perret', 'issy-les-moulineaux', 'antony', 'neuilly-sur-seine', 'clichy',
    'clamart', 'rueil-malmaison', 'champigny-sur-marne', 'montrouge', 'suresnes',
    // Seine-Saint-Denis (93)
    'saint-denis', 'montreuil', 'aubervilliers', 'aulnay-sous-bois', 'drancy',
    'noisy-le-grand', 'pantin', 'bondy', 'epinay-sur-seine', 'sevran', 'rosny-sous-bois',
    // Val-de-Marne (94)
    'creteil', 'vitry-sur-seine', 'saint-maur-des-fosses', 'maisons-alfort', 'ivry-sur-seine',
    'fontenay-sous-bois', 'vincennes', 'champigny-sur-marne', 'alfortville', 'nogent-sur-marne',
    // Essonne (91)
    'evry', 'corbeil-essonnes', 'massy', 'savigny-sur-orge', 'sainte-genevieve-des-bois',
    'viry-chatillon', 'athis-mons', 'yerres', 'draveil', 'palaiseau',
    // Yvelines (78)
    'versailles', 'sartrouville', 'mantes-la-jolie', 'saint-germain-en-laye', 'poissy',
    'montigny-le-bretonneux', 'conflans-sainte-honorine', 'les-mureaux', 'plaisir', 'houilles',
    // Seine-et-Marne (77)
    'meaux', 'chelles', 'melun', 'pontault-combault', 'savigny-le-temple',
    'champs-sur-marne', 'villeparisis', 'torcy', 'roissy-en-brie', 'combs-la-ville',
    // Val-d\'Oise (95)
    'argenteuil', 'cergy', 'sarcelles', 'garges-les-gonesse', 'franconville',
    'goussainville', 'pontoise', 'bezons', 'ermont', 'villiers-le-bel'
];

/**
 * Validates if a postal code belongs to Île-de-France
 * @param {string} postalCode - French postal code (5 digits)
 * @returns {boolean}
 */
function isValidIDFPostalCode(postalCode) {
    if (!postalCode || typeof postalCode !== 'string') {
        return false;
    }

    const cleaned = postalCode.replace(/\s/g, '');
    if (cleaned.length !== 5 || !/^\d{5}$/.test(cleaned)) {
        return false;
    }

    const department = cleaned.substring(0, 2);
    return IDF_DEPARTMENTS.includes(department);
}

/**
 * Validates if a city belongs to Île-de-France
 * @param {string} city - City name
 * @returns {boolean}
 */
function isValidIDFCity(city) {
    if (!city || typeof city !== 'string') {
        return false;
    }

    const normalized = city.toLowerCase().trim();
    return IDF_CITIES.some(idfCity => normalized.includes(idfCity));
}

/**
 * Validates both city and postal code for Île-de-France
 * @param {string} city - City name
 * @param {string} postalCode - Postal code
 * @returns {object} - { valid: boolean, message: string }
 */
function validateIDFAddress(city, postalCode) {
    const postalValid = isValidIDFPostalCode(postalCode);
    const cityValid = isValidIDFCity(city);

    if (postalValid && cityValid) {
        return {
            valid: true,
            message: 'Adresse éligible pour la livraison'
        };
    }

    if (!postalValid && !cityValid) {
        return {
            valid: false,
            message: 'Désolé, les livraisons sont actuellement limitées à l\'Île-de-France. Votre ville n\'est pas encore éligible.'
        };
    }

    // Partial match - might be a typo
    return {
        valid: false,
        message: 'Veuillez vérifier votre adresse. Les livraisons sont limitées à l\'Île-de-France (départements 75, 77, 78, 91, 92, 93, 94, 95).'
    };
}

module.exports = {
    isValidIDFPostalCode,
    isValidIDFCity,
    validateIDFAddress,
    IDF_DEPARTMENTS,
    IDF_CITIES
};
