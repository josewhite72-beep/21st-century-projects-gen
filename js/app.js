/**
 * Century 21 Projects Agent - Application Controller (Race-safe)
 * Handles UI interactions with proper loading states
 */

(function() {
    'use strict';

    const elements = {
        grade: null,
        scenario: null,
        theme: null,
        project: null,
        preview: null,
        previewContainer: null
    };

    const selections = {
        grade: null,
        scenario: null,
        theme: null,
        project: null
    };

    // FIX: Track if we're currently loading
    let isLoadingGrade = false;

    function init() {
        elements.grade = document.getElementById('grade');
        elements.scenario = document.getElementById('scenario');
        elements.theme = document.getElementById('theme');
        elements.project = document.getElementById('project');
        elements.preview = document.getElementById('preview');
        elements.previewContainer = document.getElementById('previewContainer');

        if (!elements.grade || !elements.scenario || !elements.theme || !elements.project) {
            console.error('Required form elements not found');
            return;
        }

        resetDropdown(elements.scenario, 'Select Scenario');
        resetDropdown(elements.theme, 'Select Theme');
        resetDropdown(elements.project, 'Select Project');
    }

    function resetDropdown(selectElement, defaultText) {
        selectElement.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = defaultText;
        selectElement.appendChild(defaultOption);
        selectElement.disabled = true;
    }

    function populateDropdown(selectElement, options, valueKey, textKey) {
        const defaultText = selectElement.querySelector('option[value=""]')?.textContent || 'Select';
        selectElement.innerHTML = '';
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = defaultText;
        selectElement.appendChild(defaultOption);

        options.forEach(item => {
            const option = document.createElement('option');
            if (typeof item === 'string') {
                option.value = item;
                option.textContent = item;
            } else if (typeof item === 'object' && item !== null) {
                option.value = valueKey ? item[valueKey] : item;
                option.textContent = textKey ? item[textKey] : (item[valueKey] || item);
            }
            selectElement.appendChild(option);
        });

        selectElement.disabled = false;
    }

    // FIX: Show loading state in dropdown
    function showLoading(selectElement, message) {
        selectElement.innerHTML = '';
        const loadingOption = document.createElement('option');
        loadingOption.value = '';
        loadingOption.textContent = message;
        selectElement.appendChild(loadingOption);
        selectElement.disabled = true;
    }

    async function onGradeChange() {
        // FIX: Prevent multiple simultaneous loads
        if (isLoadingGrade) {
            console.log('Already loading a grade - ignoring change');
            return;
        }

        const grade = elements.grade.value;
        selections.grade = grade;
        selections.scenario = null;
        selections.theme = null;
        selections.project = null;

        const lang = window.currentLang || 'en';

        resetDropdown(elements.scenario, lang === 'es' ? 'Seleccionar Escenario' : 'Select Scenario');
        resetDropdown(elements.theme, lang === 'es' ? 'Seleccionar Tema' : 'Select Theme');
        resetDropdown(elements.project, lang === 'es' ? 'Seleccionar Proyecto' : 'Select Project');

        if (elements.previewContainer) {
            elements.previewContainer.classList.remove('visible');
        }

        if (!grade) {
            return;
        }

        // FIX: Set loading state and show visual feedback
        isLoadingGrade = true;
        elements.grade.disabled = true;
        showLoading(elements.scenario, lang === 'es' ? 'Cargando...' : 'Loading...');

        try {
            const loaded = await C21Engine.loadGrade(grade);
            
            if (!loaded) {
                alert(lang === 'es' 
                    ? 'Error cargando datos del grado. Por favor intenta de nuevo.' 
                    : 'Error loading grade data. Please try again.');
                resetDropdown(elements.scenario, lang === 'es' ? 'Error - Intenta de nuevo' : 'Error - Try again');
                return;
            }

            const scenarios = C21Engine.getScenarios();
            if (scenarios.length > 0) {
                populateDropdown(elements.scenario, scenarios, 'title', 'title');
                elements.scenario.disabled = false;
            } else {
                resetDropdown(elements.scenario, lang === 'es' ? 'No hay escenarios' : 'No scenarios available');
            }
        } catch (error) {
            console.error('Error in onGradeChange:', error);
            alert(lang === 'es' 
                ? 'Error inesperado. Recarga la página.' 
                : 'Unexpected error. Please reload the page.');
        } finally {
            // FIX: Always clear loading state
            isLoadingGrade = false;
            elements.grade.disabled = false;
        }
    }

    function onScenarioChange() {
        const scenarioTitle = elements.scenario.value;
        selections.scenario = scenarioTitle;
        selections.theme = null;
        selections.project = null;

        const lang = window.currentLang || 'en';

        resetDropdown(elements.theme, lang === 'es' ? 'Seleccionar Tema' : 'Select Theme');
        resetDropdown(elements.project, lang === 'es' ? 'Seleccionar Proyecto' : 'Select Project');

        if (elements.previewContainer) {
            elements.previewContainer.classList.remove('visible');
        }

        if (!scenarioTitle) {
            return;
        }

        const themes = C21Engine.getThemes(scenarioTitle);
        if (themes.length > 0) {
            populateDropdown(elements.theme, themes);
            elements.theme.disabled = false;
        }

        const projects = C21Engine.getProjects(scenarioTitle);
        if (projects && projects.length > 0) {
            populateDropdown(elements.project, projects, 'id', 'name');
            elements.project.disabled = false;
        } else {
            elements.project.innerHTML = '';
            const noProjectsOption = document.createElement('option');
            noProjectsOption.value = '';
            noProjectsOption.textContent = lang === 'es' ? 'No hay proyectos disponibles' : 'No projects available';
            elements.project.appendChild(noProjectsOption);
            elements.project.disabled = true;
        }
    }

    function onThemeChange() {
        selections.theme = elements.theme.value;
    }

    function onProjectChange() {
        selections.project = elements.project.value;
    }

    function generatePreview() {
        if (!C21Validator.isComplete()) {
            const lang = window.currentLang || 'en';
            alert(lang === 'es' ? 'Por favor selecciona un grado y escenario primero.' : 'Please select a grade and scenario first.');
            return;
        }

        const lang = window.currentLang || 'en';
        const scenario = C21Engine.getScenarioByTitle(selections.scenario);
        const project = selections.project ? 
            C21Engine.getProjectById(selections.scenario, selections.project) : null;
        const proficiencyLevel = C21Engine.getProficiencyLevel();

        const headings = lang === 'es' ? {
            title: "PROYECTO DEL SIGLO XXI",
            identification: "I. IDENTIFICACION DEL PROYECTO",
            framework: "II. MARCO PEDAGOGICO",
            language: "III. INTEGRACION DEL IDIOMA",
            steam: "IV. INTEGRACION STEAM",
            socialAgent: "V. ESTUDIANTE COMO AGENTE SOCIAL",
            assessment: "VI. PLAN DE EVALUACION",
            rubric: "VII. RUBRICA ANALITICA"
        } : {
            title: "21ST CENTURY PROJECT",
            identification: "I. PROJECT IDENTIFICATION",
            framework: "II. PEDAGOGICAL FRAMEWORK",
            language: "III. LANGUAGE INTEGRATION",
            steam: "IV. STEAM INTEGRATION",
            socialAgent: "V. STUDENT AS SOCIAL AGENT",
            assessment: "VI. ASSESSMENT PLAN",
            rubric: "VII. ANALYTIC RUBRIC"
        };

        let html = `<div style="text-align: center; margin-bottom: 1.5rem;">
            <h3 style="color: #2c5282; margin-bottom: 0.5rem;">${headings.title}</h3>
            <div style="color: #718096;">========================</div>
        </div>`;

        html += `<h3 style="color: #2c5282; margin-top: 1.5rem;">${headings.identification}</h3>`;
        html += `<p style="margin-left: 1.5rem;"><strong>${lang === 'es' ? 'Titulo' : 'Title'}:</strong> ${project?.name || selections.scenario || 'N/A'}</p>`;
        html += `<p style="margin-left: 1.5rem;"><strong>${lang === 'es' ? 'Grado' : 'Grade'}:</strong> ${selections.grade}</p>`;
        html += `<p style="margin-left: 1.5rem;"><strong>${lang === 'es' ? 'Nivel CEFR' : 'CEFR Level'}:</strong> ${proficiencyLevel || 'N/A'}</p>`;
        html += `<p style="margin-left: 1.5rem;"><strong>${lang === 'es' ? 'Escenario' : 'Scenario'}:</strong> ${selections.scenario}</p>`;
        
        if (selections.theme) {
            html += `<p style="margin-left: 1.5rem;"><strong>${lang === 'es' ? 'Tema' : 'Theme'}:</strong> ${selections.theme}</p>`;
        }

        if (scenario?.global_objective || scenario?.communicative_focus) {
            html += `<h3 style="color: #2c5282; margin-top: 1.5rem;">${headings.framework}</h3>`;
            if (scenario.global_objective) {
                html += `<p style="margin-left: 1.5rem;"><strong>${lang === 'es' ? 'Objetivo Global' : 'Global Objective'}:</strong> ${scenario.global_objective}</p>`;
            }
            if (scenario.communicative_focus) {
                html += `<p style="margin-left: 1.5rem;"><strong>${lang === 'es' ? 'Enfoque Comunicativo' : 'Communicative Focus'}:</strong> ${scenario.communicative_focus}</p>`;
            }
        }

        html += `<h3 style="color: #2c5282; margin-top: 1.5rem;">${headings.language}</h3>`;
        const cefrText = adaptByCEFR(proficiencyLevel || '');
        if (cefrText) {
            html += `<p style="margin-left: 1.5rem;">${cefrText}</p>`;
        }

        if (project) {
            if (project.objective) {
                html += `<p style="margin-left: 1.5rem;"><strong>${lang === 'es' ? 'Objetivo' : 'Objective'}:</strong> ${project.objective}</p>`;
            }
            if (project.skills) {
                const skillsText = Array.isArray(project.skills) ? project.skills.join(', ') : project.skills;
                html += `<p style="margin-left: 1.5rem;"><strong>${lang === 'es' ? 'Habilidades' : 'Skills'}:</strong> ${skillsText}</p>`;
            }
            if (project.description) {
                html += `<p style="margin-left: 1.5rem;"><strong>${lang === 'es' ? 'Descripcion' : 'Description'}:</strong> ${project.description}</p>`;
            }
        }

        html += `<h3 style="color: #2c5282; margin-top: 1.5rem;">${headings.steam}</h3>`;
        const steamContent = generateSteamSection(selections.grade);
        html += `<p style="margin-left: 1.5rem;">${steamContent}</p>`;

        html += `<h3 style="color: #2c5282; margin-top: 1.5rem;">${headings.socialAgent}</h3>`;
        const socialAgentContent = project?.name ? generateSocialAgent(project.name) : 
            (lang === 'es' ? 'Los estudiantes aplican el ingles para accion comunitaria significativa.' : 
             'Students apply English for meaningful community action.');
        html += `<p style="margin-left: 1.5rem;">${socialAgentContent}</p>`;

        if (project?.tech_integration) {
            html += `<p style="margin-left: 1.5rem;"><strong>${lang === 'es' ? 'Integracion Tecnologica' : 'Technology Integration'}:</strong> ${project.tech_integration}</p>`;
        }

        html += `<h3 style="color: #2c5282; margin-top: 1.5rem;">${headings.assessment}</h3>`;
        html += `<p style="margin-left: 1.5rem;">${lang === 'es' ? 
            'La evaluacion se realizara mediante observacion directa, rubricas analiticas y portafolio de evidencias.' :
            'Assessment will be conducted through direct observation, analytic rubrics, and portfolio of evidence.'}</p>`;

        html += `<h3 style="color: #2c5282; margin-top: 1.5rem;">${headings.rubric}</h3>`;
        html += `<pre style="background: #f7fafc; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-family: monospace;">${generateRubric()}</pre>`;

        const now = new Date();
        const timestamp = now.toLocaleString(lang === 'es' ? 'es-PA' : 'en-US');
        html += `<div class="timestamp" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed #e2e8f0; color: #718096; font-size: 0.875rem;">
            ${lang === 'es' ? 'Generado el' : 'Generated on'}: ${timestamp}
        </div>`;

        elements.preview.innerHTML = html;
        
        if (elements.previewContainer) {
            elements.previewContainer.classList.add('visible');
        }
        
        elements.previewContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    window.onGradeChange = onGradeChange;
    window.onScenarioChange = onScenarioChange;
    window.onThemeChange = onThemeChange;
    window.onProjectChange = onProjectChange;
    window.generatePreview = generatePreview;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
