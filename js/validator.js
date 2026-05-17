/**
 * Century 21 Projects Agent - Validator
 * Validates selections against loaded data
 */

const C21Validator = (function() {
    'use strict';

    /**
     * Validate current selections
     */
    function validateSelection() {
        const gradeData = C21Engine.getCurrentGradeData();
        const projectsData = C21Engine.getCurrentProjectsData();
        
        if (!gradeData || !projectsData) return false;
        
        // Get current selections from DOM
        const scenarioTitle = document.getElementById('scenario')?.value;
        const theme = document.getElementById('theme')?.value;
        const projectId = document.getElementById('project')?.value;
        
        if (!scenarioTitle) return false;
        
        // Validate scenario exists
        const scenario = C21Engine.getScenarioByTitle(scenarioTitle);
        if (!scenario) return false;
        
        // Validate theme exists in scenario (if selected)
        if (theme && scenario.themes && !scenario.themes.includes(theme)) {
            return false;
        }
        
        // Validate project exists (if selected)
        if (projectId) {
            const project = C21Engine.getProjectById(scenarioTitle, projectId);
            if (!project) return false;
        }
        
        return true;
    }

    /**
     * Check if all required selections are made
     */
    function isComplete() {
        const grade = document.getElementById('grade')?.value;
        const scenario = document.getElementById('scenario')?.value;
        
        return !!(grade && scenario);
    }

    // Public API
    return {
        validateSelection,
        isComplete
    };
})();
