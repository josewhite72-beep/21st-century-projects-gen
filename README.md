# 🎓 Century 21 Projects Agent

**Generador de Proyectos del Siglo XXI para el Nuevo Currículo de Inglés - MEDUCA Panamá**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-green.svg)]()
[![Version](https://img.shields.io/badge/version-2.0-orange.svg)]()

---

## 📱 Demo en Vivo

**[🚀 Abrir Aplicación](https://tuusuario.github.io/c21-projects-agent/)**

> Instala como PWA en tu dispositivo para usar sin conexión

---

## ✨ Características

- ✅ **Generación Automática de Proyectos**: Crea proyectos completos alineados con el currículo MEDUCA
- 📄 **Exportación a Word**: Formato MEDUCA oficial con un solo clic
- 🌐 **Bilingüe**: Interfaz en inglés y español
- 📚 **8 Grados Completos**: Pre-K hasta 6to grado
- 🎯 **Alineación Curricular**: Integración con CEFR, STEAM y competencias del siglo XXI
- 📱 **PWA**: Funciona sin conexión una vez instalada
- 🎨 **Diseño Responsivo**: Optimizado para móvil, tablet y desktop

---

## 🚀 Instalación Rápida

### Opción 1: Usar desde GitHub Pages

1. Visita: `https://tuusuario.github.io/c21-projects-agent/`
2. En tu navegador móvil, toca "Agregar a pantalla de inicio"
3. ¡Listo! Úsala como una app nativa

### Opción 2: Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/tuusuario/c21-projects-agent.git

# Entrar al directorio
cd c21-projects-agent

# Abrir con servidor local
python3 -m http.server 8000
# O con Node.js:
npx http-server

# Abrir navegador en http://localhost:8000
```

---

## 📁 Estructura del Proyecto

```
c21-projects-agent/
├── index.html                 # Página principal
├── manifest.json              # Configuración PWA
├── service-worker.js          # Service Worker para offline
├── LICENSE                    # Licencia MIT
├── README.md                  # Documentación
├── icon-192.png              # Icono PWA 192x192
├── icon-512.png              # Icono PWA 512x512
│
├── js/
│   ├── app.js                # Lógica principal de la UI
│   ├── engine.js             # Motor de generación de proyectos
│   ├── exporter.js           # Exportación a Word
│   ├── validator.js          # Validación de datos
│   ├── cefrEngine.js         # Adaptación a niveles CEFR
│   ├── steamEngine.js        # Integración STEAM
│   ├── socialAgent.js        # Dimensión de agente social
│   ├── rubricEngine.js       # Generación de rúbricas
│   └── vendor/
│       ├── docx.umd.js       # Biblioteca para generar .docx
│       └── FileSaver.js      # Biblioteca para descargas
│
└── data/
    ├── grade_pre-k.json                          # Datos Pre-K
    ├── grade_kinder.json                         # Datos Kinder
    ├── grade_1.json - grade_6.json               # Datos grados 1-6
    ├── grade_*_institutional_standards.json      # Estándares institucionales
    ├── grade_*_official_projects.json            # Proyectos oficiales
    └── scope_sequence_pk6.json                   # Secuencia curricular
```

---

## 🎯 Cómo Usar

### 1. Seleccionar Grado y Escenario

<img src="docs/screenshot-1.png" alt="Selección de grado" width="400">

1. Abre la aplicación
2. Selecciona el **Grado** (Pre-K a 6to)
3. Elige un **Escenario** (carga automáticamente)
4. Selecciona **Tema** y **Proyecto**

### 2. Generar Vista Previa

Haz clic en **"Generate Preview"** para ver:
- Información general del proyecto
- Objetivos y competencias
- Secuencia didáctica (5 lecciones)
- Integración STEAM
- Rúbrica de evaluación
- Impacto como agente social

### 3. Exportar a Word

Haz clic en **"Export to Word"** para descargar un documento `.docx` con formato oficial MEDUCA.

---

## 📚 Documentación Técnica

### Arquitectura del Sistema

```
┌─────────────┐
│  index.html │
└──────┬──────┘
       │
       ├──> app.js ──────┐
       │                 │
       ├──> engine.js ───┼──> validator.js
       │                 │
       ├──> cefrEngine ──┤
       ├──> steamEngine ─┤
       ├──> socialAgent ─┤
       └──> rubricEngine ┘
             │
             ├──> data/*.json
             │
             └──> exporter.js ──> docx.umd.js
                                     │
                                     └──> documento.docx
```

### Flujo de Datos

1. **Usuario selecciona grado** → `engine.js` carga `data/grade_X.json`
2. **Usuario selecciona escenario** → Filtra temas disponibles
3. **Usuario selecciona tema** → Filtra proyectos disponibles
4. **"Generate Preview"** → 
   - `cefrEngine.js`: Adapta contenido al nivel CEFR
   - `steamEngine.js`: Genera integración STEAM
   - `socialAgent.js`: Define impacto social
   - `rubricEngine.js`: Crea rúbrica de evaluación
5. **"Export Word"** → 
   - `exporter.js` formatea todo
   - `docx.umd.js` genera archivo .docx
   - `FileSaver.js` descarga el archivo

---

## 🔧 Personalización

### Modificar Estilos

Edita las variables CSS en `index.html`:

```css
:root {
    --primary: #2c5282;
    --secondary: #4a90e2;
    --accent: #48bb78;
    /* ... más variables */
}
```

### Agregar Nuevos Grados

1. Crea `data/grade_X.json` con la estructura:

```json
{
  "grade": "X",
  "proficiency_level": "A1.1",
  "scenarios": [
    {
      "title": "Nombre del Escenario",
      "themes": ["Tema 1", "Tema 2"],
      "global_objective": "Objetivo...",
      "projects": [
        {
          "id": "proj_001",
          "name": "Nombre del Proyecto",
          "objective": "Objetivo...",
          "skills": ["Colaboración", "Creatividad"],
          "description": "Descripción..."
        }
      ]
    }
  ]
}
```

2. Agrega la opción en `index.html`:

```html
<option value="X">Grade X</option>
```

---

## 🐛 Solución de Problemas

### "Word export library not loaded"

**Causa**: El archivo `js/vendor/docx.umd.js` no se cargó.

**Solución**:
1. Verifica que el archivo existe (debe ser ~808 KB)
2. Abre la consola del navegador (F12) y busca errores 404
3. Asegúrate de estar usando un servidor HTTP (no `file://`)

### "No projects available"

**Causa**: Archivo JSON del grado no encontrado o mal formado.

**Solución**:
1. Verifica que existe `data/grade_X.json`
2. Valida el JSON en [jsonlint.com](https://jsonlint.com)
3. Revisa la consola del navegador para ver errores específicos

### Grados no cargan al cambiar rápidamente

**Causa**: Race condition (ya resuelto en v2.0).

**Solución**: Actualiza a la última versión del repositorio.

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Para contribuir:

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Haz commit: `git commit -am 'Agrega nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

### Ideas de Contribución

- [ ] Agregar más plantillas de proyectos
- [ ] Mejorar diseño UI/UX
- [ ] Traducción a otros idiomas
- [ ] Integración con Google Classroom
- [ ] Modo oscuro
- [ ] Exportar a PDF además de Word

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 👥 Créditos

Desarrollado para el Nuevo Currículo de Inglés de MEDUCA Panamá.

**Tecnologías utilizadas:**
- [docx.js](https://github.com/dolanmiu/docx) - Generación de documentos Word
- [FileSaver.js](https://github.com/eligrey/FileSaver.js) - Descarga de archivos
- Vanilla JavaScript (sin frameworks)
- CSS Grid y Flexbox
- Service Workers para PWA

---

## 📞 Soporte

¿Problemas o preguntas?

- 📧 Email: tucorreo@ejemplo.com
- 🐛 Issues: [GitHub Issues](https://github.com/tuusuario/c21-projects-agent/issues)
- 💬 Discusiones: [GitHub Discussions](https://github.com/tuusuario/c21-projects-agent/discussions)

---

## 🗺️ Roadmap

### v2.1 (Próximamente)
- [ ] Exportar a PDF
- [ ] Modo oscuro
- [ ] Búsqueda de proyectos por palabra clave
- [ ] Historial de proyectos generados

### v3.0 (Futuro)
- [ ] Backend con base de datos
- [ ] Autenticación de usuarios
- [ ] Compartir proyectos entre docentes
- [ ] Estadísticas de uso

---

## ⭐ Muestra tu apoyo

Si este proyecto te es útil, por favor:
- Dale una ⭐ en GitHub
- Compártelo con otros docentes
- Contribuye con mejoras

---

**Hecho con ❤️ para los docentes de inglés de Panamá**
