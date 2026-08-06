# Workspace Rules & Skills Instructions

All AI Agents working on this project MUST strictly follow the rules defined in [`docs/rules.md`](file:///d:/mern%20projects/oil/docs/rules.md) and implement all relevant skills available under [`docs/skills`](file:///d:/mern%20projects/oil/docs/skills) for every single task.

## Mandatory Project Rules (Summary from `docs/rules.md`)

1. **Modular Architecture & File Size Limits:**
   - **Frontend:** Always split frontend code into proper, reusable React components. Never write massive monolithic components (e.g. 1000+ lines). Every distinct UI part must be its own component.
   - **Backend:** Server logic must be divided into specific files. As a general rule, a single server file **should not exceed 120 lines** unless strictly necessary.

2. **Fully Functional & Secure Implementations:**
   - **No Dummy Code:** Everything implemented must be fully functional. No dummy data, placeholder functions, or fake UI elements.
   - **Security & Stability:** Ensure zero security vulnerabilities and safe, production-ready code.

3. **Clean Code Requirements:**
   - **No Comments:** Absolutely **no code comments** should be written in generated/edited code.

4. **UI & Design Standards:**
   - **Professional UI & Icons:** Avoid amateurish or generic AI aesthetics. Use high-quality icons, custom glassmorphism, bold theme choices, dynamic micro-animations, and distinct typography (from `frontend-design`, `theme-factory`, `responsive-design`).

5. **Proactive Suggestions & Issue Reporting:**
   - **End of Task Reports:** After finishing any task, the agent MUST suggest related new features or improvements.
   - **Troubleshooting Suggestions:** If a potential flaw or issue is spotted in the codebase, the agent MUST report it and suggest an immediate fix.

6. **Dependencies & Installations:**
   - **Latest Versions Only:** Every package or framework installed must always be the latest available stable version.

7. **Interaction Standards:**
   - **No Native Alerts:** Never use native browser `alert()` or `confirm()` dialogs. Always use custom theme-aware modals or alert dialogs.

## Skills & Capabilities Matrix (`docs/skills/`)
The agent must apply the relevant skills for all tasks:
- `frontend-design`: Bold aesthetic direction, unique typography, smooth CSS/framer motion, non-generic styling.
- `responsive-design`: Three-tier styling system (Tailwind v4, custom glass effects, theme variables), mobile-first layout, touch target optimization.
- `theme-factory`: Curated font & color palettes, professional consistent themes.
- `webapp-testing`: Automated headless testing using Playwright with server lifecycle management (`with_server.py`).
- `node-express-boilerplate`: Clean modular Express API setup with security, error handling, and linting.
- `kanban`, `mcp-builder`, `docx`, `pdf`, `pptx`, `xlsx`, `algorithmic-art`, `canvas-design`: Specialized task handlers.
