export const predefinedFormulaLibrary = {
    "greeness": {
        "expression": "tree",
    },
    "openness": {
        "expression": "sky",
    },
    "imageability": {
        "name": "imageability",
        "expression": "building + miscellaneous",
        "semanticIdExpression": "0 + 7"
    },
    "enclosure": {
        "name": "enclosure",
        "expression": "( building + tree ) / ( road + surface + sidewalk + miscellaneous + building + tree )",
        "semanticIdExpression": "( 0 + 5 ) / ( 2 + 4 + 3 + 7 + 0 + 5 )"
    },
    "walkability": {
        "name": "walkability",
        "expression": "sidewalk / ( road + sidewalk )",
        "semanticIdExpression": "3 / ( 2 + 3 )"
    },
    "serenity": {
        "name": "serenity",
        "expression": "water + sky",
        "semanticIdExpression": "1 + 6"
    }
}