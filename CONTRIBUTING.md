# Contributing to Echelon Texas Portal

## Development Workflow

### Branch Strategy
- `main` - Production branch, always deployable
- `develop` - Development branch for integration
- `feature/*` - Feature branches off develop
- `hotfix/*` - Critical fixes off main

### Getting Started
1. Fork/clone the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Install dependencies: `npm install`
4. Set up environment variables (copy `.env.example` to `.env`)
5. Start development server: `npm run dev`

## Code Standards

### TypeScript
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper typing for all props and function parameters
- Avoid `any` - use proper types or `unknown`

### React
- Use functional components with hooks
- Prefer custom hooks for reusable logic
- Keep components small and focused
- Use proper key props for lists
- Handle loading and error states

### Styling
- Use Tailwind CSS classes
- Follow the design system tokens in `index.css`
- Use semantic color tokens, not direct colors
- Keep responsive design in mind
- Use shadcn/ui components when possible

### Code Formatting
- ESLint configuration is included
- Prettier settings in package.json
- Run `npm run lint` before committing
- Configure your editor for auto-formatting

### File Organization
```
src/
├── components/
│   ├── ui/              # Base UI components (shadcn)
│   └── [ComponentName]/ # Feature components
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── lib/                 # Utilities
├── pages/               # Route components
└── types/               # TypeScript type definitions
```

### Naming Conventions
- Components: PascalCase (`UserProfile.tsx`)
- Files: kebab-case (`user-profile.ts`)
- Variables/functions: camelCase (`getUserData`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- CSS classes: Tailwind utility classes

## Testing
- Write tests for complex business logic
- Test custom hooks
- Test error scenarios
- Ensure accessibility compliance

## Database Changes
- Use Supabase migrations for schema changes
- Update RLS policies when adding tables
- Test policies with different user roles
- Document breaking changes

## Pull Request Process
1. Ensure your branch is up to date with develop
2. Run tests and linting: `npm run lint`
3. Build successfully: `npm run build`
4. Create descriptive PR title and description
5. Link related issues
6. Request review from team members
7. Address feedback and update PR
8. Merge after approval

## Commit Messages
Use conventional commits format:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

Example: `feat: add user profile editing functionality`

## Environment Variables
- Never commit `.env` files
- Update `.env.example` when adding new variables
- Document required vs optional variables
- Use proper prefixes (`VITE_` for client-side)

## Deployment
- `main` branch auto-deploys to production
- `develop` branch deploys to staging
- Test thoroughly in staging before merging to main
- Monitor deployments for errors

## Getting Help
- Check existing issues and documentation
- Ask in team chat for quick questions
- Create detailed issue reports for bugs
- Include reproduction steps and error messages

## Code Review Guidelines
- Be constructive and respectful
- Focus on code quality and best practices
- Check for security issues
- Verify functionality works as expected
- Ensure adequate error handling