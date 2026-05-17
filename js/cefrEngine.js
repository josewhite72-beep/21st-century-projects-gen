/**
 * Century 21 Projects Agent - CEFR Engine
 * Adapts content by CEFR proficiency level
 */

function adaptByCEFR(level) {
    if (!level) return "";
    if (level.includes("Pre-A1")) return "Language use is emergent and guided.";
    if (level.includes("A1")) return "Students produce simple structured language.";
    if (level.includes("A2")) return "Students develop structured paragraphs.";
    if (level.includes("B1")) return "Students produce coherent analytical texts.";
    return "";
}
