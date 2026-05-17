/**
 * Century 21 Projects Agent - Application Controller
 * Integrates Groq API for AI-powered project generation
 */

(function() {
    'use strict';

    // ── Groq API Config ─────────────────────────────────────────────
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    const GROQ_MODEL   = 'llama-3.3-70b-versatile';

    // ── State ───────────────────────────────────────────────────────
    const elements = { grade: null, scenario: null, theme: null, project: null,
                       preview: null, previewContainer: null };
    const selections = { grade: null, scenario: null, theme: null, project: null };
    let isLoadingGrade = false;
    let generatedContent = null; // stores last AI-generated content for export

    // ── Init ────────────────────────────────────────────────────────
    function init() {
        elements.grade            = document.getElementById('grade');
        elements.scenario         = document.getElementById('scenario');
        elements.theme            = document.getElementById('theme');
        elements.project          = document.getElementById('project');
        elements.preview          = document.getElementById('preview');
        elements.previewContainer = document.getElementById('previewContainer');

        if (!elements.grade || !elements.scenario || !elements.theme || !elements.project) {
            console.error('Required form elements not found');
            return;
        }

        resetDropdown(elements.scenario, 'Select Scenario');
        resetDropdown(elements.theme,    'Select Theme');
        resetDropdown(elements.project,  'Select Project');
    }

    // ── Dropdown helpers ────────────────────────────────────────────
    function resetDropdown(el, text) {
        el.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = ''; opt.textContent = text;
        el.appendChild(opt);
        el.disabled = true;
    }

    function populateDropdown(el, options, valueKey, textKey) {
        const defaultText = el.querySelector('option[value=""]')?.textContent || 'Select';
        el.innerHTML = '';
        const def = document.createElement('option');
        def.value = ''; def.textContent = defaultText;
        el.appendChild(def);
        options.forEach(item => {
            const opt = document.createElement('option');
            if (typeof item === 'string') {
                opt.value = item; opt.textContent = item;
            } else {
                opt.value = valueKey ? item[valueKey] : item;
                opt.textContent = textKey ? item[textKey] : (item[valueKey] || item);
            }
            el.appendChild(opt);
        });
        el.disabled = false;
    }

    function showLoading(el, msg) {
        el.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = ''; opt.textContent = msg;
        el.appendChild(opt);
        el.disabled = true;
    }

    // ── Grade change ────────────────────────────────────────────────
    async function onGradeChange() {
        if (isLoadingGrade) return;
        const grade = elements.grade.value;
        selections.grade = grade;
        selections.scenario = selections.theme = selections.project = null;
        generatedContent = null;

        const lang = window.currentLang || 'en';
        resetDropdown(elements.scenario, lang === 'es' ? 'Seleccionar Escenario' : 'Select Scenario');
        resetDropdown(elements.theme,    lang === 'es' ? 'Seleccionar Tema'      : 'Select Theme');
        resetDropdown(elements.project,  lang === 'es' ? 'Seleccionar Proyecto'  : 'Select Project');
        if (elements.previewContainer) elements.previewContainer.classList.remove('visible');
        if (!grade) return;

        isLoadingGrade = true;
        elements.grade.disabled = true;
        showLoading(elements.scenario, lang === 'es' ? 'Cargando...' : 'Loading...');

        try {
            const loaded = await C21Engine.loadGrade(grade);
            if (!loaded) {
                alert(lang === 'es' ? 'Error cargando datos. Intenta de nuevo.' : 'Error loading grade data. Please try again.');
                resetDropdown(elements.scenario, lang === 'es' ? 'Error - Intenta de nuevo' : 'Error - Try again');
                return;
            }
            const scenarios = C21Engine.getScenarios();
            if (scenarios.length > 0) {
                populateDropdown(elements.scenario, scenarios, 'title', 'title');
            } else {
                resetDropdown(elements.scenario, lang === 'es' ? 'No hay escenarios' : 'No scenarios available');
            }
        } catch (e) {
            console.error('onGradeChange:', e);
        } finally {
            isLoadingGrade = false;
            elements.grade.disabled = false;
        }
    }

    // ── Scenario change ─────────────────────────────────────────────
    function onScenarioChange() {
        const title = elements.scenario.value;
        selections.scenario = title;
        selections.theme = selections.project = null;
        generatedContent = null;

        const lang = window.currentLang || 'en';
        resetDropdown(elements.theme,   lang === 'es' ? 'Seleccionar Tema'     : 'Select Theme');
        resetDropdown(elements.project, lang === 'es' ? 'Seleccionar Proyecto' : 'Select Project');
        if (elements.previewContainer) elements.previewContainer.classList.remove('visible');
        if (!title) return;

        const themes = C21Engine.getThemes(title);
        if (themes.length > 0) populateDropdown(elements.theme, themes);

        const projects = C21Engine.getProjects(title);
        if (projects && projects.length > 0) {
            populateDropdown(elements.project, projects, 'id', 'name');
        } else {
            resetDropdown(elements.project, lang === 'es' ? 'No hay proyectos' : 'No projects available');
        }
    }

    function onThemeChange()   { selections.theme   = elements.theme.value;   }
    function onProjectChange() { selections.project = elements.project.value; generatedContent = null; }

    // ── Groq API key management ─────────────────────────────────────
    function getApiKey() {
        return localStorage.getItem('groq_api_key') || '';
    }

    function promptApiKey() {
        const lang = window.currentLang || 'en';
        const current = getApiKey();
        const msg = lang === 'es'
            ? `Ingresa tu Groq API Key (gratuita en console.groq.com):\n${current ? '(ya tienes una guardada, déjala en blanco para mantenerla)' : ''}`
            : `Enter your Groq API Key (free at console.groq.com):\n${current ? '(you already have one saved, leave blank to keep it)' : ''}`;
        const key = prompt(msg, '');
        if (key && key.trim()) {
            localStorage.setItem('groq_api_key', key.trim());
            return key.trim();
        }
        return current;
    }

    // ── Build Groq prompt ───────────────────────────────────────────
    function buildPrompt(lang, grade, scenario, theme, project, proficiencyLevel) {
        const projectName = project?.name || scenario?.title || 'N/A';
        const scenarioTitle = scenario?.title || 'N/A';
        const themeText = theme || 'N/A';
        const cefr = proficiencyLevel || 'A1';
        const globalObj = scenario?.global_objective || '';
        const commFocus = scenario?.communicative_focus || '';

        if (lang === 'es') {
            return `Eres un experto en educación de inglés como lengua extranjera para el nuevo currículo MEDUCA Panamá (Siglo XXI). 
Genera un proyecto pedagógico completo y detallado en ESPAÑOL con la siguiente información:

- Grado: ${grade}
- Nivel CEFR: ${cefr}
- Escenario: ${scenarioTitle}
- Tema: ${themeText}
- Proyecto: ${projectName}
${globalObj ? `- Objetivo Global: ${globalObj}` : ''}
${commFocus ? `- Enfoque Comunicativo: ${commFocus}` : ''}

Genera el proyecto con estas secciones COMPLETAS Y DETALLADAS:

**I. IDENTIFICACIÓN DEL PROYECTO**
- Título del Proyecto
- Grado, Nivel CEFR, Escenario, Tema

**II. MARCO PEDAGÓGICO**
- Objetivo global del escenario
- Enfoque comunicativo
- Competencias del siglo XXI que desarrolla

**III. INTEGRACIÓN DEL IDIOMA**
- Descripción detallada de cómo los estudiantes usan el inglés
- Estructuras gramaticales específicas para nivel ${cefr}
- Vocabulario clave (mínimo 10 palabras/frases)
- Habilidades lingüísticas: speaking, listening, reading, writing

**IV. INTEGRACIÓN STEAM**
- Ciencia: conexión específica con el proyecto
- Tecnología: herramientas digitales a usar
- Ingeniería: proceso de diseño o construcción
- Arte: elemento creativo o visual
- Matemáticas: conexión numérica o lógica

**V. ESTUDIANTE COMO AGENTE SOCIAL**
- Descripción del producto final que crearán los estudiantes
- Impacto comunitario del proyecto
- Audiencia a quien va dirigido
- Cómo comparten o presentan el resultado

**VI. PLAN DE EVALUACIÓN**
- Criterios de evaluación específicos
- Tipos de evaluación: formativa y sumativa
- Portafolio de evidencias requerido

**VII. ACTIVIDADES POR SESIÓN** (mínimo 3 sesiones)
- Sesión 1: título y descripción detallada de actividades
- Sesión 2: título y descripción detallada de actividades  
- Sesión 3: título y descripción detallada de actividades

**VIII. RÚBRICA ANALÍTICA**
Tabla con criterios: Precisión del Idioma, Contenido, STEAM, Colaboración, Impacto Social
Niveles: 4 (Avanzado), 3 (Competente), 2 (Básico), 1 (Emergente)
Describe qué significa cada nivel para cada criterio.

Sé específico, práctico y alineado al nivel ${cefr}. El proyecto debe ser realizable en un aula panameña.`;
        } else {
            return `You are an expert in English as a Foreign Language education for Panama's new MEDUCA curriculum (Century 21 Projects).
Generate a complete, detailed pedagogical project in ENGLISH with the following information:

- Grade: ${grade}
- CEFR Level: ${cefr}
- Scenario: ${scenarioTitle}
- Theme: ${themeText}
- Project: ${projectName}
${globalObj ? `- Global Objective: ${globalObj}` : ''}
${commFocus ? `- Communicative Focus: ${commFocus}` : ''}

Generate the project with these COMPLETE AND DETAILED sections:

**I. PROJECT IDENTIFICATION**
- Project Title, Grade, CEFR Level, Scenario, Theme

**II. PEDAGOGICAL FRAMEWORK**
- Scenario global objective
- Communicative focus
- 21st Century competencies developed

**III. LANGUAGE INTEGRATION**
- Detailed description of how students use English
- Specific grammar structures for ${cefr} level
- Key vocabulary (minimum 10 words/phrases)
- Language skills: speaking, listening, reading, writing

**IV. STEAM INTEGRATION**
- Science: specific connection to the project
- Technology: digital tools to be used
- Engineering: design or building process
- Arts: creative or visual element
- Mathematics: numerical or logical connection

**V. STUDENT AS SOCIAL AGENT**
- Description of the final product students will create
- Community impact of the project
- Target audience
- How they share or present the result

**VI. ASSESSMENT PLAN**
- Specific assessment criteria
- Formative and summative assessment types
- Required portfolio of evidence

**VII. SESSION ACTIVITIES** (minimum 3 sessions)
- Session 1: title and detailed activity description
- Session 2: title and detailed activity description
- Session 3: title and detailed activity description

**VIII. ANALYTIC RUBRIC**
Table with criteria: Language Accuracy, Content, STEAM, Collaboration, Social Impact
Levels: 4 (Advanced), 3 (Proficient), 2 (Basic), 1 (Emerging)
Describe what each level means for each criterion.

Be specific, practical and aligned to ${cefr} level. The project must be achievable in a Panamanian classroom.`;
        }
    }

    // ── Call Groq API ───────────────────────────────────────────────
    async function callGroq(apiKey, prompt) {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 4000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err?.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    // ── Render markdown-like content to HTML ────────────────────────
    function renderContent(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/^### (.+)$/gm, '<h4 style="color:#2c5282;margin:1.2rem 0 0.4rem">$1</h4>')
            .replace(/^## (.+)$/gm,  '<h3 style="color:#2c5282;margin:1.5rem 0 0.5rem">$1</h3>')
            .replace(/^# (.+)$/gm,   '<h2 style="color:#1a365d;margin:1.5rem 0 0.5rem">$1</h2>')
            .replace(/^\* (.+)$/gm,  '<li style="margin-left:1.5rem">$1</li>')
            .replace(/^- (.+)$/gm,   '<li style="margin-left:1.5rem">$1</li>')
            .replace(/\n\n/g, '</p><p style="margin:0.5rem 0">')
            .replace(/\n/g, '<br>');
    }

    // ── Generate Preview ────────────────────────────────────────────
    async function generatePreview() {
        const lang = window.currentLang || 'en';

        if (!selections.grade || !selections.scenario) {
            alert(lang === 'es'
                ? 'Por favor selecciona un grado y escenario primero.'
                : 'Please select a grade and scenario first.');
            return;
        }

        let apiKey = getApiKey();
        if (!apiKey) {
            apiKey = promptApiKey();
            if (!apiKey) {
                alert(lang === 'es'
                    ? 'Se necesita una Groq API Key para generar el proyecto. Obtén una gratis en console.groq.com'
                    : 'A Groq API Key is required to generate the project. Get one free at console.groq.com');
                return;
            }
        }

        const scenario       = C21Engine.getScenarioByTitle(selections.scenario);
        const project        = selections.project ? C21Engine.getProjectById(selections.scenario, selections.project) : null;
        const proficiencyLevel = C21Engine.getProficiencyLevel();

        // Show loading state
        elements.preview.innerHTML = `
            <div style="text-align:center;padding:3rem 1rem">
                <div style="font-size:2rem;margin-bottom:1rem">⏳</div>
                <p style="color:#667eea;font-weight:600;font-size:1.1rem">
                    ${lang === 'es' ? 'Generando proyecto con IA...' : 'Generating project with AI...'}
                </p>
                <p style="color:#718096;font-size:0.9rem;margin-top:0.5rem">
                    ${lang === 'es' ? 'Esto puede tomar 10-20 segundos' : 'This may take 10-20 seconds'}
                </p>
            </div>`;
        elements.previewContainer.classList.add('visible');
        elements.previewContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        try {
            const prompt = buildPrompt(lang, selections.grade, scenario, selections.theme, project, proficiencyLevel);
            const content = await callGroq(apiKey, prompt);
            generatedContent = content;

            const now = new Date();
            const timestamp = now.toLocaleString(lang === 'es' ? 'es-PA' : 'en-US');

            elements.preview.innerHTML = `
                <div style="text-align:center;margin-bottom:1.5rem">
                    <h3 style="color:#1a365d;font-size:1.3rem">${lang === 'es' ? 'PROYECTO DEL SIGLO XXI' : '21ST CENTURY PROJECT'}</h3>
                    <div style="color:#718096;margin-top:0.25rem">════════════════════════</div>
                </div>
                <div style="font-family:'Segoe UI',system-ui,sans-serif;font-size:0.95rem;line-height:1.8;color:#2d3748">
                    <p style="margin:0.5rem 0">${renderContent(content)}</p>
                </div>
                <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px dashed #e2e8f0;color:#718096;font-size:0.8rem;text-align:right">
                    ${lang === 'es' ? 'Generado el' : 'Generated on'}: ${timestamp} · Powered by Groq + LLaMA 3.3
                </div>`;

        } catch (error) {
            console.error('Groq error:', error);
            const isAuth = error.message.includes('401') || error.message.toLowerCase().includes('auth');
            if (isAuth) {
                localStorage.removeItem('groq_api_key');
                alert(lang === 'es'
                    ? 'API Key inválida. Por favor ingresa una key válida de console.groq.com'
                    : 'Invalid API Key. Please enter a valid key from console.groq.com');
            } else {
                alert(lang === 'es'
                    ? `Error al generar: ${error.message}`
                    : `Generation error: ${error.message}`);
            }
            elements.previewContainer.classList.remove('visible');
        }
    }

    // ── Expose to window ────────────────────────────────────────────
    window.onGradeChange    = onGradeChange;
    window.onScenarioChange = onScenarioChange;
    window.onThemeChange    = onThemeChange;
    window.onProjectChange  = onProjectChange;
    window.generatePreview  = generatePreview;
    window.promptApiKey     = promptApiKey;
    window.getGeneratedContent = () => generatedContent;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
