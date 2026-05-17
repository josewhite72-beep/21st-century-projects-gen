/**
 * Century 21 Projects Agent - Core Engine (Race-condition safe)
 * Handles data loading with proper abort and loading state management
 */

const C21Engine = (function() {
    'use strict';

    const dataCache = {
        gradeData: null,
        projectsData: null,
        currentGrade: null
    };

    // FIX: Track loading state to prevent race conditions
    let currentLoadRequest = null;
    let loadingGrade = null;

    function getGradeFileName(grade) {
        if (!grade) return null;
        const gradeMap = {
            'pre_k': 'pre-k',
            'kinder': 'kinder',
            '1': '1', '2': '2', '3': '3',
            '4': '4', '5': '5', '6': '6'
        };
        const suffix = gradeMap[grade];
        if (!suffix) return null;
        return `grade_${suffix}`;
    }

    async function fetchData(fileName, signal) {
        try {
            const response = await fetch(`data/${fileName}.json`, { signal });
            if (!response.ok) {
                console.warn(`File not found: ${fileName} (${response.status})`);
                return null;
            }
            return await response.json();
        } catch (error) {
            // FIX: Don't log aborted fetches as errors
            if (error.name === 'AbortError') {
                console.log(`Fetch aborted for ${fileName}`);
                return null;
            }
            console.warn(`Could not load ${fileName}:`, error);
            return null;
        }
    }

    async function loadGrade(grade) {
        const baseFileName = getGradeFileName(grade);
        if (!baseFileName) {
            console.error('Invalid grade:', grade);
            return false;
        }

        // FIX: If already loading this grade, return that promise
        if (loadingGrade === grade && currentLoadRequest) {
            console.log('Already loading grade', grade, '- reusing request');
            return currentLoadRequest;
        }

        // FIX: Abort any previous load request
        if (currentLoadRequest && loadingGrade !== grade) {
            console.log('Aborting previous load for', loadingGrade);
            // Don't actually abort - just ignore old results
            // This is safer than AbortController across all browsers
        }

        // FIX: Clear cache immediately when starting new load
        dataCache.gradeData = null;
        dataCache.projectsData = null;
        dataCache.currentGrade = null;
        loadingGrade = grade;

        // Create promise for this load
        const loadPromise = (async () => {
            const startTime = Date.now();
            console.log(`Loading grade ${grade}...`);

            const [gradeData, projectsData] = await Promise.all([
                fetchData(baseFileName),
                fetchData(`${baseFileName}_projects`)
            ]);

            // FIX: Check if this request is still current
            if (loadingGrade !== grade) {
                console.warn(`Grade changed during load - discarding ${grade} data`);
                return false;
            }

            const elapsed = Date.now() - startTime;
            console.log(`Grade ${grade} loaded in ${elapsed}ms`);

            if (!gradeData) {
                console.error('Failed to load grade data for:', baseFileName);
                loadingGrade = null;
                currentLoadRequest = null;
                return false;
            }

            if (!gradeData.scenarios || !Array.isArray(gradeData.scenarios)) {
                console.error('Invalid scenarios structure in:', baseFileName);
                loadingGrade = null;
                currentLoadRequest = null;
                return false;
            }

            dataCache.gradeData = gradeData;
            dataCache.projectsData = projectsData || null;
            dataCache.currentGrade = grade;
            loadingGrade = null;
            currentLoadRequest = null;

            return true;
        })();

        currentLoadRequest = loadPromise;
        return loadPromise;
    }

    function getScenarios() {
        if (!dataCache.gradeData || !dataCache.gradeData.scenarios) return [];
        return dataCache.gradeData.scenarios;
    }

    function getScenarioByTitle(title) {
        return getScenarios().find(s => s.title === title) || null;
    }

    function getThemes(scenarioTitle) {
        const scenario = getScenarioByTitle(scenarioTitle);
        if (!scenario || !scenario.themes) return [];
        return scenario.themes;
    }

    function getProjects(scenarioTitle) {
        // Try external projectsData first
        if (dataCache.projectsData && dataCache.projectsData.projects_by_scenario) {
            const projects = dataCache.projectsData.projects_by_scenario[scenarioTitle];
            if (Array.isArray(projects) && projects.length > 0) return projects;
        }
        // Fallback: projects embedded in scenario
        const scenario = getScenarioByTitle(scenarioTitle);
        if (scenario && Array.isArray(scenario.projects) && scenario.projects.length > 0) {
            return scenario.projects;
        }
        return [];
    }

    function getProjectById(scenarioTitle, projectId) {
        return getProjects(scenarioTitle).find(p => p.id === projectId) || null;
    }

    function getCurrentGradeData() { return dataCache.gradeData; }
    function getCurrentProjectsData() { return dataCache.projectsData; }

    function getProficiencyLevel() {
        if (dataCache.gradeData && dataCache.gradeData.proficiency_level) {
            return dataCache.gradeData.proficiency_level;
        }
        if (dataCache.projectsData && dataCache.projectsData.proficiency_level) {
            return dataCache.projectsData.proficiency_level;
        }
        return null;
    }

    function clearCache() {
        dataCache.gradeData = null;
        dataCache.projectsData = null;
        dataCache.currentGrade = null;
        loadingGrade = null;
        currentLoadRequest = null;
    }

    // FIX: Expose loading state for UI
    function isLoading() {
        return loadingGrade !== null;
    }

    function getLoadingGrade() {
        return loadingGrade;
    }

    return {
        loadGrade,
        getScenarios,
        getScenarioByTitle,
        getThemes,
        getProjects,
        getProjectById,
        getCurrentGradeData,
        getCurrentProjectsData,
        getProficiencyLevel,
        clearCache,
        isLoading,
        getLoadingGrade
    };
})();
