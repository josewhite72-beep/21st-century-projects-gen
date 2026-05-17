/**
 * Century 21 Projects Agent - Exporter v4.0
 * Uses AI-generated content from Groq for Word export
 */

function exportWord() {
    const docxLib = window.docx;

    if (!docxLib || !docxLib.Document) {
        alert('Word export library not loaded. Make sure js/vendor/docx.umd.js exists.');
        return;
    }

    const grade         = document.getElementById('grade')?.value;
    const scenarioTitle = document.getElementById('scenario')?.value;
    const lang          = window.currentLang || 'en';

    if (!grade || !scenarioTitle) {
        alert(lang === 'es'
            ? 'Por favor selecciona un grado y escenario primero.'
            : 'Please select a grade and scenario first.');
        return;
    }

    // ── Get AI-generated content ────────────────────────────────────
    const aiContent = window.getGeneratedContent ? window.getGeneratedContent() : null;

    if (!aiContent) {
        alert(lang === 'es'
            ? 'Primero genera el preview con IA antes de exportar a Word.'
            : 'Please generate the AI preview first before exporting to Word.');
        return;
    }

    try {
        const {
            Document, Packer, Paragraph, TextRun,
            HeadingLevel, AlignmentType,
            Table, TableRow, TableCell, WidthType
        } = docxLib;

        const theme      = document.getElementById('theme')?.value || '';
        const projectId  = document.getElementById('project')?.value || '';
        const scenario   = C21Engine.getScenarioByTitle(scenarioTitle);
        const project    = projectId ? C21Engine.getProjectById(scenarioTitle, projectId) : null;
        const profLevel  = C21Engine.getProficiencyLevel();

        const h = lang === 'es' ? {
            title: "PROYECTO DEL SIGLO XXI",
            content: "CONTENIDO GENERADO",
            rubric: "RÚBRICA ANALÍTICA",
            gen: "Documento generado el"
        } : {
            title: "21ST CENTURY PROJECT",
            content: "GENERATED CONTENT",
            rubric: "ANALYTIC RUBRIC",
            gen: "Document generated on"
        };

        // ── Helpers ─────────────────────────────────────────────────
        function para(text, opts = {}) {
            return new Paragraph({
                children: [new TextRun({
                    text,
                    bold:    opts.bold    || false,
                    italics: opts.italics || false,
                    size:    opts.size    || 22,
                    color:   opts.color   || '2d3748'
                })],
                alignment: opts.align || AlignmentType.LEFT,
                spacing:   { before: opts.before || 0, after: opts.after || 160 }
            });
        }

        function heading(text, level = 2) {
            return new Paragraph({
                children: [new TextRun({ text, bold: true, color: '1a365d', size: level === 1 ? 32 : 24 })],
                heading:  level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
                spacing:  { before: 400, after: 200 }
            });
        }

        // ── Parse AI content into Word paragraphs ───────────────────
        function parseAIContent(text) {
            const lines = text.split('\n');
            const result = [];

            lines.forEach(line => {
                const trimmed = line.trim();
                if (!trimmed) {
                    result.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 100 } }));
                    return;
                }

                // Bold headers **text**
                if (trimmed.startsWith('## ') || trimmed.startsWith('**') && trimmed.endsWith('**')) {
                    const text = trimmed.replace(/^##\s+/, '').replace(/\*\*/g, '');
                    result.push(new Paragraph({
                        children: [new TextRun({ text, bold: true, color: '2c5282', size: 24 })],
                        spacing: { before: 300, after: 150 }
                    }));
                    return;
                }

                // List items
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    const text = trimmed.replace(/^[-*]\s+/, '');
                    // Handle inline bold
                    const parts = splitBold(text);
                    result.push(new Paragraph({
                        children: [new TextRun({ text: '• ', bold: true }), ...parts],
                        indent: { left: 400 },
                        spacing: { after: 100 }
                    }));
                    return;
                }

                // Normal paragraph with possible inline bold
                const parts = splitBold(trimmed);
                result.push(new Paragraph({
                    children: parts,
                    spacing: { after: 140 }
                }));
            });

            return result;
        }

        // Split text on **bold** markers into TextRun array
        function splitBold(text) {
            const parts = text.split(/\*\*(.+?)\*\*/g);
            return parts.map((part, i) =>
                new TextRun({ text: part, bold: i % 2 === 1, size: 22, color: '2d3748' })
            );
        }

        // ── Build document ───────────────────────────────────────────
        const children = [];

        // Title
        children.push(new Paragraph({
            children: [new TextRun({ text: h.title, bold: true, size: 40, color: '1a365d' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        }));

        children.push(new Paragraph({
            children: [new TextRun({ text: '═══════════════════════════════════', color: '667eea' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        }));

        // Metadata block
        const metaItems = [
            [lang === 'es' ? 'Grado' : 'Grade', grade],
            [lang === 'es' ? 'Nivel CEFR' : 'CEFR Level', profLevel || 'N/A'],
            [lang === 'es' ? 'Escenario' : 'Scenario', scenarioTitle],
            [lang === 'es' ? 'Tema' : 'Theme', theme || (lang === 'es' ? 'No especificado' : 'Not specified')],
            [lang === 'es' ? 'Proyecto' : 'Project', project?.name || (lang === 'es' ? 'No especificado' : 'Not specified')]
        ];

        metaItems.forEach(([label, value]) => {
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: label + ': ', bold: true, size: 22 }),
                    new TextRun({ text: value, size: 22 })
                ],
                spacing: { after: 100 }
            }));
        });

        children.push(new Paragraph({
            children: [new TextRun({ text: '' })],
            spacing: { after: 300 }
        }));

        // AI-generated content
        const aiParagraphs = parseAIContent(aiContent);
        children.push(...aiParagraphs);

        // Separator
        children.push(new Paragraph({
            children: [new TextRun({ text: '─────────────────────────────────────', color: 'e2e8f0' })],
            spacing: { before: 400, after: 200 }
        }));

        // Timestamp
        const timestamp = new Date().toLocaleString(lang === 'es' ? 'es-PA' : 'en-US');
        children.push(new Paragraph({
            children: [new TextRun({
                text: `${h.gen}: ${timestamp} · Powered by Groq + LLaMA 3.3 70B`,
                italics: true, size: 18, color: '718096'
            })],
            alignment: AlignmentType.RIGHT
        }));

        // Build & download
        const doc = new Document({ sections: [{ children }] });

        Packer.toBlob(doc).then(blob => {
            const safe = scenarioTitle.replace(/\s+/g, '_').replace(/[^\w-]/g, '');
            const fileName = `C21_Project_${grade}_${safe}_${lang.toUpperCase()}.docx`;
            saveAs(blob, fileName);
        }).catch(err => {
            console.error('Packer error:', err);
            alert('Error generating file: ' + err.message);
        });

    } catch (err) {
        console.error('exportWord error:', err);
        alert('Export failed: ' + err.message);
    }
}
