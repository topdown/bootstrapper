# Change Log

All notable changes to the "bootstrapper" extension will be documented in this file.

## [0.1.0] - 2025-01-10

### Added
- Initial release of Bootstrapper extension
- Create projects from blueprints functionality
- Save existing projects as blueprints
- Blueprint management interface with full CRUD operations
- Template variable support for dynamic content replacement
- File menu integration for "Create from Blueprint"
- Explorer context menu integration for "Save as Blueprint"
- Configurable blueprint storage location
- Smart file exclusion with customizable patterns
- Blueprint tagging system for organization
- Export/import blueprint functionality
- Blueprint duplication feature
- Comprehensive blueprint details viewer
- Welcome message for first-time users

### Features
- **Blueprint Creation**: Convert any project folder into a reusable template
- **Project Generation**: Create new projects from existing blueprints
- **Management Interface**: View, edit, duplicate, delete, and export blueprints
- **Template Variables**: Support for PROJECT_NAME, DATE, YEAR and various case transformations
- **Smart Exclusions**: Automatically exclude node_modules, .git, dist, build folders
- **File Menu Integration**: Easy access through VS Code's File menu
- **Context Menu Support**: Right-click folders to save as blueprints
- **Tagging System**: Organize blueprints with custom tags
- **WebView Details**: Rich blueprint information display
- **Cross-Platform**: Works on Windows, macOS, and Linux

### Configuration Options
- `bootstrapper.blueprintsPath`: Custom storage location for blueprints
- `bootstrapper.includeGitIgnore`: Control .gitignore inclusion in blueprints
- `bootstrapper.excludePatterns`: Customize file/folder exclusion patterns

### Commands
- `bootstrapper.createFromBlueprint`: Create new project from blueprint
- `bootstrapper.saveAsBlueprint`: Save project/folder as blueprint
- `bootstrapper.manageBlueprints`: Open blueprint management interface 