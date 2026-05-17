/**
 * Century 21 Projects Agent - Exporter v3.0
 * Uses local vendor libraries (no CDN required)
 * Compatible with docx v9
 */

function exportWord() {
    // FIX: docx v9 UMD exposes itself as window.docx
    const docxLib = window.docx;

    if (!docxLib || !docxLib.Document) {
        alert('Word export library not loaded. Make sure js/vendor/docx.umd.js exists.');
        return;
    }

    const grade = document.getElementById('grade')?.value;
    const scenarioTitle = document.getElementById('scenario')?.value;

    if (!grade || !scenarioTitle) {
        const lang = window.currentLang || 'en';
        alert(lang === 'es'
            ? 'Por favor selecciona un grado y escenario primero.'
            : 'Please select a grade and scenario first.');
        return;
    }

    try {
        const {
            Document, Packer, Paragraph, TextRun,
            HeadingLevel, AlignmentType,
            Table, TableRow, TableCell, WidthType
        } = docxLib;

        const lang = window.currentLang || 'en';
        const theme = document.getElementById('theme')?.value || '';
        const projectId = document.getElementById('project')?.value || '';

        const scenario = C21Engine.getScenarioByTitle(scenarioTitle);
        const project = projectId ? C21Engine.getProjectById(scenarioTitle, projectId) : null;
        const proficiencyLevel = C21Engine.getProficiencyLevel();

        const h = lang === 'es' ? {
            title:    "PROYECTO DEL SIGLO XXI",
            s1: "I. Identificacion del Proyecto",
            s2: "II. Marco Pedagogico",
            s3: "III. Integracion del Idioma",
            s4: "IV. Integracion STEAM",
            s5: "V. Estudiante como Agente Social",
            s6: "VI. Plan de Evaluacion",
            s7: "VII. Rubrica Analitica",
            gen: "Documento generado el"
        } : {
            title:    "21ST CENTURY PROJECT",
            s1: "I. Project Identification",
            s2: "II. Pedagogical Framework",
            s3: "III. Language Integration",
            s4: "IV. STEAM Integration",
            s5: "V. Student as Social Agent",
            s6: "VI. Assessment Plan",
            s7: "VII. Analytic Rubric",
            gen: "Document generated on"
        };

        // Helper: bold label + normal value on one line
        function labelValue(label, value) {
            return new Paragraph({
                children: [
                    new TextRun({ text: label + ': ', bold: true }),
                    new TextRun({ text: value || '' })
                ],
                spacing: { after: 120 }
            });
        }

        // Helper: section heading
        function sectionHead(text) {
            return new Paragraph({
                children: [new TextRun({ text, bold: true, color: '2c5282' })],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            });
        }

        const children = [];

        // ── Title ──────────────────────────────────────────────────
        children.push(new Paragraph({
            children: [new TextRun({ text: h.title, bold: true, size: 36, color: '1a365d' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        }));

        // ── Section I ──────────────────────────────────────────────
        children.push(sectionHead(h.s1));
        const titleVal = project?.name || scenarioTitle || 'N/A';
        children.push(labelValue(lang === 'es' ? 'Titulo del Proyecto' : 'Project Title', titleVal));
        children.push(labelValue(lang === 'es' ? 'Grado' : 'Grade', grade));
        children.push(labelValue(lang === 'es' ? 'Nivel CEFR' : 'CEFR Level', proficiencyLevel || 'N/A'));
        children.push(labelValue(lang === 'es' ? 'Escenario' : 'Scenario', scenarioTitle));
        children.push(labelValue(lang === 'es' ? 'Tema' : 'Theme',
            theme || (lang === 'es' ? 'No especificado' : 'Not specified')));

        // ── Section II ─────────────────────────────────────────────
        children.push(sectionHead(h.s2));
        if (scenario?.global_objective) {
            children.push(labelValue(
                lang === 'es' ? 'Objetivo Global' : 'Global Objective',
                scenario.global_objective));
        }
        if (scenario?.communicative_focus) {
            children.push(labelValue(
                lang === 'es' ? 'Enfoque Comunicativo' : 'Communicative Focus',
                scenario.communicative_focus));
        }

        // ── Section III ────────────────────────────────────────────
        children.push(sectionHead(h.s3));
        const cefrText = adaptByCEFR(proficiencyLevel || '');
        if (cefrText) {
            children.push(new Paragraph({
                children: [new TextRun({ text: cefrText })],
                spacing: { after: 160 }
            }));
        }
        if (project?.objective) {
            children.push(labelValue(lang === 'es' ? 'Objetivo' : 'Objective', project.objective));
        }
        if (project?.skills) {
            const st = Array.isArray(project.skills) ? project.skills.join(', ') : project.skills;
            children.push(labelValue(lang === 'es' ? 'Habilidades' : 'Skills', st));
        }
        if (project?.description) {
            children.push(labelValue(lang === 'es' ? 'Descripcion' : 'Description', project.description));
        }

        // ── Section IV ─────────────────────────────────────────────
        children.push(sectionHead(h.s4));
        children.push(new Paragraph({
            children: [new TextRun({ text: generateSteamSection(grade) })],
            spacing: { after: 160 }
        }));

        // ── Section V ──────────────────────────────────────────────
        children.push(sectionHead(h.s5));
        const socialText = project?.name
            ? generateSocialAgent(project.name)
            : (lang === 'es'
                ? 'Los estudiantes aplican el ingles para accion comunitaria significativa.'
                : 'Students apply English for meaningful community action.');
        children.push(new Paragraph({
            children: [new TextRun({ text: socialText })],
            spacing: { after: 160 }
        }));
        if (project?.tech_integration) {
            children.push(labelValue(
                lang === 'es' ? 'Integracion Tecnologica' : 'Technology Integration',
                project.tech_integration));
        }

        // ── Section VI ─────────────────────────────────────────────
        children.push(sectionHead(h.s6));
        children.push(new Paragraph({
            children: [new TextRun({ text: lang === 'es'
                ? 'La evaluacion se realizara mediante observacion directa, rubricas analiticas y portafolio de evidencias.'
                : 'Assessment will be conducted through direct observation, analytic rubrics, and portfolio of evidence.'
            })],
            spacing: { after: 160 }
        }));

        // ── Section VII — Rubric Table ─────────────────────────────
        children.push(sectionHead(h.s7));

        const rubricHeaders = lang === 'es'
            ? ['Criterio', '4', '3', '2', '1']
            : ['Criteria',  '4', '3', '2', '1'];

        const rubricData = lang === 'es' ? [
            ['Precision del Idioma',    'Avanzado',     'Competente', 'Basico',    'Emergente'],
            ['Desarrollo del Contenido','Excelente',    'Bueno',      'Basico',    'Limitado'],
            ['Integracion STEAM',       'Completa',     'Adecuada',   'Parcial',   'Minima'],
            ['Colaboracion',            'Consistente',  'Activa',     'Irregular', 'Limitada'],
            ['Impacto Social',          'Significativo','Claro',      'Basico',    'Debil']
        ] : [
            ['Language Accuracy',    'Advanced',    'Proficient', 'Basic',     'Emerging'],
            ['Content Development',  'Excellent',   'Good',       'Basic',     'Limited'],
            ['STEAM Integration',    'Full',        'Adequate',   'Partial',   'Minimal'],
            ['Collaboration',        'Consistent',  'Active',     'Irregular', 'Limited'],
            ['Social Impact',        'Significant', 'Clear',      'Basic',     'Weak']
        ];

        function makeCell(text, bold = false, center = false) {
            return new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text, bold })],
                    alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT
                })]
            });
        }

        const rubricTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    tableHeader: true,
                    children: rubricHeaders.map((h, i) => makeCell(h, true, i > 0))
                }),
                ...rubricData.map(row => new TableRow({
                    children: row.map((cell, i) => makeCell(cell, i === 0, i > 0))
                }))
            ]
        });
        children.push(rubricTable);

        // ── Timestamp ──────────────────────────────────────────────
        const timestamp = new Date().toLocaleString(lang === 'es' ? 'es-PA' : 'en-US');
        children.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { before: 400 } }));
        children.push(new Paragraph({
            children: [new TextRun({ text: `${h.gen}: ${timestamp}`, italics: true, size: 18, color: '718096' })],
            alignment: AlignmentType.RIGHT
        }));

        // ── Build & download ───────────────────────────────────────
        const doc = new Document({
            sections: [{ children }]
        });

        Packer.toBlob(doc).then(blob => {
            const safe = scenarioTitle.replace(/\s+/g, '_').replace(/[^\w-]/g, '');
            const fileName = `C21_Project_${grade}_${safe}_${lang.toUpperCase()}.docx`;
            saveAs(blob, fileName);
        }).catch(error => {
            console.error('Packer error:', error);
            alert('Error generating file: ' + error.message);
        });

    } catch (error) {
        console.error('exportWord error:', error);
        alert('Export failed: ' + error.message);
    }
}
