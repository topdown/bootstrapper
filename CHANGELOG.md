# Change Log

All notable changes to the "bootstrapper" extension will be documented in this file.

## [0.2.0] - 2025-01-19

### Added
- **Community Blueprints**: Browse and download blueprints from GitHub community repository
- **GitHub Integration**: Fetch blueprints directly from configured community repository  
- **README Support**: Enhanced blueprint structure with documentation support
- **Blueprint Documentation**: View detailed README files for community blueprints in VS Code webview
- **Repository Configuration**: Customizable community repository setting
- **Enhanced UI**: New "Browse Community Blueprints" command and interface integration
- **Progress Tracking**: Download progress indicators for community blueprints
- **Auto-tagging**: Community blueprints automatically tagged for easy identification

### Features
- **Community Repository Access**: Browse blueprints from `topdown/Bootstrapper-Blueprints` by default
- **Dual Format Support**: Support for both legacy JSON files and new folder-based structure (blueprint.json + README.md)
- **Rich Documentation**: In-app README viewer with download integration
- **Seamless Integration**: Community blueprints work exactly like local blueprints once downloaded
- **Smart Discovery**: Automatic detection of blueprints with or without documentation
- **Repository Flexibility**: Configurable community repository for organizations

### Configuration Options
- `bootstrapper.communityRepository`: GitHub repository for community blueprints (format: owner/repo)

### Commands
- `bootstrapper.browseCommunityBlueprints`: Browse and download community blueprints

### UI Enhancements
- Added "Browse Community Blueprints" option in blueprint management interface
- Community blueprints show "• Has README" indicator when documentation is available
- "View README" and "Download" options for enhanced decision-making
- Beautiful webview for README display with integrated download functionality

## [0.1.1] - 2025-01-10

### Fixed
- **Template Variables**: Fixed placeholder replacement to support both `{{VARIABLE}}` and `VARIABLE` formats for backward compatibility
- **Project Creation**: Resolved issue where `PROJECT_NAME_PASCAL` and other variables without double curly braces were not being replaced
- **Error Prevention**: Added word boundary matching for variables without braces to prevent unintended replacements

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