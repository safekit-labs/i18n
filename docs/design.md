# Design Decisions

## Flat Keys Only

**Nested Object Structure**: This library only supports flat translations with dot notation keys. Nested objects are not supported by design.

```typescript
// ❌ Not supported
const translations = {
  user: {
    greeting: "Hello {{name}}!",
    profile: { title: "Settings" }
  }
} as const;

// ✅ Use flat keys instead
const translations = {
  "user.greeting": "Hello {{name}}!",
  "user.profile.title": "Settings"
} as const;
```

### Why Flat Keys?

This design choice offers several benefits:

**Pros:**
- ✅ **Simpler type system** - No complex recursive type traversal needed
- ✅ **Better performance** - Key lookup is O(1) instead of nested traversal  
- ✅ **Easier tooling** - Translation management systems work better with flat keys
- ✅ **Consistent naming** - Prevents inconsistent nesting patterns across locales
- ✅ **Namespace flexibility** - Can easily scope to any level (`form.validation`, `user.settings.privacy`)

**Tradeoffs:**
- ⚠️ **Verbose keys** - `"user.profile.settings.privacy.email"` instead of nested objects
- ⚠️ **No structural validation** - Can't enforce that all `user.*` keys exist