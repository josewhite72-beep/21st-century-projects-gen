/**
 * Century 21 Projects Agent - STEAM Engine
 * Generates STEAM integration section based on grade level
 */

function generateSteamSection(level) {
    if (!level) return "";
    if (level === "pre_k" || level === "kinder") {
        return "STEAM: Observation, Counting, Creative Drawing.";
    }
    // Convert string level to number for comparison
    const numLevel = parseInt(level);
    if (!isNaN(numLevel) && numLevel <= 3) {
        return "STEAM: Science + Technology + Arts.";
    }
    return "STEAM: Science + Technology + Engineering + Arts + Mathematics.";
}
