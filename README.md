# Bootstrapper

A powerful VS Code extension that allows you to create projects from blueprints and save existing projects as reusable blueprints.

## Features

- 🚀 **Create Projects from Blueprints**: Quickly scaffold new projects from saved blueprints
- 💾 **Save Projects as Blueprints**: Turn any project into a reusable template
- 🏷️ **Tagging System**: Organize blueprints with custom tags
- 📁 **Smart File Management**: Automatic exclusion of common build artifacts and dependencies
- 🔧 **Template Variables**: Dynamic placeholder replacement in blueprint files
- 📂 **File Menu Integration**: Access blueprints directly from the File menu
- 🎯 **Context Menu Support**: Right-click folders to save them as blueprints

## Getting Started

### Typical Workflow

1. **Save a Project as Blueprint**: Start by creating blueprints from your existing projects
2. **Use "Manage Blueprints"**: This becomes your main command for both creating projects and managing blueprints
3. **Bootstrap New Projects**: Select "🚀 Create Project from..." to instantly scaffold new projects
4. **Iterate and Improve**: Update blueprints as your templates evolve

### Creating Your First Blueprint

1. Open a project folder in VS Code
2. Right-click the folder in the Explorer and select "Save as Blueprint"
3. Enter a name, description, and tags for your blueprint
4. Your blueprint is now saved and ready to use!

### Creating a Project from Blueprint

#### Quick Start (Recommended)
1. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Run **"Bootstrapper: Manage Blueprints"**
3. Select **"🚀 Create Project from [Blueprint Name]"** from the list
4. Choose where to create the new project
5. Enter a project name
6. Your new project will be created and can be opened immediately

#### Alternative Methods
- **File Menu**: Go to **File** → **Create from Blueprint**
- **Command Palette**: Run **"Bootstrapper: Create from Blueprint"**

Both alternative methods show the same blueprint selection interface.

## Commands

| Command | Description |
|---------|-------------|
| `Bootstrapper: Create from Blueprint` | Create a new project from an existing blueprint |
| `Bootstrapper: Save as Blueprint` | Save the current project or folder as a blueprint |
| `Bootstrapper: Manage Blueprints` | Open blueprint management interface |

## Template Variables

Blueprints support dynamic placeholder replacement. Use these variables in your blueprint files:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{PROJECT_NAME}}` | Project name as entered | `my-app` |
| `{{PROJECT_NAME_UPPER}}` | Project name in uppercase | `MY-APP` |
| `{{PROJECT_NAME_LOWER}}` | Project name in lowercase | `my-app` |
| `{{PROJECT_NAME_CAMEL}}` | Project name in camelCase | `myApp` |
| `{{PROJECT_NAME_PASCAL}}` | Project name in PascalCase | `MyApp` |
| `{{DATE}}` | Current date (YYYY-MM-DD) | `2023-12-01` |
| `{{YEAR}}` | Current year | `2023` |

## Configuration

Access these settings through VS Code Settings (search for "bootstrapper"):

### `bootstrapper.blueprintsPath`
- **Type**: `string`
- **Default**: `""` (uses extension storage)
- **Description**: Custom path for storing blueprints. If empty, uses extension storage.

### `bootstrapper.includeGitIgnore`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Include .gitignore file when creating blueprints

### `bootstrapper.excludePatterns`
- **Type**: `array`
- **Default**: `["node_modules", ".git", "dist", "build", ".DS_Store"]`
- **Description**: File and folder patterns to exclude when creating blueprints

## Menu Locations

The extension adds commands to the following locations:

- **File Menu**: "Create from Blueprint" option
- **Command Palette**: All blueprint commands
- **Explorer Context Menu**: "Save as Blueprint" when right-clicking folders

## Blueprint Management

The **"Manage Blueprints"** command is your central hub for working with blueprints. It provides:

### Primary Actions (Project Creation)
- 🚀 **Create Project from Blueprint**: One-click project creation from any blueprint
- Shows blueprint details including creation date, tags, and file count

### Management Actions
- 👁️ **View Details**: See complete file structure and blueprint information
- ✏️ **Edit Metadata**: Update name, description, and tags
- 📤 **Export**: Save blueprints as JSON files for sharing
- 📋 **Duplicate**: Create copies of existing blueprints
- 🗑️ **Delete**: Remove unwanted blueprints

### Utility Actions
- 📂 **Open Blueprints Folder**: Access the storage directory
- 🔄 **Refresh**: Reload the blueprint list

The interface prioritizes project creation while keeping management features easily accessible.

## Use Cases

### Web Development
- React app templates with TypeScript, ESLint, and Prettier
- Node.js API boilerplates with authentication
- Static site generators with common layouts

### Desktop Applications
- Electron app templates
- Cross-platform application skeletons

### Documentation
- README templates with badges and sections
- Project documentation structures

### Configuration
- Docker setups with common services
- CI/CD pipeline templates
- Development environment configurations

## Tips

1. **Start with "Manage Blueprints"**: Use this as your main entry point - it shows all blueprints with project creation as the primary action
2. **Organize with Tags**: Use descriptive tags like "react", "typescript", "api", "frontend" to easily find blueprints
3. **Use Template Variables**: Add placeholders in your files to make blueprints more dynamic
4. **Exclude Wisely**: Configure exclude patterns to avoid including build artifacts or large dependencies
5. **Share Blueprints**: Export blueprints to share with your team or across different machines
6. **Quick Project Creation**: The "🚀 Create Project from..." options make it easy to bootstrap new projects
7. **Regular Cleanup**: Use the management interface to remove outdated blueprints

## Development

To contribute to this extension:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Press `F5` to open a new Extension Development Host window
4. Test your changes in the development environment

### Building

```bash
npm run compile
```

### Watching for Changes

```bash
npm run watch
```

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.
