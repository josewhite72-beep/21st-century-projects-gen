/**
 * Century 21 Projects Agent - Social Agent Engine
 * Generates social impact statement based on project name
 */

function generateSocialAgent(projectName) {
    if (!projectName) return "Students apply English for meaningful community action.";
    
    const name = projectName.toLowerCase();
    
    if (name.includes("map")) {
        return "Students contribute to spatial community awareness.";
    }
    if (name.includes("poster")) {
        return "Students promote community values through communication.";
    }
    if (name.includes("guide")) {
        return "Students create resources to help others navigate their community.";
    }
    if (name.includes("interview")) {
        return "Students connect with community members through dialogue.";
    }
    if (name.includes("survey")) {
        return "Students gather and analyze community data.";
    }
    
    return "Students apply English for meaningful community action.";
}
