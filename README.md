# Family Tree Interface

A Directus interface extension that displays a visual family tree for Person items, showing parent-child relationships and marriages.

## Features

- **Automatic Family Tree Visualization**: Displays family relationships starting from the current Person item
- **Merged Children**: Combines children from both `children_father` and `children_mother` relationships, removing duplicates
- **Spouse Display**: Shows all spouses from the `married_to` relationship
- **Recursive Tree**: Displays children and their descendants in a hierarchical tree structure
- **Theme Integration**: Uses Directus theme variables for consistent styling

## Installation

### Via npm (Recommended)

```bash
npm install @phillipmalboeuf/directus-interface-family-tree
```

The extension will be automatically available in your Directus instance after installation and restart.

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/phillipmalboeuf/family-tree.git
   cd family-tree
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Link it to your local Directus instance:
   ```bash
   npm run link
   ```

## Usage

1. Add the "Family Tree" interface to a Person collection field (must be of type `alias`)
2. When viewing a Person item, the interface will automatically:
   - Load the current Person's data
   - Fetch related children from `children_father` and `children_mother` fields
   - Fetch spouses from the `married_to` field
   - Display everything in a visual tree structure

## Requirements

- Directus 10.10.0 or higher
- A Person collection with the following relationship fields:
  - `children_father` (O2M relation to Person)
  - `children_mother` (O2M relation to Person)
  - `married_to` (M2M or M2O relation to Person)

## Development

```bash
# Development mode with watch
npm run dev

# Build for production
npm run build

# Validate extension
npm run validate
```

## Publishing to npm

If you want to publish updates to npm:

1. **Login to npm** (if not already):
   ```bash
   npm login
   ```

2. **Update version** in `package.json`:
   ```bash
   npm version patch  # or minor, or major
   ```

3. **Publish**:
   ```bash
   npm publish --access public
   ```

   Note: The `prepublishOnly` script will automatically build the extension before publishing.

## License

MIT
