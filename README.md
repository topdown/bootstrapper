# Bootstrapper

A VS Code extension that allows you to create projects from blueprints and save your projects as reusable blueprints.

It will work in all VSCode flavored editors. Cursor, WindSurf, etc...

## Features

- **Create Projects from Blueprints**: Generate new projects using existing blueprint templates
- **Save as Blueprint**: Convert any project folder into a reusable blueprint
- **Blueprint Management**: View, edit, duplicate, export, and delete your blueprints
- **Community Blueprints**: Browse and download blueprints from the community repository
- **File Pattern Matching**: Exclude unwanted files and folders using customizable patterns

## Commands

- **Create from Blueprint**: Create a new project from an existing blueprint
- **Save as Blueprint**: Save the current project as a blueprint
- **Manage Blueprints**: View and manage your local blueprints
- **Browse Community Blueprints**: Browse and download blueprints from the community repository

## Community Blueprints

The extension now supports community blueprints through a GitHub repository. You can:

1. **Browse Community Blueprints**: Use the `Browse Community Blueprints` command to see available community blueprints
2. **View Documentation**: Many blueprints include detailed README files with usage instructions and examples
3. **Download Blueprints**: Download community blueprints directly to your local blueprints collection
4. **Use Downloaded Blueprints**: Downloaded community blueprints work just like local blueprints

### Community Repository

By default, the extension uses the [topdown/Bootstrapper-Blueprints](https://github.com/topdown/Bootstrapper-Blueprints) repository for community blueprints. You can customize this in the settings.

Community blueprints are automatically tagged with the "community" tag when downloaded.

## Configuration

The extension supports the following configuration options:

- **`bootstrapper.blueprintsPath`**: Custom path for storing blueprints. If empty, uses extension storage.
- **`bootstrapper.includeGitIgnore`**: Include .gitignore file when creating blueprints (default: true)
- **`bootstrapper.excludePatterns`**: File and folder patterns to exclude when creating blueprints
- **`bootstrapper.communityRepository`**: GitHub repository for community blueprints (format: owner/repo)

## Usage

### Creating a Project from a Blueprint

1. Use the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `Bootstrapper: Create from Blueprint`
3. Select a blueprint from your local collection or browse community blueprints
4. Choose a target directory
5. Enter a project name

### Saving a Project as a Blueprint

1. Right-click on a folder in the Explorer
2. Select `Save as Blueprint`
3. Enter blueprint details (name, description, tags)
4. The blueprint will be saved to your local collection

### Managing Blueprints

1. Use the Command Palette
2. Run `Bootstrapper: Manage Blueprints`
3. Create projects, view details, edit metadata, export, duplicate, or delete blueprints

### Browsing Community Blueprints

1. Use the Command Palette
2. Run `Bootstrapper: Browse Community Blueprints`
3. Browse available blueprints (those with README files show "• Has README")
4. For blueprints with documentation, choose "View README" to see detailed information
5. Select "Download" to add the blueprint to your local collection

## Blueprint Format

Blueprints are stored as JSON files with the following structure:

```json
{
  "name": "Example Blueprint",
  "description": "A sample blueprint description",
  "id": "unique-blueprint-id",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "tags": ["javascript", "node", "example"],
  "files": {
    "package.json": "{ \"name\": \"example\" }",
    "src/index.js": "console.log('Hello, World!');"
  },
  "folders": ["src", "test"]
}
```

## Contributing to Community Blueprints

To contribute blueprints to the community repository:

1. Fork the [Bootstrapper-Blueprints](https://github.com/topdown/Bootstrapper-Blueprints) repository
2. Create a folder for your blueprint with both files:
   - `blueprint.json` - The blueprint definition
   - `README.md` - Documentation, usage instructions, and examples
3. Submit a pull request
4. Once merged, your blueprints will be available to all users

### Recommended Repository Structure

```
Bootstrapper-Blueprints/
├── react-typescript-app/
│   ├── blueprint.json
│   └── README.md
├── node-express-api/
│   ├── blueprint.json
│   └── README.md
└── README.md (main repository README)
```

### README Template for Blueprints

Each blueprint should include a README.md with:

- **Description**: What the blueprint creates
- **Prerequisites**: Required tools, extensions, or dependencies
- **Usage**: How to use the generated project
- **Structure**: Overview of the generated file structure
- **Customization**: How to modify the blueprint for different needs

## Requirements

- VS Code 1.96.0 or higher

## License

This project is licensed under the MIT License.
